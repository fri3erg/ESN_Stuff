import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../data/cases.js';
import { SUSPECTS } from '../data/suspects.js';

const LANGS = ['en', 'it', 'es'];
const names = SUSPECTS.map(s => s.name);

function assertTranslated(obj, where) {
  for (const l of LANGS) assert.ok(typeof obj?.[l] === 'string' && obj[l].trim(), `${where} missing ${l}`);
}

test('9 unique suspects with captions in all languages', () => {
  assert.equal(SUSPECTS.length, 9);
  assert.equal(new Set(names).size, 9);
  for (const s of SUSPECTS) assertTranslated(s.caption, `caption ${s.name}`);
});

test('4 cases with ids 1..4 and culprit counts 1,1,2,2', () => {
  assert.deepEqual(CASES.map(c => c.id), [1, 2, 3, 4]);
  assert.deepEqual(CASES.map(c => c.culprits), [1, 1, 2, 2]);
});

test('every case is fully translated and has clues A–E exactly once', () => {
  for (const c of CASES) {
    assertTranslated(c.title, `case ${c.id} title`);
    assertTranslated(c.short, `case ${c.id} short`);
    assertTranslated(c.crime, `case ${c.id} crime`);
    assert.deepEqual(c.clues.map(x => x.letter), ['A', 'B', 'C', 'D', 'E']);
    for (const clue of c.clues) {
      assertTranslated(clue.text, `case ${c.id} clue ${clue.letter}`);
      assert.ok(clue.code.trim(), `case ${c.id} clue ${clue.letter} code`);
      assert.ok(clue.clears.length >= 1 && clue.clears.length <= 2);
      for (const n of clue.clears) assert.ok(names.includes(n), `unknown suspect ${n}`);
    }
  }
});

test('collecting all 5 clues leaves exactly the culprit count', () => {
  for (const c of CASES) {
    const cleared = new Set(c.clues.flatMap(x => x.clears));
    const left = names.filter(n => !cleared.has(n));
    assert.equal(left.length, c.culprits, `case ${c.id}`);
  }
});

test('no single clue is redundant (each clears someone no other clue clears)', () => {
  for (const c of CASES) {
    for (const clue of c.clues) {
      const others = new Set(c.clues.filter(x => x !== clue).flatMap(x => x.clears));
      assert.ok(clue.clears.some(n => !others.has(n)), `case ${c.id} clue ${clue.letter} is redundant`);
    }
  }
});
