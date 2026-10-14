// Side Quest state: pure functions over a small JSON object kept in localStorage.
import { MISSIONS } from './missions.js';

export const KEY = 'sidequest.v1';
export const IDS = MISSIONS.map(m => m.id);

export function missionById(id) {
  return MISSIONS.find(m => m.id === id) || null;
}

// Uniform integer in 0..n-1. crypto with rejection sampling (no modulo bias), else Math.random.
export function secureRandomInt(n) {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const limit = Math.floor(0x100000000 / n) * n;
    const buf = new Uint32Array(1);
    do { c.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  return Math.floor(Math.random() * n);
}

export function pickMission(rng = secureRandomInt, exclude = null) {
  const pool = exclude == null ? IDS : IDS.filter(id => id !== exclude);
  return pool[rng(pool.length)];
}

export function assign(rng = secureRandomInt) {
  return { missionId: pickMission(rng), status: 'assigned', swapsUsed: 0, completedAt: null };
}

export function canSwap(state) {
  return !!state && state.status === 'assigned' && state.swapsUsed === 0;
}

export function swap(state, rng = secureRandomInt) {
  if (!canSwap(state)) return state;
  return { ...state, missionId: pickMission(rng, state.missionId), swapsUsed: 1 };
}

export function complete(state, now = new Date()) {
  if (!state || state.status !== 'assigned') return state;
  return { ...state, status: 'completed', completedAt: now.toISOString() };
}

export function isValid(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
  if (!IDS.includes(s.missionId)) return false;
  if (s.swapsUsed !== 0 && s.swapsUsed !== 1) return false;
  if (s.status === 'assigned') return s.completedAt === null;
  if (s.status === 'completed') return typeof s.completedAt === 'string' && !Number.isNaN(Date.parse(s.completedAt));
  return false;
}

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
  };
}

// localStorage when it works; in private mode (or anywhere it throws) an in-memory store for this visit.
export function safeStorage() {
  try {
    const ls = globalThis.localStorage;
    ls.setItem('__sq_test', '1');
    ls.removeItem('__sq_test');
    return ls;
  } catch {
    return memoryStorage();
  }
}

export function load(storage) {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return isValid(s) ? s : null;
  } catch {
    return null;
  }
}

export function save(storage, state) {
  try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* full or blocked: keep going in memory */ }
}

export function clear(storage) {
  try { storage.removeItem(KEY); } catch { /* ignore */ }
}

export function formatTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
