// Player progress, persisted in localStorage (or memory when storage is unavailable).
import { assignClues, normaliseName } from './assign.js';

export const KEY = 'crimenight.v1';
const IDS = [1, 2, 3, 4];
const MAX_LEN = 40;
const perCase = () => ({ 1: [], 2: [], 3: [], 4: [] });

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
  };
}

export function safeStorage() {
  try {
    const ls = globalThis.localStorage;
    ls.setItem('__cn_test', '1');
    ls.removeItem('__cn_test');
    return ls;
  } catch {
    return memoryStorage();
  }
}

export function create(name, lang = 'en') {
  const own = assignClues(name);
  if (!own) return null;
  const unlocked = perCase();
  for (const id of IDS) unlocked[id] = [own[id]];
  return {
    name: String(name).trim().slice(0, MAX_LEN),
    lang,
    unlocked,
    manual: perCase(),
    verdict: {},
  };
}

export function ownClues(state) {
  return assignClues(state.name);
}

function isValid(s) {
  return !!s && typeof s === 'object'
    && typeof s.name === 'string' && normaliseName(s.name) !== ''
    && s.unlocked && s.manual && s.verdict && typeof s.verdict === 'object'
    && IDS.every(id => Array.isArray(s.unlocked[id]) && Array.isArray(s.manual[id]));
}

export function load(storage) {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!isValid(s)) return null;
    const own = ownClues(s);
    for (const id of IDS) if (!s.unlocked[id].includes(own[id])) s.unlocked[id].unshift(own[id]);
    for (const [id, v] of Object.entries(s.verdict)) {
      const ok = v && Array.isArray(v.accused) && v.accused.every(n => typeof n === 'string');
      if (!ok) delete s.verdict[id];
    }
    return s;
  } catch {
    return null;
  }
}

export function save(storage, state) {
  try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked: keep playing in memory */ }
}

export function clear(storage) {
  try { storage.removeItem(KEY); } catch { /* ignore */ }
}

export function unlock(state, caseId, letter) {
  const list = state.unlocked[caseId];
  if (list.includes(letter)) return 'known';
  list.push(letter);
  return 'new';
}

export function toggleManual(state, caseId, name) {
  const list = state.manual[caseId];
  const i = list.indexOf(name);
  if (i >= 0) list.splice(i, 1);
  else list.push(name);
}

export function crossed(state, caseData) {
  const got = state.unlocked[caseData.id];
  const cleared = new Map();
  for (const clue of caseData.clues) {
    if (!got.includes(clue.letter)) continue;
    for (const n of clue.clears) if (!cleared.has(n)) cleared.set(n, clue.letter);
  }
  return { cleared, manual: new Set(state.manual[caseData.id]) };
}

export function setVerdict(state, caseId, accused, at = Date.now()) {
  state.verdict[caseId] = { accused: [...accused], at };
}
