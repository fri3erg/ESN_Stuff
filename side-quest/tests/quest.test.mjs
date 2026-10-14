import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Q from '../quest.js';

const fixed = k => () => k;            // rng that always returns k
const seq = (...ks) => { let i = 0; return () => ks[i++ % ks.length]; };

test('pickMission is uniform over all 20 missions', () => {
  const counts = new Map();
  for (let i = 0; i < 20000; i++) { const id = Q.pickMission(); counts.set(id, (counts.get(id) || 0) + 1); }
  assert.equal(counts.size, 20);
  for (const [id, c] of counts) assert.ok(c > 800 && c < 1200, `mission ${id}: ${c}`);
});

test('a few hundred picks show every mission', () => {
  const seen = new Set();
  for (let i = 0; i < 400; i++) seen.add(Q.pickMission());
  assert.equal(seen.size, 20);
});

test('secureRandomInt stays in range', () => {
  for (let i = 0; i < 2000; i++) { const v = Q.secureRandomInt(7); assert.ok(v >= 0 && v < 7 && Number.isInteger(v)); }
});

test('assign creates a fresh assigned state', () => {
  assert.deepEqual(Q.assign(fixed(4)), { missionId: 5, status: 'assigned', swapsUsed: 0, completedAt: null });
});

test('swap gives a different mission, once only; double tap is harmless', () => {
  for (let k = 0; k < 19; k++) {
    const s = Q.assign(fixed(k));
    const s2 = Q.swap(s, fixed(k));
    assert.notEqual(s2.missionId, s.missionId);
    assert.equal(s2.swapsUsed, 1);
    assert.equal(Q.canSwap(s2), false);
    assert.deepEqual(Q.swap(s2, fixed(0)), s2);   // second swap: no change
  }
});

test('cannot swap after completing', () => {
  const done = Q.complete(Q.assign(fixed(0)), new Date(2026, 9, 14, 22, 41));
  assert.equal(Q.canSwap(done), false);
  assert.deepEqual(Q.swap(done), done);
});

test('complete sets status and ISO time; completing twice keeps the first time', () => {
  const t1 = new Date(2026, 9, 14, 22, 41, 7);
  const done = Q.complete(Q.assign(fixed(2)), t1);
  assert.equal(done.status, 'completed');
  assert.equal(done.completedAt, t1.toISOString());
  assert.deepEqual(Q.complete(done, new Date(2026, 9, 14, 23, 0)), done);
});

test('formatTime shows local HH:MM', () => {
  assert.equal(Q.formatTime(new Date(2026, 9, 14, 22, 41, 59).toISOString()), '22:41');
  assert.equal(Q.formatTime(new Date(2026, 9, 14, 7, 5).toISOString()), '07:05');
});

test('save/load round-trips and clear removes', () => {
  const st = Q.memoryStorage();
  const s = Q.swap(Q.assign(seq(3)), seq(0));
  Q.save(st, s);
  assert.deepEqual(Q.load(st), s);
  Q.clear(st);
  assert.equal(Q.load(st), null);
});

test('load treats corrupt or invalid data as no state', () => {
  const st = Q.memoryStorage();
  const bad = [
    '{nope', 'null', '42', '[]',
    JSON.stringify({ missionId: 99, status: 'assigned', swapsUsed: 0, completedAt: null }),   // mission removed
    JSON.stringify({ missionId: 3, status: 'won', swapsUsed: 0, completedAt: null }),
    JSON.stringify({ missionId: 3, status: 'assigned', swapsUsed: 2, completedAt: null }),
    JSON.stringify({ missionId: 3, status: 'completed', swapsUsed: 0, completedAt: null }),
    JSON.stringify({ missionId: 3, status: 'completed', swapsUsed: 0, completedAt: 'yesterday-ish' }),
  ];
  for (const raw of bad) { st.setItem(Q.KEY, raw); assert.equal(Q.load(st), null, raw); }
});

test('a throwing storage never throws out of load/save/clear', () => {
  const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.equal(Q.load(boom), null);
  assert.doesNotThrow(() => Q.save(boom, Q.assign()));
  assert.doesNotThrow(() => Q.clear(boom));
});

test('safeStorage falls back to memory when localStorage is missing', () => {
  const st = Q.safeStorage();          // Node has no localStorage by default
  st.setItem('a', '1');
  assert.equal(st.getItem('a'), '1');
});

test('missionById', () => {
  assert.equal(Q.missionById(15).id, 15);
  assert.equal(Q.missionById(0), null);
});
