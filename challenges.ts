import {peakCentre, peakDirection, peakHint} from './game.ts';
import {CLUBS, clubPlayers, clueClubHint, isClub} from './clubs.ts';
import type {ClubMode} from './clubs.ts';
import type {Difficulty, Player} from './game.ts';

// Keep this catalog and its comparison rules available for already-shared links.
export const CATALOG_ID = 'L1';
export const THEMES = {
  all: 'Tutte le epoche', classic: 'Fino al 1999', millennium: 'Anni 2000', modern: 'Dal 2010',
} as const;
export type Theme = keyof typeof THEMES | ClubMode;
export const themeLabel = (theme: Theme) => isClub(theme) ? `Modalità ${CLUBS[theme].name} · dal 1995` : THEMES[theme];
export type Challenge = {catalog: string; level: Difficulty; theme: Theme; seed: number};
const levelCodes = {facile: 'f', media: 'm', difficile: 'd', tutti: 'a'} as const;
const themeCodes = {all: 'a', classic: 'c', millennium: 'y', modern: 'n'} as const;
const UINT_MAX = 0xffffffff;
export const LAUNCH_DATE = '2026-10-22';

export function hash(value: string) {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619) >>> 0;
  return result;
}

export function challengePool(players: Player[], level: Difficulty, theme: Theme) {
  if (isClub(theme)) return clubPlayers(players, theme).filter(player => level === 'tutti' || player.difficulty === level)
    .sort((a, b) => hash(`C1:${theme}:${a.id}`) - hash(`C1:${theme}:${b.id}`) || a.id - b.id);
  return players.filter(player => player.difficulty === level && player.clubs.length > 0
    && (theme === 'all' || (theme === 'classic' ? peakCentre(player.peak) < 2000
      : theme === 'millennium' ? peakCentre(player.peak) >= 2000 && peakCentre(player.peak) < 2010
        : peakCentre(player.peak) >= 2010)))
    .sort((a, b) => hash(`${CATALOG_ID}:${a.id}`) - hash(`${CATALOG_ID}:${b.id}`) || a.id - b.id);
}

export function encodeChallenge(spec: Challenge) {
  if (spec.catalog !== CATALOG_ID || !Object.hasOwn(levelCodes, spec.level) || (!Object.hasOwn(themeCodes, spec.theme) && !isClub(spec.theme))
    || (!isClub(spec.theme) && spec.level === 'tutti')
    || !Number.isInteger(spec.seed) || spec.seed < 0 || spec.seed > UINT_MAX) throw new Error('Sfida non valida');
  if (isClub(spec.theme)) return `fg2.C1.${spec.theme}.${levelCodes[spec.level]}.${spec.seed.toString(36)}`;
  return `fg1.${spec.catalog}.${levelCodes[spec.level]}.${themeCodes[spec.theme as keyof typeof themeCodes]}.${spec.seed.toString(36)}`;
}

export function decodeChallenge(value: string): Challenge | null {
  const club = /^fg2\.C1\.(milan|inter|juventus|napoli)\.([fmda])\.([0-9a-z]{1,7})$/.exec(value);
  if (club) {
    const spec: Challenge = {catalog: CATALOG_ID, theme: club[1] as ClubMode,
      level: ({f: 'facile', m: 'media', d: 'difficile', a: 'tutti'} as const)[club[2] as 'f' | 'm' | 'd' | 'a'], seed: parseInt(club[3], 36)};
    return spec.seed <= UINT_MAX && encodeChallenge(spec) === value ? spec : null;
  }
  const match = /^fg1\.(L1)\.([fmd])\.([acyn])\.([0-9a-z]{1,7})$/.exec(value);
  if (!match) return null;
  const spec = {catalog: match[1], level: ({f: 'facile', m: 'media', d: 'difficile'} as const)[match[2] as 'f' | 'm' | 'd'],
    theme: ({a: 'all', c: 'classic', y: 'millennium', n: 'modern'} as const)[match[3] as 'a' | 'c' | 'y' | 'n'],
    seed: parseInt(match[4], 36)};
  return spec.seed <= UINT_MAX && encodeChallenge(spec) === value ? spec : null;
}

export function challengeTarget(players: Player[], spec: Challenge) {
  encodeChallenge(spec);
  const pool = challengePool(players, spec.level, spec.theme);
  if (!pool.length) throw new Error('Nessun calciatore disponibile per questa selezione');
  return pool[spec.seed % pool.length];
}

