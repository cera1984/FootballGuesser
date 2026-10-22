import {addGuess, datasetVersion, isFinished, parseStats} from './game.ts';
import type {Difficulty, Player, Progress, Stats} from './game.ts';
import {CATALOG_ID, challengePool, challengeTarget, dailyChallenge, decodeChallenge, encodeChallenge, seedForPlayer, validDate} from './challenges.ts';
import type {Challenge, Entry, Theme} from './challenges.ts';
import {loadProgress} from './storage.ts';

export type Board = {key: string; kind: 'free' | 'daily' | 'friend'; spec: Challenge;
  targetId: number; guessIds: number[]; hintUsed: boolean; date?: string};
export type Session = {version: string; active: string; free: Board; boards: Record<string, Board>;
  history: number[]; stats: Stats; onboardingDone: boolean};
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;
export const sessionKey = 'football-guesser-v3';
const complete = (board: Board) => board.guessIds.includes(board.targetId) || board.guessIds.length >= 8;
export const boardFinished = complete;

export function currentBoard(session: Session) {
  return session.active === 'free' ? session.free : session.boards[session.active];
}
export function asProgress(session: Session, board = currentBoard(session)): Progress {
  return {version: session.version, level: board.spec.level, targetId: board.targetId,
    guessIds: board.guessIds, recentIds: [board.targetId], stats: session.stats};
}
const boardKey = (entry: Entry) => entry.kind === 'daily' ? `daily:${entry.date}` : `friend:${encodeChallenge(entry.spec)}`;
export function openEntry(session: Session, players: Player[], entry: Entry | null): Session {
  if (!entry) return {...session, active: 'free'};
  const key = boardKey(entry);
  if (session.boards[key]) return {...session, active: key};
  const board: Board = {key, kind: entry.kind, spec: entry.spec, targetId: challengeTarget(players, entry.spec).id,
    guessIds: [], hintUsed: false, ...(entry.kind === 'daily' ? {date: entry.date} : {})};
  return {...session, active: key, boards: {...session.boards, [key]: board}};
}
function replaceBoard(session: Session, board: Board): Session {
  return board.kind === 'free' ? {...session, free: board} : {...session, boards: {...session.boards, [board.key]: board}};
}
export function guessInSession(session: Session, id: number, players: Player[]) {
  const board = currentBoard(session);
  const previous = asProgress(session, board);
  const next = addGuess(previous, id, players);
  if (next === previous) return session;
  return {...replaceBoard(session, {...board, guessIds: next.guessIds}), stats: next.stats};
}
export function useHint(session: Session) {
  const board = currentBoard(session);
  return board.guessIds.length < 3 || board.hintUsed || complete(board) ? session
    : replaceBoard(session, {...board, hintUsed: true});
}

export function nextFree(session: Session, players: Player[], level: Difficulty, theme: Theme, random: () => number): Session {
  const pool = challengePool(players, level, theme);
  if (!pool.length) return session;
  let history = [...session.history];
  let available = pool.filter(player => !history.includes(player.id));
  if (!available.length) {
    const last = history.at(-1), poolIds = new Set(pool.map(player => player.id));
    history = history.filter(id => !poolIds.has(id) || (pool.length > 1 && id === last));
    available = pool.filter(player => !history.includes(player.id));
  }
  const target = available[(random() >>> 0) % available.length];
  const spec = {catalog: CATALOG_ID, level, theme, seed: seedForPlayer(players, target, theme, random)};
  const free: Board = {key: 'free', kind: 'free', spec, targetId: target.id, guessIds: [], hintUsed: false};
  const abandoned = session.free.guessIds.length > 0 && !complete(session.free);
  return {...session, active: 'free', free, history: [...history.filter(id => id !== target.id), target.id],
    stats: abandoned ? {...session.stats, abandoned: session.stats.abandoned + 1, streak: 0} : session.stats};
}

