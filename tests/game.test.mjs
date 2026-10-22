import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {addGuess, clubHint, clubId, commonClubs, datasetVersion, initialStats, isFinished,
  parseStats, peakDirection, peakHint, pickPlayer, restartProgress, restoreProgress,
  searchPlayers} from '../game.ts';
import {loadProgress, progressKey, saveProgress} from '../storage.ts';

const players = JSON.parse(fs.readFileSync(new URL('../players.json', import.meta.url), 'utf8'));
const version = datasetVersion(players);
const player = name => { const p = players.find(p => p.name === name); assert.ok(p, name); return p; };
const board = (target = player('Andrea Pirlo')) => ({version, level: target.difficulty, targetId: target.id,
  guessIds: [], recentIds: [target.id], stats: initialStats()});
const memoryStorage = entries => {
  const data = new Map(entries);
  return {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value)};
};

test('empty, whitespace and punctuation searches never produce implicit guesses', () => {
  for (const query of ['', ' ', '---', '⚽']) assert.deepEqual(searchPlayers(players, query, []), []);
});
test('search handles accents, nicknames, exact ranking and already-used names', () => {
  assert.equal(searchPlayers(players, 'cr7', [])[0].name, 'Cristiano Ronaldo');
  assert.equal(searchPlayers(players, 'leo messi', [])[0].name, 'Lionel Messi');
  assert.equal(searchPlayers(players, 'Ronaldo', [])[0].name, 'Ronaldo Nazário');
  assert.equal(searchPlayers(players, 'aguero', [])[0].name, 'Sergio Agüero');
  assert.deepEqual(searchPlayers(players, 'CR7', [player('Cristiano Ronaldo').id]), []);
  assert.ok(searchPlayers(players, 'a', []).length <= 8);
});
test('QPR false-negative regression is fixed in both directions', () => {
  const a = player('Rio Ferdinand'), b = player('Niko Kranjčar');
  assert.equal(clubHint(a, b), 'match'); assert.equal(clubHint(b, a), 'match');
  assert.deepEqual(commonClubs(a, b), ['QPR']);
});
test('club spellings share canonical identities without conflating different teams', () => {
  for (const group of [['PSG', 'Paris Saint-Germain'], ['Schalke', 'Schalke 04'],
    ['Blackburn', 'Blackburn Rovers'], ['Leicester', 'Leicester City'], ['Lilla', 'Lille'],
    ['Sporting CP', 'Sporting Lisbona'], ['LA Galaxy', 'Los Angeles Galaxy'],
    ['Atletico Paranaense', 'Athletico Paranaense'], ['Bayern München', 'Bayern Monaco']]) {
    assert.equal(clubId(group[0]), clubId(group[1]), group.join(' / '));
  }
  for (const [a, b] of [['Monaco', 'Monaco 1860'], ['Al Nasr', 'Al Nassr'],
    ['Inter', 'Internacional'], ['QPR', 'North Queens Park Rangers']]) assert.notEqual(clubId(a), clubId(b));
});
test('missing clubs remain unknown and duplicate aliases are revealed only once', () => {
  const a = {...player('Rio Ferdinand'), clubs: ['QPR', 'Queens Park Rangers']};
  assert.deepEqual(commonClubs(a, player('Niko Kranjčar')), ['Queens Park Rangers']);
  assert.equal(clubHint(a, {...a, clubs: []}), 'unknown');
});
test('peak boundaries include fractional midpoints and direction agrees with color', () => {
  assert.equal(peakHint('2000-2000', '2002-2002'), 'match');
  assert.equal(peakDirection('2000-2000', '2002-2002'), '');
  assert.equal(peakHint('2000-2000', '2002-2003'), 'near');
  assert.equal(peakDirection('2000-2000', '2002-2003'), ' ↑');
  assert.equal(peakHint('2000-2000', '2006-2006'), 'near');
  assert.equal(peakHint('2000-2000', '2006-2007'), 'miss');
  assert.equal(peakDirection('2006-2007', '2000-2000'), ' ↓');
});
test('four compatible hints do not count as an identity win', () => {
  const xavi = player('Xavi Hernández'), iniesta = player('Andrés Iniesta');
  assert.equal(clubHint(xavi, iniesta), 'match'); assert.equal(peakHint(xavi.peak, iniesta.peak), 'match');
  const state = addGuess(board(iniesta), xavi.id, players);
  assert.equal(isFinished(state), false); assert.equal(state.stats.wins, 0);
});
test('valid first guess starts a game; duplicates and invalid IDs do not consume attempts', () => {
  const original = board(), next = addGuess(original, player('Lionel Messi').id, players);
  assert.equal(next.stats.started, 1); assert.equal(next.stats.games, 0);
  assert.equal(addGuess(next, next.guessIds[0], players), next);
  assert.equal(addGuess(next, -1, players), next);
  assert.deepEqual(original.guessIds, []); assert.deepEqual(original.stats, initialStats());
});
test('a win is recorded once and survives saving/reloading without another increment', () => {
  const original = board(), won = addGuess(original, original.targetId, players);
  assert.equal(won.stats.wins, 1); assert.equal(won.stats.games, 1);
  assert.equal(won.stats.distribution[0], 1); assert.equal(won.stats.best, 1);
  const storage = memoryStorage(); assert.equal(saveProgress(storage, won), true);
  const restored = loadProgress(storage, players, version); assert.deepEqual(restored, won);
  assert.equal(addGuess(restored, player('Lionel Messi').id, players), restored);
  assert.equal(addGuess(original, original.targetId, players).stats.wins, 1); // reducer replay is pure
  assert.equal(original.stats.wins, 0);
});
test('eighth miss records exactly one loss and rejects further guesses', () => {
  let state = board();
  for (const p of players.filter(p => p.id !== state.targetId).slice(0, 8)) state = addGuess(state, p.id, players);
  assert.equal(isFinished(state), true); assert.equal(state.stats.losses, 1); assert.equal(state.stats.games, 1);
  assert.equal(state.stats.started, 1); assert.equal(state.stats.streak, 0);
  assert.equal(addGuess(state, state.targetId, players), state);
});
test('restart distinguishes a pending game, a completed game and an empty board', () => {
  const original = board(), nextTarget = player('Lionel Messi');
  const pending = addGuess(original, nextTarget.id, players);
  const restarted = restartProgress(pending, nextTarget);
  assert.equal(restarted.stats.abandoned, 1); assert.equal(restarted.stats.games, 0);
  assert.equal(restarted.stats.started, 1); assert.deepEqual(restarted.guessIds, []);
  assert.equal(restartProgress(original, nextTarget).stats.abandoned, 0);
  const won = addGuess(original, original.targetId, players);
  assert.equal(restartProgress(won, nextTarget).stats.abandoned, 0);
});
test('abandonment interrupts a winning streak without removing the record', () => {
  let state = board(); state = addGuess(state, state.targetId, players);
  state = restartProgress(state, player('Lionel Messi'));
  state = addGuess(state, player('Andrea Pirlo').id, players);
  state = restartProgress(state, player('Rivaldo'));
  assert.equal(state.stats.streak, 0); assert.equal(state.stats.best, 1); assert.equal(state.stats.abandoned, 1);
});
test('restore preserves pending target, guesses, difficulty, history and statistics', () => {
  const state = addGuess(board(player('Niko Kranjčar')), player('Lionel Messi').id, players);
  assert.deepEqual(restoreProgress(JSON.parse(JSON.stringify(state)), players, version), state);
  assert.equal(restoreProgress({...state, version: 'old'}, players, version), null);
  assert.equal(restoreProgress({...state, guessIds: [1, 1]}, players, version), null);
  assert.equal(restoreProgress({...state, targetId: -1}, players, version), null);
  assert.equal(restoreProgress({...state, level: 'invalid'}, players, version), null);
  assert.equal(restoreProgress({...state, recentIds: []}, players, version), null);
});
test('legacy statistics are migrated without erasing wins or distribution', () => {
  const old = {wins: 1, losses: 1, games: 2, streak: 0, best: 1, distribution: [0, 1, 0, 0, 0, 0, 0, 0]};
  const storage = memoryStorage([['football-guesser-v1', JSON.stringify(old)]]);
  const state = loadProgress(storage, players, version);
  assert.deepEqual(state.stats, {...old, started: 2, abandoned: 0});
  assert.equal(parseStats({...old, distribution: ['1']}), null);
  assert.equal(parseStats({...old, games: 10}), null);
  assert.equal(parseStats({...old, started: -1}), null);
});
test('blocked or corrupt storage cannot prevent starting/playing', () => {
  const blocked = {getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }};
  const state = loadProgress(blocked, players, version);
  assert.ok(players.some(p => p.id === state.targetId)); assert.equal(saveProgress(blocked, state), false);
  assert.deepEqual(loadProgress(memoryStorage([[progressKey, '{bad json']]), players, version).stats, initialStats());
});
test('a dataset change keeps statistics and accounts for a pending incompatible board', () => {
  const pending = addGuess(board(), player('Lionel Messi').id, players);
  const storage = memoryStorage([[progressKey, JSON.stringify(pending)]]);
  const replacement = loadProgress(storage, players, 'next-version');
  assert.equal(replacement.stats.started, 1); assert.equal(replacement.stats.abandoned, 1);
  assert.deepEqual(replacement.guessIds, []); assert.equal(replacement.version, 'next-version');
  assert.notEqual(datasetVersion(players.map(p => p.id === 1 ? {...p, peak: '1986-1989'} : p)), version);
});
test('draw excludes recent answers, stays in level and ignores the legacy verification flag', () => {
  const pool = players.filter(p => p.difficulty === 'facile');
  const recent = pool.slice(0, 20).map(p => p.id);
  for (const fraction of [0, .2, .5, .99]) {
    const result = pickPlayer(players, 'facile', recent, () => fraction);
    assert.equal(result.difficulty, 'facile'); assert.ok(!recent.includes(result.id));
  }
  assert.equal(pickPlayer([{...pool[0], clubsVerified: false}], 'facile').id, pool[0].id);
  assert.throws(() => pickPlayer([], 'facile'), /Nessun calciatore/);
});
test('small pools remain playable while avoiding the immediate prior answer when possible', () => {
  const pool = players.filter(p => p.difficulty === 'facile').slice(0, 2);
  assert.equal(pickPlayer(pool, 'facile', pool.map(p => p.id), () => 0).id, pool[0].id);
  assert.equal(pickPlayer(pool.slice(0, 1), 'facile', [pool[0].id]).id, pool[0].id);
});
test('new recent history is bounded and source state is not mutated', () => {
  const state = {...board(), recentIds: Array.from({length: 20}, (_, i) => i + 1)};
  const next = restartProgress(state, player('Rivaldo'));
  assert.equal(next.recentIds.length, 20); assert.equal(next.recentIds.at(-1), player('Rivaldo').id);
  assert.deepEqual(state.recentIds, Array.from({length: 20}, (_, i) => i + 1));
});
