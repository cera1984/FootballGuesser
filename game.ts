export type Difficulty = 'facile' | 'media' | 'difficile' | 'tutti';
export type Player = {
  id: number;
  name: string;
  nationality: string;
  role: string;
  peak: string;
  clubs: string[];
  // Legacy field: indicates a populated list, not independent historical verification.
  clubsVerified?: boolean;
  difficulty: Difficulty;
};

export const normalize = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const clubAliases: Record<string, string> = {
  psg: 'parissaintgermain', parissg: 'parissaintgermain',
  inter: 'internazionale', intermilan: 'internazionale', fcinternazionale: 'internazionale',
  internazionalemilano: 'internazionale', acmilan: 'milan',
  manutd: 'manchesterunited', manunited: 'manchesterunited', manchesterutd: 'manchesterunited',
  manchestercityfc: 'manchestercity', atleticomadrid: 'atleticodemadrid',
  barca: 'barcellona', fcbarcelona: 'barcellona', barcelona: 'barcellona',
  bayernmunchen: 'bayernmonaco', bayernmunich: 'bayernmonaco',
  juventusfc: 'juventus', realmadri: 'realmadrid', realmadridcf: 'realmadrid',
  olympiquedemarseille: 'marsiglia', marseille: 'marsiglia',
  borussiadortmund: 'dortmund', bvb: 'dortmund',
  sportingcp: 'sportinglisbona', sportingclubdeportugal: 'sportinglisbona',
  ajaxamsterdam: 'ajax', afcajax: 'ajax',
  qpr: 'queensparkrangers', lagalaxy: 'losangelesgalaxy',
  blackburn: 'blackburnrovers', leicester: 'leicestercity', lille: 'lilla',
  schalke: 'schalke04',
  salzburg: 'redbullsalisburgo', atleticoparanaense: 'athleticoparanaense',
};

export function clubId(name: string) {
  const id = normalize(name);
  return clubAliases[id] || id;
}

export function commonClubs(a: Player, b: Player) {
  const other = new Set(b.clubs.map(clubId));
  return [...new Map(a.clubs.filter(name => other.has(clubId(name)))
    .map(name => [clubId(name), name])).values()];
}

export function clubHint(a: Player, b: Player) {
  if (!a.clubs.length || !b.clubs.length) return 'unknown';
  return commonClubs(a, b).length ? 'match' : 'miss';
}

export const peakCentre = (peak: string) => {
  const [start, end = start] = peak.split('-').map(Number);
  return (start + end) / 2;
};
export function peakHint(guess: string, target: string) {
  const distance = Math.abs(peakCentre(guess) - peakCentre(target));
  return distance <= 2 ? 'match' : distance <= 6 ? 'near' : 'miss';
}
export function peakDirection(guess: string, target: string) {
  const delta = peakCentre(target) - peakCentre(guess);
  return Math.abs(delta) <= 2 ? '' : delta > 0 ? ' ↑' : ' ↓';
}

const nameAliases: Record<string, string[]> = {
  cristianoronaldo: ['CR7'], lionelmessi: ['Leo Messi'],
  ronaldonazario: ['Ronaldo', 'Il Fenomeno'],
};

export function searchPlayers(players: Player[], query: string, guessedIds: number[]) {
  const needle = normalize(query);
  if (!needle) return [];
  const used = new Set(guessedIds);
  return players.filter(player => !used.has(player.id)).map(player => {
    const names = [player.name, ...(nameAliases[normalize(player.name)] || [])].map(normalize);
    const rank = names.some(name => name === needle) ? 0
      : names.some(name => name.startsWith(needle)) ? 1
      : names.some(name => name.includes(needle)) ? 2 : 3;
    return {player, rank};
  }).filter(result => result.rank < 3)
    .sort((a, b) => a.rank - b.rank || a.player.name.localeCompare(b.player.name, 'it') || a.player.id - b.player.id)
    .map(result => result.player).slice(0, 8);
}

export const MAX_GUESSES = 8;
export const RECENT_LIMIT = 20;
export type Stats = {
  wins: number; losses: number; games: number; started: number; abandoned: number;
  streak: number; best: number; distribution: number[];
};
export const initialStats = (): Stats => ({wins: 0, losses: 0, games: 0, started: 0,
  abandoned: 0, streak: 0, best: 0, distribution: Array(MAX_GUESSES).fill(0)});

export type Progress = {
  version: string;
  level: Difficulty;
  targetId: number;
  guessIds: number[];
  recentIds: number[];
  stats: Stats;
};

