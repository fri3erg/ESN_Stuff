import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../data/cases.js';
import { normaliseCode, codeKey, lookupCode } from '../lib/codes.js';

test('all 20 codes are unique after normalisation', () => {
  const keys = CASES.flatMap(c => c.clues.map(x => codeKey(x.code)));
  assert.equal(keys.length, 20);
  assert.equal(new Set(keys).size, 20);
  assert.ok(keys.every(k => k.length >= 3));
});

test('every code resolves to its own case and letter', () => {
  for (const c of CASES) for (const clue of c.clues) {
    assert.deepEqual(lookupCode(clue.code), { caseId: c.id, letter: clue.letter });
  }
});

test('sloppy input still matches', () => {
  assert.equal(normaliseCode(' Hello-Kitty! '), 'hellokitty');
  assert.deepEqual(lookupCode('night bus'), { caseId: 4, letter: 'C' });
  assert.deepEqual(lookupCode('NIGHTBUS'), { caseId: 4, letter: 'C' });
  assert.deepEqual(lookupCode('Kebabs'), { caseId: 3, letter: 'E' });
  assert.deepEqual(lookupCode('shot'), { caseId: 3, letter: 'B' });
  assert.deepEqual(lookupCode('hello kitty'), { caseId: 2, letter: 'E' });
  assert.deepEqual(lookupCode(' pizza '), { caseId: 4, letter: 'E' });
  assert.deepEqual(lookupCode('FANTACÁLCIO'), { caseId: 2, letter: 'D' });
});

test('garbage does not match', () => {
  for (const s of ['', '   ', 's', 'S', 'pizzaa', 'kebap', 'case 1', null, undefined]) {
    assert.equal(lookupCode(s), null, String(s));
  }
});
