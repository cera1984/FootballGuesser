// Deterministic expert/ideal-memory benchmark. Does not estimate a human win rate.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {clubHint, datasetVersion, peakDirection, peakHint} from '../game.ts';

const raw = fs.readFileSync(new URL('../players.json', import.meta.url));
const players = JSON.parse(raw);
const seed = 20261022;
let state = seed;
const random = () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
const levels = ['facile', 'media', 'difficile'];
const targets = levels.flatMap((level, index) => {
  const pool = players.filter(p => p.difficulty === level && p.clubs.length);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, index === 2 ? 16 : 17);
});
const feedbackCache = new Map();
function feedback(guess, answer) {
  const key = `${guess.id}/${answer.id}`;
  if (!feedbackCache.has(key)) feedbackCache.set(key, JSON.stringify([
    guess.role === answer.role, clubHint(guess, answer), guess.nationality === answer.nationality,
    peakHint(guess.peak, answer.peak), peakDirection(guess.peak, answer.peak),
  ]));
  return feedbackCache.get(key);
}
function play(answer) {
  let candidates = players.filter(p => p.difficulty === answer.difficulty && p.clubs.length);
  const used = new Set(), trace = [];
  for (let turn = 1; turn <= 8; turn++) {
    let chosen, score = Infinity;
    const candidateIds = new Set(candidates.map(p => p.id));
    for (const guess of players) {
      if (used.has(guess.id)) continue;
      const buckets = new Map();
      for (const candidate of candidates) {
        const clue = feedback(guess, candidate);
        buckets.set(clue, (buckets.get(clue) || 0) + 1);
      }
      const cost = [...buckets.values()].reduce((sum, size) => sum + size * size, 0);
      if (cost < score || (cost === score && candidateIds.has(guess.id) && !candidateIds.has(chosen?.id))) {
        chosen = guess; score = cost;
      }
    }
    const clue = feedback(chosen, answer), before = candidates.length;
    used.add(chosen.id);
    candidates = candidates.filter(p => p.id !== chosen.id && feedback(chosen, p) === clue);
    trace.push({turn, guess: chosen.name, id: chosen.id, feedback: JSON.parse(clue), before,
      remaining: chosen.id === answer.id ? 0 : candidates.length});
    if (chosen.id === answer.id) return {target: answer.name, id: answer.id, level: answer.difficulty, won: true, attempts: turn, trace};
  }
  return {target: answer.name, id: answer.id, level: answer.difficulty, won: false, attempts: 8, trace};
}
const games = targets.map(play);
const summarize = group => ({games: group.length, wins: group.filter(g => g.won).length,
  mean: group.reduce((sum, g) => sum + g.attempts, 0) / group.length,
  max: Math.max(...group.map(g => g.attempts)),
  distribution: Array.from({length: 8}, (_, i) => group.filter(g => g.won && g.attempts === i + 1).length)});
const report = {seed, version: datasetVersion(players), dataSha256: crypto.createHash('sha256').update(raw).digest('hex'),
  model: 'Ideal memory of the game dataset; greedy elimination; not a human success estimate.',
  summary: summarize(games), byLevel: Object.fromEntries(levels.map(level => [level, summarize(games.filter(g => g.level === level))])), games};
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(report, null, 2));
console.log(JSON.stringify({summary: report.summary, byLevel: report.byLevel}, null, 2));
