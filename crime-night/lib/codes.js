// Code words players read to each other. Matching ignores case, accents, spaces,
// punctuation and one trailing "s" (so "kebabs" = "kebab", "night bus" = "NIGHTBUS").
import { CASES } from '../data/cases.js';

export function normaliseCode(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function codeKey(s) {
  return normaliseCode(s).replace(/s$/, '');
}

const INDEX = new Map(
  CASES.flatMap(c => c.clues.map(clue => [codeKey(clue.code), { caseId: c.id, letter: clue.letter }]))
);

export function lookupCode(input) {
  const key = codeKey(input);
  return key ? INDEX.get(key) ?? null : null;
}