export function migrateProgress(progress: Progress, players: Player[], random: () => number): Session {
  const target = players.find(player => player.id === progress.targetId)!;
  const spec = {catalog: CATALOG_ID, level: progress.level, theme: 'all' as const,
    seed: seedForPlayer(players, target, 'all', random)};
  return {version: progress.version, active: 'free',
    free: {key: 'free', kind: 'free', spec, targetId: target.id, guessIds: [...progress.guessIds], hintUsed: false},
    boards: {}, history: [...progress.recentIds], stats: progress.stats, onboardingDone: false};
}

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function restoreBoard(value: unknown, key: string, players: Player[]): Board | null {
  if (!record(value) || value.key !== key || !record(value.spec) || typeof value.hintUsed !== 'boolean') return null;
  const input = value.spec;
  if (typeof input.catalog !== 'string' || typeof input.level !== 'string' || typeof input.theme !== 'string' || typeof input.seed !== 'number') return null;
  let spec: Challenge | null;
  try { spec = decodeChallenge(encodeChallenge(input as Challenge)); } catch { return null; }
  if (!spec) return null;
  let target: Player;
  try { target = challengeTarget(players, spec); } catch { return null; }
  if (target.id !== value.targetId || !Array.isArray(value.guessIds) || value.guessIds.length > 8
    || new Set(value.guessIds).size !== value.guessIds.length || !value.guessIds.every(id => players.some(p => p.id === id))
    || (value.guessIds.includes(target.id) && value.guessIds.at(-1) !== target.id)
    || (value.hintUsed && value.guessIds.length < 3)) return null;
  const kind = value.kind;
  if (key === 'free' ? kind !== 'free' : kind !== 'friend' && kind !== 'daily') return null;
  if (kind === 'friend' && key !== `friend:${encodeChallenge(spec)}`) return null;
  if (kind === 'daily' && (typeof value.date !== 'string' || !validDate(value.date) || key !== `daily:${value.date}`
    || encodeChallenge(dailyChallenge(value.date)) !== encodeChallenge(spec))) return null;
  return {key, kind: kind as Board['kind'], spec, targetId: target.id, guessIds: [...value.guessIds], hintUsed: value.hintUsed,
    ...(kind === 'daily' ? {date: value.date as string} : {})};
}
export function restoreSession(value: unknown, players: Player[], version: string): Session | null {
  if (!record(value) || value.version !== version || typeof value.active !== 'string'
    || !record(value.boards) || typeof value.onboardingDone !== 'boolean' || !Array.isArray(value.history)) return null;
  const free = restoreBoard(value.free, 'free', players), stats = parseStats(value.stats);
  if (!free || !stats || new Set(value.history).size !== value.history.length
    || !value.history.every(id => players.some(player => player.id === id)) || value.history.at(-1) !== free.targetId) return null;
  const boards: Record<string, Board> = {};
  for (const [key, input] of Object.entries(value.boards)) {
    if (!/^(daily:|friend:)/.test(key)) return null;
    const board = restoreBoard(input, key, players);
    if (!board) return null;
    boards[key] = board;
  }
  if (value.active !== 'free' && !boards[value.active]) return null;
  const pending = [free, ...Object.values(boards)].filter(board => board.guessIds.length > 0 && !complete(board)).length;
  if (stats.started !== stats.games + stats.abandoned + pending) return null;
  return {version, active: value.active, free, boards, stats, history: [...value.history], onboardingDone: value.onboardingDone};
}

export function loadSession(storage: StorageAccess, players: Player[], random: () => number): Session {
  const version = datasetVersion(players);
  let saved: unknown;
  try { saved = JSON.parse(storage.getItem(sessionKey) || 'null'); } catch { saved = null; }
  const restored = restoreSession(saved, players, version);
  if (restored) return {...restored, active: 'free'};
  const old = loadProgress(storage, players, version);
  const savedStats = record(saved) ? parseStats(saved.stats) : null;
  if (savedStats) {
    old.guessIds = [];
    old.stats = {...savedStats, abandoned: savedStats.started - savedStats.games,
      streak: savedStats.started > savedStats.games + savedStats.abandoned ? 0 : savedStats.streak};
  }
  return migrateProgress(old, players, random);
}
export function saveSession(storage: StorageAccess, session: Session) {
  try { storage.setItem(sessionKey, JSON.stringify(session)); return true; } catch { return false; }
}

export function hintAvailable(session: Session) {
  return !isFinished(asProgress(session)) && currentBoard(session).guessIds.length >= 3;
}
