import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../data/cases.js';
import { assignClues } from '../lib/assign.js';
import * as S from '../lib/state.js';

test('create pre-unlocks exactly the player\'s own clues', () => {
  const s = S.create('Marco', 'it');
  const own = assignClues('Marco');
  for (const id of [1, 2, 3, 4]) assert.deepEqual(s.unlocked[id], [own[id]]);
  assert.equal(s.lang, 'it');
  assert.ok(!('team' in s), 'no team field');
  assert.deepEqual(S.ownClues(s), own);
  assert.equal(S.create('  !! '), null);
});

test('create trims and caps the name at 40 chars', () => {
  const s = S.create('  ' + 'x'.repeat(60));
  assert.equal(s.name.length, 40);
});

test('progress saved by the old version (with a team field) still loads', () => {
  const st = S.memoryStorage();
  const old = { ...S.create('Pablo'), team: 'Sherlock Homies' };
  st.setItem(S.KEY, JSON.stringify(old));
  const loaded = S.load(st);
  assert.ok(loaded);
  assert.equal(loaded.name, 'Pablo');
});

test('state without a team field loads', () => {
  const st = S.memoryStorage();
  const s = S.create('Ines');
  delete s.team;
  st.setItem(S.KEY, JSON.stringify(s));
  assert.ok(S.load(st));
});

test('save + load round-trips', () => {
  const st = S.memoryStorage();
  const s = S.create('Sara');
  S.unlock(s, 1, s.unlocked[1][0] === 'A' ? 'B' : 'A');
  S.save(st, s);
  assert.deepEqual(S.load(st), s);
  S.clear(st);
  assert.equal(S.load(st), null);
});

test('load survives garbage, missing fields and throwing storage', () => {
  const st = S.memoryStorage();
  for (const raw of ['{not json', 'null', '42', '{"name":""}', JSON.stringify({ name: 'Ok', unlocked: {}, manual: {}, verdict: {} })]) {
    st.setItem(S.KEY, raw);
    assert.equal(S.load(st), null, raw);
  }
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  assert.equal(S.load(throwing), null);
  assert.doesNotThrow(() => S.save(throwing, S.create('Ana')));
  assert.doesNotThrow(() => S.clear(throwing));
});

test('load re-adds a missing own clue', () => {
  const st = S.memoryStorage();
  const s = S.create('Lucas');
  s.unlocked[2] = [];
  st.setItem(S.KEY, JSON.stringify(s));
  assert.deepEqual(S.load(st).unlocked[2], [assignClues('Lucas')[2]]);
});

test('unlock reports new vs known', () => {
  const s = S.create('Emma');
  const mine = s.unlocked[3][0];
  const other = mine === 'A' ? 'B' : 'A';
  assert.equal(S.unlock(s, 3, mine), 'known');
  assert.equal(S.unlock(s, 3, other), 'new');
  assert.equal(S.unlock(s, 3, other), 'known');
  assert.equal(s.unlocked[3].length, 2);
});

test('crossed: evidence clears are separate from manual marks', () => {
  const s = S.create('Hugo');
  const c1 = CASES[0];
  s.unlocked[1] = ['A'];                       // A clears Sissi + Roberta
  S.toggleManual(s, 1, 'Leo');
  let x = S.crossed(s, c1);
  assert.equal(x.cleared.get('Sissi'), 'A');
  assert.equal(x.cleared.get('Roberta'), 'A');
  assert.ok(!x.cleared.has('Leo'));
  assert.ok(x.manual.has('Leo'));
  S.toggleManual(s, 1, 'Leo');
  x = S.crossed(s, c1);
  assert.ok(!x.manual.has('Leo'));
});

test('setVerdict stores a copy with a timestamp', () => {
  const s = S.create('Mia');
  const picked = ['Sissi', 'Roberta'];
  S.setVerdict(s, 3, picked, 123);
  picked.push('Leo');
  assert.deepEqual(s.verdict[3], { accused: ['Sissi', 'Roberta'], at: 123 });
});

test('load rejects corrupt verdict entries instead of crashing later', () => {
  const st = S.memoryStorage();
  for (const verdict of [{ 1: {} }, { 1: { accused: 'Leo', at: 1 } }, { 1: { accused: [1, 2], at: 1 } }, { 1: null }]) {
    const s = S.create('Nora');
    s.verdict = verdict;
    st.setItem(S.KEY, JSON.stringify(s));
    const loaded = S.load(st);
    assert.ok(loaded, 'state still loads');
    assert.deepEqual(loaded.verdict, {}, JSON.stringify(verdict));
  }
  const ok = S.create('Nora');
  S.setVerdict(ok, 3, ['Sissi', 'Roberta'], 5);
  st.setItem(S.KEY, JSON.stringify(ok));
  assert.deepEqual(S.load(st).verdict, { 3: { accused: ['Sissi', 'Roberta'], at: 5 } });
});
