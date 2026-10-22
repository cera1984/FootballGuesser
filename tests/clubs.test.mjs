import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {CLUBS, clubPlayers, clueClubs, clueClubHint, modeOf} from '../clubs.ts';
import {clubId, datasetVersion, initialStats} from '../game.ts';
import {challengePool, challengeTarget, challengeUrl, decodeChallenge, encodeChallenge, readEntry, resultText, seedForPlayer} from '../challenges.ts';
import {currentBoard, guessInSession, migrateProgress, nextFree, openEntry, restoreSession, switchMode, useHint} from '../session.ts';
const players = JSON.parse(fs.readFileSync(new URL('../catalogs/L1.json', import.meta.url), 'utf8'));
const version = datasetVersion(players);
const initial = () => migrateProgress({version, level:'facile', targetId:1, guessIds:[], recentIds:[1], stats:initialStats()},players,()=>7);
const levels = ['tutti','facile','media','difficile'];
const modes = Object.keys(CLUBS);
test('the released C1 selection and its visual labels remain pinned for shared links',()=>{
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(CLUBS)).digest('hex'),
    'c5be74a086319fdc461edab1f4a8c34b28c7650d66d581f131df0102aba8f124');
});
test('C1 selections have unique real catalog IDs, matching club and nonempty difficulty pools',()=>{
  for(const mode of modes){
    const roster=clubPlayers(players,mode);
    assert.equal(roster.length,CLUBS[mode].ids.length);
    assert.equal(new Set(CLUBS[mode].ids).size,roster.length);
    assert.ok(roster.every(p=>p.clubs.some(c=>clubId(c)===clubId(CLUBS[mode].club))));
    for(const level of levels) assert.ok(challengePool(players,level,mode).length);
  }
});
test('1995 boundary uses club appearances rather than the editorial career peak',()=>{
  assert.ok(CLUBS.milan.ids.includes(21)); // Maldini continued after 1995 despite old peak.
  assert.ok(CLUBS.milan.ids.includes(218)); // Baresi, through 1997.
  assert.ok(CLUBS.napoli.ids.includes(22)); // Cannavaro, first half of 1995.
  assert.ok(CLUBS.juventus.ids.includes(17)); // Baggio, first half of 1995.
  for(const id of [67,69,201,237,435]) assert.ok(!CLUBS.milan.ids.includes(id));
  for(const id of [185,204,231,317,330,342,344]) assert.ok(!CLUBS.inter.ids.includes(id));
  for(const id of [185,204,247,403,132]) assert.ok(!CLUBS.juventus.ids.includes(id));
  assert.ok(!CLUBS.napoli.ids.includes(1)); assert.ok(!CLUBS.napoli.ids.includes(138));
});
test('every C1 answer replays across independent browsers and input ordering, including uint boundaries',()=>{
  for(const mode of modes) for(const level of levels) for(const target of challengePool(players,level,mode)) for(const entropy of [0,0xffffffff]){
    const spec={catalog:'L1',level,theme:mode,seed:seedForPlayer(players,target,mode,()=>entropy,level)};
    const token=encodeChallenge(spec);
    assert.ok(token.startsWith(`fg2.C1.${mode}.`)); assert.deepEqual(decodeChallenge(token),spec);
    assert.equal(challengeTarget([...players].reverse(),spec).id,target.id);
    const route=readEntry(challengeUrl('https://example.com/',spec),'2026-10-22');
    assert.equal(route.error,null); assert.equal(challengeTarget(players,route.entry.spec).id,target.id);
  }
  for(const bad of ['fg2.C2.inter.f.1','fg2.C1.roma.f.1','fg2.C1.inter.f.01','fg2.C1.inter.f.1z141z4','fg1.L1.f.inter.1']) assert.equal(decodeChallenge(bad),null);
});
test('all five modes pause independently, preserving hints, attempts, totals and histories after reload',()=>{
  let s=guessInSession(initial(),2,players); const snapshots={world:s.free};
  for(const mode of modes){
    s=switchMode(s,players,mode,()=>9);
    const misses=clubPlayers(players,mode).filter(p=>p.id!==s.free.targetId).slice(0,3);
    for(const p of misses) s=guessInSession(s,p.id,players);
    s=useHint(s); snapshots[mode]=s.free;
    assert.ok(restoreSession(JSON.parse(JSON.stringify(s)),players,version));
  }
  assert.equal(s.stats.started,5);assert.equal(s.stats.abandoned,0);
  for(const mode of ['world',...modes]){
    s=switchMode(s,players,mode==='world'?'all':mode,()=>3);
    assert.deepEqual(s.free,snapshots[mode]);
    const restored=restoreSession(JSON.parse(JSON.stringify(s)),players,version);
    assert.ok(restored);s=restored;
  }
});
test('club guesses reject names outside the roster and friend boards retain their own saved state',()=>{
  let s=switchMode(initial(),players,'inter',()=>1);
  assert.equal(guessInSession(s,1,players),s);
  const spec=s.free.spec;
  s=openEntry(s,players,{kind:'friend',spec});
  s=guessInSession(s,currentBoard(s).targetId,players);
  assert.equal(s.stats.wins,1);
  s=switchMode(s,players,'napoli',()=>3);
  s=openEntry(s,players,{kind:'friend',spec});
  assert.equal(currentBoard(s).guessIds.length,1); assert.equal(s.stats.wins,1);
  assert.ok(restoreSession(s,players,version));
});
test('club clue excludes selected club, remains informative, and share text follows the same rules',()=>{
  const roster=clubPlayers(players,'inter');let miss,match;
  for(const a of roster) for(const b of roster){
    assert.ok(!clueClubs(a,b,'inter').some(c=>clubId(c)===clubId('Inter')));
    if(clueClubHint(a,b,'inter')==='miss')miss=[a,b];
    if(clueClubHint(a,b,'inter')==='match')match=[a,b];
  }
  assert.ok(miss);assert.ok(match);
  const [guess,target]=miss;
  const spec={catalog:'L1',level:target.difficulty,theme:'inter',seed:seedForPlayer(players,target,'inter',()=>3)};
  const text=resultText({spec,targetId:target.id,guessIds:[guess.id,target.id],hintUsed:false},players,'https://example.com/');
  assert.ok(text.includes('Modalità Inter'));assert.ok(text.includes('fg2.C1.inter'));
  const row=text.split('\n')[3]; assert.equal([...row][1],'🟥');
  assert.ok(!text.includes(target.name));
});
test('each club difficulty exhausts its pool before repeating, including switches and reloads',()=>{
  for(const mode of modes)for(const level of levels){
    let s=switchMode(initial(),players,mode,()=>19); const seen=new Set();
    if(challengePool(players,level,mode).some(p=>p.id===s.free.targetId))seen.add(s.free.targetId);
    const size=challengePool(players,level,mode).length;
    while(seen.size<size){
      s=nextFree(s,players,level,mode,()=>31);
      assert.ok(!seen.has(s.free.targetId));seen.add(s.free.targetId);
      s=switchMode(s,players,'all',()=>2);s=switchMode(s,players,mode,()=>2);
      s=restoreSession(JSON.parse(JSON.stringify(s)),players,version);assert.ok(s);
    }
    assert.equal(modeOf(s.free.spec.theme),mode);
  }
});
test('restarting a club abandons only that pending board, preserving the other four modes',()=>{
  let s=guessInSession(initial(),2,players);
  s=switchMode(s,players,'milan',()=>3);
  const miss=clubPlayers(players,'milan').find(p=>p.id!==s.free.targetId);
  s=guessInSession(s,miss.id,players);
  s=nextFree(s,players,'tutti','milan',()=>7);
  assert.equal(s.stats.started,2);assert.equal(s.stats.abandoned,1);
  assert.ok(restoreSession(s,players,version));
  s=switchMode(s,players,'all',()=>3);
  assert.deepEqual(s.free.guessIds,[2]);
  const corrupt=JSON.parse(JSON.stringify(s));
  corrupt.parked.milan.history=[];
  assert.equal(restoreSession(corrupt,players,version),null);
});
