import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseName, assignClues, hash32 } from '../lib/assign.js';

test('normaliseName folds case, accents, punctuation and spacing', () => {
  for (const s of [' Márco  ', 'marco', 'MARCO!', 'Marco.']) assert.equal(normaliseName(s), 'marco');
  assert.equal(normaliseName('marco\t rossi'), 'marco rossi');
  assert.equal(normaliseName('Jean - Luc'), 'jean luc');
  assert.equal(normaliseName('   '), '');
  assert.equal(normaliseName('!!!'), '');
  assert.equal(normaliseName(undefined), '');
});

test('non-Latin names are kept, not emptied', () => {
  assert.equal(normaliseName('Δημήτρης'), 'δημητρης');
  assert.equal(normaliseName('Мария'), 'мария');
  assert.ok(normaliseName('محمد').length > 0);
  assert.ok(assignClues('Мария'));
});

test('hash32 is a stable unsigned 32-bit number', () => {
  assert.equal(hash32('marco|1'), hash32('marco|1'));
  const h = hash32('anything');
  assert.ok(Number.isInteger(h) && h >= 0 && h <= 0xffffffff);
});

test('assignClues is deterministic and spelling-insensitive', () => {
  const a = assignClues('Marco');
  assert.deepEqual(Object.keys(a), ['1', '2', '3', '4']);
  for (const l of Object.values(a)) assert.match(l, /^[A-E]$/);
  assert.deepEqual(assignClues('  MÁRCO '), a);
  assert.equal(assignClues(''), null);
  assert.equal(assignClues('?!'), null);
});

test('500 realistic names spread evenly: every letter 14–26% in every case', () => {
  const F = ['Marco','Sara','Lucas','Emma','Mateo','Sofia','Hugo','Lea','Jonas','Anna','Pablo','Lucia','Noah','Mia','Luca','Chiara','Tom','Julia','Ivan','Olga','Pierre','Camille','Javier','Elena','Mehmet','Ayse','Jan','Eva','Diego','Laura','Felix','Clara','Nikos','Maria','Ahmed','Ines','Kasper','Freya','Tomas','Zofia','Ali','Nora','Oscar','Alba','Pedro','Marta','Lukas','Hannah','Andrei','Ioana'];
  const L = ['', 'R', 'S', 'Garcia', 'Muller', 'Rossi', 'Dubois', 'Novak', 'Silva', 'Jansen'];
  const names = F.flatMap(f => L.map(l => `${f} ${l}`.trim()));
  assert.equal(names.length, 500);
  for (const id of [1, 2, 3, 4]) {
    const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const n of names) counts[assignClues(n)[id]]++;
    for (const [letter, c] of Object.entries(counts)) {
      const share = c / names.length;
      assert.ok(share >= 0.14 && share <= 0.26, `case ${id} letter ${letter}: ${share}`);
    }
  }
});