export function datasetVersion(players: Player[]) {
  // Player changes invalidate old boards automatically. Bump rules-2 when changing comparison rules.
  let hash = 2166136261;
  for (const char of JSON.stringify(players)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return `rules-2-${hash.toString(16)}`;
}

export function isFinished(progress: Progress) {
  return progress.guessIds.includes(progress.targetId) || progress.guessIds.length >= MAX_GUESSES;
}

export function pickPlayer(players: Player[], level: Difficulty, recentIds: number[] = [], random = Math.random) {
  const pool = players.filter(player => player.difficulty === level && player.clubs.length > 0);
  if (!pool.length) throw new Error(`Nessun calciatore disponibile per il livello ${level}`);
  let eligible = pool.filter(player => !recentIds.includes(player.id));
  // A small pool must still be playable; retain at least immediate-repeat protection.
  if (!eligible.length) eligible = pool.filter(player => player.id !== recentIds.at(-1));
  if (!eligible.length) eligible = pool;
  return eligible[Math.min(eligible.length - 1, Math.max(0, Math.floor(random() * eligible.length)))];
}

export function startProgress(players: Player[], version: string, stats = initialStats()): Progress {
  const target = pickPlayer(players, 'facile');
  return {version, level: 'facile', targetId: target.id, guessIds: [], recentIds: [target.id], stats};
}

export function addGuess(progress: Progress, playerId: number, players: Player[]): Progress {
  if (isFinished(progress) || progress.guessIds.includes(playerId) || !players.some(p => p.id === playerId)) return progress;
  const guessIds = [...progress.guessIds, playerId];
  let stats = {...progress.stats, distribution: [...progress.stats.distribution],
    started: progress.stats.started + (progress.guessIds.length === 0 ? 1 : 0)};
  const won = playerId === progress.targetId;
  if (won || guessIds.length === MAX_GUESSES) {
    const streak = won ? stats.streak + 1 : 0;
    stats = {...stats, games: stats.games + 1, wins: stats.wins + (won ? 1 : 0),
      losses: stats.losses + (won ? 0 : 1), streak, best: Math.max(stats.best, streak)};
    if (won) stats.distribution[guessIds.length - 1]++;
  }
  return {...progress, guessIds, stats};
}

export function restartProgress(progress: Progress, target: Player): Progress {
  const abandoned = progress.guessIds.length > 0 && !isFinished(progress);
  return {...progress, level: target.difficulty, targetId: target.id, guessIds: [],
    recentIds: [...progress.recentIds, target.id].slice(-RECENT_LIMIT),
    stats: abandoned ? {...progress.stats, abandoned: progress.stats.abandoned + 1, streak: 0} : progress.stats};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const nonnegativeInteger = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

export function parseStats(value: unknown): Stats | null {
  if (!isRecord(value)) return null;
  const keys = ['wins', 'losses', 'games', 'streak', 'best'] as const;
  if (!keys.every(key => nonnegativeInteger(value[key]))) return null;
  const {wins, losses, games, streak, best} = value as Record<typeof keys[number], number>;
  const distribution = value.distribution;
  if (!Array.isArray(distribution) || distribution.length !== MAX_GUESSES || !distribution.every(nonnegativeInteger)
    || distribution.reduce((sum, n) => sum + n, 0) !== wins || wins + losses !== games
    || streak > best || best > wins) return null;
  const started = value.started ?? games;
  const abandoned = value.abandoned ?? 0;
  if (!nonnegativeInteger(started) || !nonnegativeInteger(abandoned) || started < games + abandoned) return null;
  return {wins, losses, games, streak, best, started, abandoned, distribution: [...distribution]};
}

export function restoreProgress(value: unknown, players: Player[], version: string): Progress | null {
  if (!isRecord(value) || value.version !== version) return null;
  const stats = parseStats(value.stats);
  const target = players.find(player => player.id === value.targetId && player.difficulty === value.level && player.clubs.length > 0);
  if (!stats || !target || !Array.isArray(value.guessIds) || !Array.isArray(value.recentIds)) return null;
  const ids = new Set(players.map(player => player.id));
  const {guessIds, recentIds} = value;
  if (guessIds.length > MAX_GUESSES || new Set(guessIds).size !== guessIds.length
    || !guessIds.every(id => ids.has(id)) || !recentIds.every(id => ids.has(id))
    || recentIds.length === 0 || recentIds.length > RECENT_LIMIT || recentIds.at(-1) !== target.id
    || (guessIds.includes(target.id) && guessIds.at(-1) !== target.id)) return null;
  const pending = guessIds.length > 0 && !guessIds.includes(target.id) && guessIds.length < MAX_GUESSES;
  if (stats.started !== stats.games + stats.abandoned + (pending ? 1 : 0)) return null;
  return {version, level: target.difficulty, targetId: target.id, guessIds: [...guessIds], recentIds: [...recentIds], stats};
}