export function seedForPlayer(players: Player[], player: Player, theme: Theme, random: () => number, level = player.difficulty) {
  const pool = challengePool(players, level, theme);
  const index = pool.findIndex(candidate => candidate.id === player.id);
  if (index < 0) throw new Error('Calciatore fuori dal gruppo della sfida');
  const bucket = Math.min(Math.floor((random() >>> 0) / pool.length), Math.floor((UINT_MAX - index) / pool.length));
  return bucket * pool.length + index;
}

export function romeDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(now);
  const get = (part: string) => parts.find(value => value.type === part)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
export function dailyChallenge(date: string): Challenge {
  if (!validDate(date)) throw new Error('Data non valida');
  // Adjacent days walk a fixed shuffled pool, rather than repeatedly drawing the same names.
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
  return {catalog: CATALOG_ID, level: 'facile', theme: 'all', seed: (day + 19081986) >>> 0};
}

export type Entry = {kind: 'daily'; date: string; spec: Challenge} | {kind: 'friend'; spec: Challenge};
export function readEntry(url: string, today: string): {entry: Entry | null; error: string | null} {
  const params = new URL(url).searchParams;
  const token = params.get('challenge'), date = params.get('daily');
  if (!params.has('challenge') && !params.has('daily')) return {entry: null, error: null};
  if (params.has('daily')) {
    if (!date) return {entry: null, error: 'La data della sfida è mancante. Puoi continuare in modalità libera.'};
    if (!validDate(date) || date < LAUNCH_DATE || date > today) return {entry: null, error: 'Questa sfida del giorno non è disponibile. Puoi continuare in modalità libera.'};
    const spec = dailyChallenge(date);
    if (token && token !== encodeChallenge(spec)) return {entry: null, error: 'Il collegamento della sfida non è valido. La tua partita libera è al sicuro.'};
    return {entry: {kind: 'daily', date, spec}, error: null};
  }
  const spec = token ? decodeChallenge(token) : null;
  return spec ? {entry: {kind: 'friend', spec}, error: null}
    : {entry: null, error: 'Questa versione della sfida non è disponibile o il link è incompleto. Puoi giocare una partita libera.'};
}

export function challengeUrl(base: string, spec: Challenge, dailyDate?: string) {
  const url = new URL(base);
  url.search = ''; url.hash = '';
  url.searchParams.set('challenge', encodeChallenge(spec));
  if (dailyDate) {
    if (encodeChallenge(dailyChallenge(dailyDate)) !== encodeChallenge(spec)) throw new Error('Sfida e data non coincidono');
    url.searchParams.set('daily', dailyDate);
  }
  return url.toString();
}

export type ShareBoard = {spec: Challenge; targetId: number; guessIds: number[]; hintUsed: boolean; date?: string};
export function resultText(board: ShareBoard, players: Player[], base: string) {
  const target = challengeTarget(players, board.spec);
  if (target.id !== board.targetId) throw new Error('Sfida incoerente');
  const won = board.guessIds.includes(target.id);
  if (!won && board.guessIds.length < 8) throw new Error('La partita non è ancora terminata');
  const rows = board.guessIds.map(id => {
    const guess = players.find(player => player.id === id);
    if (!guess) throw new Error('Tentativo non valido');
    const club = clueClubHint(guess, target, board.spec.theme), peak = peakHint(guess.peak, target.peak);
    return [guess.role === target.role ? '🟩' : '🟥', club === 'match' ? '🟩' : club === 'unknown' ? '⬜' : '🟥',
      guess.nationality === target.nationality ? '🟩' : '🟥',
      (peak === 'match' ? '🟩' : peak === 'near' ? '🟨' : '🟥') + peakDirection(guess.peak, target.peak).trim()].join('');
  });
  const label = board.date ? `Del giorno · ${board.date}` : 'Sfida tra amici';
  return `FOOTBALL GUESSER ⚽\n${label} · ${board.spec.level.toUpperCase()} · ${themeLabel(board.spec.theme)}\n${won ? board.guessIds.length : 'X'}/8 · ${board.hintUsed ? 'con indizio' : 'senza aiuti'}\n${rows.join('\n')}\nRiesci a fare meglio? Gioca la stessa sfida:\n${challengeUrl(base, board.spec, board.date)}`;
}
