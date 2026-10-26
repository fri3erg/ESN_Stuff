import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, PROOFS, proofOf } from '../missions.js';

test('23 missions with ids 1..23, unique', () => {
  assert.deepEqual(MISSIONS.map(m => m.id), Array.from({ length: 23 }, (_, i) => i + 1));
});

test('the three added quests (21-23) have the requested proof', () => {
  const [a, b, c] = MISSIONS.slice(20);
  assert.equal(a.proof, 'photo'); assert.equal(proofOf(a).text, 'Proof: show the pictures to a volunteer');
  assert.equal(b.proof, 'video'); assert.match(b.text, /Happy Birthday/);
  assert.equal(c.proof, 'tell');  assert.match(c.text, /5 hugs/);
});

test('every mission has text and a known proof type', () => {
  for (const m of MISSIONS) {
    assert.ok(m.text.trim().length > 10, `mission ${m.id} text`);
    assert.ok(m.proof in PROOFS, `mission ${m.id} proof ${m.proof}`);
    if ('proofNote' in m) assert.ok(m.proofNote.startsWith('Proof:'), `mission ${m.id} proofNote`);
  }
});

test('proofOf uses proofNote when present, else the type default', () => {
  assert.deepEqual(proofOf(MISSIONS[0]), { icon: '✋', text: 'Proof: wear it and show a volunteer' });
  assert.deepEqual(proofOf(MISSIONS[1]), { icon: '💬', text: 'Proof: tell a volunteer what happened' });
  assert.deepEqual(proofOf(MISSIONS[3]), { icon: '🎥', text: 'Proof: show a volunteer the video' });
});
