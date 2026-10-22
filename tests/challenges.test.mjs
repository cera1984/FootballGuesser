import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {addGuess, datasetVersion, initialStats, peakCentre} from '../game.ts';
import {CATALOG_ID, THEMES, challengePool, challengeTarget, challengeUrl, dailyChallenge, decodeChallenge,
  encodeChallenge, readEntry, resultText, romeDate, seedForPlayer, validDate} from '../challenges.ts';
import {boardFinished, currentBoard, guessInSession, loadSession, migrateProgress, nextFree, openEntry,
  restoreSession, saveSession, sessionKey, useHint} from '../session.ts';
import {copyText, shareText} from '../sharing.ts';

const players = JSON.parse(fs.readFileSync(new URL('../catalogs/L1.json', import.meta.url), 'utf8'));
const version = datasetVersion(players), target = players[0];
const initial = () => migrateProgress({version, level: target.difficulty, targetId: target.id, guessIds: [], recentIds: [target.id], stats: initialStats()}, players, () => 123456);
let entropy = 20261022;
const random = () => (entropy = (Math.imul(entropy, 1664525) + 1013904223) >>> 0);
const memory = entries => { const map = new Map(entries); return {getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value)}; };
const daily = {kind: 'daily', date: '2026-10-22', spec: dailyChallenge('2026-10-22')};
const miss = board => players.find(p => p.id !== board.targetId && !board.guessIds.includes(p.id)).id;

test('the published L1 catalog stays immutable for already-shared links', () => {
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(players)).digest('hex'),
    '2f394f04275e30264d7ee3319165984e17cb049ea0d0d1fe264ed9a199e0589d');
});

