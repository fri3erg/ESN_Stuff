// Deterministic clue assignment: the same (normalised) name always gets the same 4 clues.
const LETTERS = 'ABCDE';
const CASE_IDS = [1, 2, 3, 4];

export function normaliseName(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')          // strip accents
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N} ]+/gu, '') // keep letters (any script), digits, spaces
    .replace(/ +/g, ' ')
    .trim();
}

// FNV-1a over UTF-8 bytes, finished with murmur3's fmix32 so similar names spread well.
export function hash32(str) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(str)) {
    h ^= b;
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function assignClues(name) {
  const n = normaliseName(name);
  if (!n) return null;
  const out = {};
  for (const id of CASE_IDS) out[id] = LETTERS[hash32(`${n}|${id}`) % LETTERS.length];
  return out;
}
