// Tiny i18n: t(key, vars) for UI strings, tr({en,it,es}) for data texts. Falls back to English.
import { UI } from '../data/ui.js';

export const LANGS = ['en', 'it', 'es'];
let current = 'en';

export function setLang(l) {
  current = LANGS.includes(l) ? l : 'en';
  return current;
}

export function getLang() {
  return current;
}

export function detectLang(navLang) {
  const p = String(navLang || '').slice(0, 2).toLowerCase();
  return LANGS.includes(p) ? p : 'en';
}

export function t(key, vars = {}) {
  const s = UI[current]?.[key] ?? UI.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function tr(obj) {
  return obj?.[current] || obj?.en || '';
}