test('all themes and levels have a nonempty pool and the era filters match their labels', () => {
  assert.equal(players.length, 500);
  for (const level of ['facile', 'media', 'difficile']) for (const theme of Object.keys(THEMES)) {
    const pool = challengePool(players, level, theme); assert.ok(pool.length, `${level}/${theme}`);
    assert.ok(pool.every(p => p.difficulty === level));
    if (theme === 'classic') assert.ok(pool.every(p => peakCentre(p.peak) < 2000));
    if (theme === 'millennium') assert.ok(pool.every(p => peakCentre(p.peak) >= 2000 && peakCentre(p.peak) < 2010));
    if (theme === 'modern') assert.ok(pool.every(p => peakCentre(p.peak) >= 2010));
  }
});
test('tokens round-trip all filters, including zero and the largest seed', () => {
  for (const level of ['facile', 'media', 'difficile']) for (const theme of Object.keys(THEMES)) for (const seed of [0, 123456, 0xffffffff]) {
    const spec = {catalog: CATALOG_ID, level, theme, seed};
    assert.deepEqual(decodeChallenge(encodeChallenge(spec)), spec);
    assert.equal(challengeTarget(players, spec).id, challengeTarget([...players].reverse(), spec).id);
  }
});
test('malformed and unsupported challenge tokens are rejected rather than redrawn', () => {
  for (const value of ['', 'fg1.L2.f.a.1', 'fg1.L1.f.a.01', 'fg1.L1.f.a.zzzzzzz', 'fg1.L1.f.a.-1', 'fg1.L1.x.a.1', 'fg1.L1.f.z.1', 'fg1.L1.f.a.1.extra']) assert.equal(decodeChallenge(value), null, value);
  assert.throws(() => encodeChallenge({catalog: 'L1', level: 'facile', theme: 'all', seed: NaN}));
  assert.ok(readEntry('https://example.org/?challenge=', '2026-10-22').error);
  assert.ok(readEntry('https://example.org/?daily=', '2026-10-22').error);
});
test('a link from a free game gives an independent receiver exactly the same answer and filters', () => {
  let session = initial();
  for (let i = 0; i < 50; i++) {
    session = nextFree(session, players, 'facile', i % 2 ? 'classic' : 'all', random);
    const board = currentBoard(session), url = challengeUrl('https://example.org/game/?old=1#spoiler', board.spec);
    assert.equal(new URL(url).searchParams.has('old'), false); assert.equal(new URL(url).hash, '');
    const entry = readEntry(url, '2026-10-22').entry;
    const receiver = openEntry(initial(), players, entry);
    assert.equal(currentBoard(receiver).targetId, board.targetId);
    assert.deepEqual(currentBoard(receiver).spec, board.spec);
    assert.deepEqual(currentBoard(receiver).guessIds, []); assert.equal(currentBoard(receiver).hintUsed, false);
    assert.ok(!url.includes(challengeTarget(players, board.spec).name));
  }
});
test('free play exhausts the complete selected pool before repeating, including after a reload', () => {
  let session = initial(); const theme = 'millennium', pool = challengePool(players, 'facile', theme), seen = new Set();
  for (let i = 0; i < pool.length; i++) {
    session = nextFree(session, players, 'facile', theme, random);
    assert.ok(!seen.has(session.free.targetId)); seen.add(session.free.targetId);
    const restored = restoreSession(JSON.parse(JSON.stringify(session)), players, version); assert.ok(restored); session = restored;
  }
  const last = session.free.targetId;
  session = nextFree(session, players, 'facile', theme, random);
  assert.equal(seen.size, pool.length); assert.notEqual(session.free.targetId, last);
});
test('seed generation replays a chosen player even at unsigned integer boundaries', () => {
  for (const player of players.filter(p => p.difficulty === 'facile')) {
    for (const number of [0, 0xffffffff]) {
      const spec = {catalog: CATALOG_ID, level: player.difficulty, theme: 'all', seed: seedForPlayer(players, player, 'all', () => number)};
      assert.equal(challengeTarget(players, spec).id, player.id);
    }
  }
});
test('daily rotation has no repeat during its full initial pool cycle', () => {
  const size = challengePool(players, 'facile', 'all').length, answers = [];
  for (let i = 0; i < size; i++) {
    const date = new Date(Date.UTC(2026, 9, 22 + i)).toISOString().slice(0, 10);
    answers.push(challengeTarget(players, dailyChallenge(date)).id);
  }
  assert.equal(new Set(answers).size, size);
});
test('Rome midnight defines the daily date independently of the browser timezone', () => {
  assert.equal(romeDate(new Date('2026-10-22T21:59:59Z')), '2026-10-22');
  assert.equal(romeDate(new Date('2026-10-22T22:00:00Z')), '2026-10-23');
  assert.equal(romeDate(new Date('2026-12-01T23:00:00Z')), '2026-12-02');
  assert.equal(validDate('2026-02-30'), false); assert.equal(validDate('2028-02-29'), true);
});
test('daily links are reproducible and reject dates outside the released archive or mismatched tokens', () => {
  const link = challengeUrl('https://example.org/', daily.spec, daily.date);
  assert.deepEqual(readEntry(link, '2026-10-22').entry, daily);
  for (const date of ['2026-10-21', '2026-10-23', '2026-02-30']) assert.ok(readEntry(`https://example.org/?daily=${date}`, '2026-10-22').error);
  assert.ok(readEntry(link.replace('2026-10-22', '2026-10-23'), '2026-10-23').error);
  assert.throws(() => challengeUrl('https://example.org', daily.spec, '2026-10-23'));
});
test('free, daily and friend progress pause independently with one shared consistent statistics total', () => {
  let session = initial();
  session = guessInSession(session, miss(currentBoard(session)), players);
  const freeGuesses = [...session.free.guessIds];
  session = openEntry(session, players, daily); session = guessInSession(session, miss(currentBoard(session)), players);
  const friend = {kind: 'friend', spec: {...daily.spec, seed: 934857}};
  session = openEntry(session, players, friend); session = guessInSession(session, miss(currentBoard(session)), players);
  assert.equal(session.stats.started, 3); assert.equal(session.stats.abandoned, 0);
  assert.ok(restoreSession(JSON.parse(JSON.stringify(session)), players, version));
  session = openEntry(session, players, null); assert.deepEqual(currentBoard(session).guessIds, freeGuesses);
  session = openEntry(session, players, daily); assert.equal(currentBoard(session).guessIds.length, 1);
});
test('a finished daily challenge cannot be restarted or counted twice after reopening and restoring', () => {
  let session = openEntry(initial(), players, daily);
  session = guessInSession(session, currentBoard(session).targetId, players);
  assert.equal(session.stats.wins, 1); assert.equal(boardFinished(currentBoard(session)), true);
  const stats = {...session.stats, distribution: [...session.stats.distribution]};
  session = openEntry(session, players, null); session = openEntry(session, players, daily);
  const storage = memory(); assert.equal(saveSession(storage, session), true);
  session = openEntry(loadSession(storage, players, random), players, daily);
  session = guessInSession(session, currentBoard(session).targetId, players);
  assert.deepEqual(session.stats, stats);
});
test('reopening a friend link resumes the attempts rather than creating another game', () => {
  const entry = {kind: 'friend', spec: initial().free.spec};
  let session = openEntry(initial(), players, entry);
  session = guessInSession(session, miss(currentBoard(session)), players);
  session = openEntry(session, players, null); session = openEntry(session, players, entry);
  assert.equal(currentBoard(session).guessIds.length, 1); assert.equal(session.stats.started, 1);
});
test('a free restart records only that abandonment while a daily game remains paused', () => {
  let session = initial(); session = guessInSession(session, miss(currentBoard(session)), players);
  session = openEntry(session, players, daily); session = guessInSession(session, miss(currentBoard(session)), players);
  session = nextFree(session, players, 'media', 'modern', random);
  assert.equal(session.stats.started, 2); assert.equal(session.stats.abandoned, 1);
  assert.equal(session.free.guessIds.length, 0); assert.ok(restoreSession(session, players, version));
  session = openEntry(session, players, daily); assert.equal(currentBoard(session).guessIds.length, 1);
});
test('v2 migration preserves the original answer, attempts and totals with a replayable seed', () => {
  let old = {version, level: target.difficulty, targetId: target.id, guessIds: [], recentIds: [target.id], stats: initialStats()};
  old = addGuess(old, players[1].id, players);
  const session = loadSession(memory([['football-guesser-v2', JSON.stringify(old)]]), players, random);
  assert.equal(session.free.targetId, old.targetId); assert.deepEqual(session.free.guessIds, old.guessIds);
  assert.deepEqual(session.stats, old.stats); assert.equal(challengeTarget(players, session.free.spec).id, old.targetId);
  assert.ok(restoreSession(session, players, version));
});
test('hints unlock after three guesses, persist once, and are labelled in the shared result', () => {
  let session = initial(); assert.equal(useHint(session), session);
  for (let i = 0; i < 3; i++) session = guessInSession(session, miss(currentBoard(session)), players);
  session = useHint(session); assert.equal(currentBoard(session).hintUsed, true); assert.equal(useHint(session), session);
  session = guessInSession(session, currentBoard(session).targetId, players);
  const text = resultText(currentBoard(session), players, 'https://example.org/');
  assert.ok(text.includes('4/8 · con indizio')); assert.ok(restoreSession(session, players, version));
});
test('shared results contain colors, outcome, filters and a working link, without player names', () => {
  let session = initial(); session = guessInSession(session, players[1].id, players); session = guessInSession(session, session.free.targetId, players);
  const text = resultText(session.free, players, 'https://example.org/');
  assert.ok(text.includes('2/8 · senza aiuti')); assert.ok(text.includes('🟩🟩🟩🟩'));
  for (const id of session.free.guessIds) assert.ok(!text.includes(players.find(p => p.id === id).name));
  assert.equal(challengeTarget(players, readEntry(text.split('\n').at(-1), '2026-10-22').entry.spec).id, session.free.targetId);
  assert.throws(() => resultText(initial().free, players, 'https://example.org/'));
});
test('a shared defeat uses X/8 and does not leak the answer', () => {
  let session = initial(); for (let i = 0; i < 8; i++) session = guessInSession(session, miss(currentBoard(session)), players);
  const text = resultText(session.free, players, 'https://example.org/');
  assert.ok(text.includes('X/8')); assert.ok(!text.includes(target.name));
});
test('native share cancellation does not silently copy or start another share', async () => {
  let copied = false;
  const result = await shareText('test', {share: async () => { throw {name: 'AbortError'}; }, copy: async () => { copied = true; }});
  assert.equal(result, 'cancelled'); assert.equal(copied, false);
});
test('sharing has clipboard and manual fallbacks when native APIs are absent or fail', async () => {
  let copied;
  assert.equal(await shareText('payload', {copy: async text => { copied = text; }}), 'copied'); assert.equal(copied, 'payload');
  assert.equal(await shareText('test', {share: async () => { throw new Error('unsupported'); }, copy: async () => { throw new Error('denied'); }}), 'manual');
  assert.equal(await shareText('test', {}), 'manual'); assert.equal(await copyText('test'), false);
});
test('storage failures and malformed sessions keep the game usable and preserve valid historical totals', () => {
  const blocked = {getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }};
  assert.ok(loadSession(blocked, players, random)); assert.equal(saveSession(blocked, initial()), false);
  let session = initial(); session = guessInSession(session, miss(currentBoard(session)), players);
  const invalid = {...session, version: 'old'};
  const storage = memory([[sessionKey, JSON.stringify(invalid)]]);
  const recovered = loadSession(storage, players, random);
  assert.equal(recovered.stats.started, 1); assert.equal(recovered.stats.abandoned, 1);
  assert.deepEqual(recovered.free.guessIds, []); assert.ok(restoreSession(recovered, players, version));
  assert.equal(restoreSession({...session, free: {...session.free, targetId: -1}}, players, version), null);
  assert.equal(restoreSession({...session, boards: {__bad: session.free}}, players, version), null);
});
