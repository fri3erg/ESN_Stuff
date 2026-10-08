import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UI } from '../data/ui.js';
import { t, tr, setLang, getLang, detectLang, LANGS } from '../lib/i18n.js';

test('it and es have exactly the same keys as en, all non-empty', () => {
  const en = Object.keys(UI.en).sort();
  for (const l of ['it', 'es']) {
    assert.deepEqual(Object.keys(UI[l]).sort(), en, l);
    for (const k of en) assert.ok(UI[l][k].trim(), `${l}.${k}`);
  }
});

test('placeholders match across languages', () => {
  const ph = s => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const k of Object.keys(UI.en)) for (const l of ['it', 'es']) {
    assert.equal(ph(UI[l][k]), ph(UI.en[k]), `${l}.${k}`);
  }
});

test('t substitutes vars and falls back', () => {
  setLang('it');
  assert.equal(getLang(), 'it');
  assert.equal(t('evidence_count', { n: 3 }), '3/5 prove');
  assert.equal(t('no_such_key'), 'no_such_key');
  setLang('xx');
  assert.equal(getLang(), 'en');
});

test('tr picks the current language, falling back to en', () => {
  setLang('es');
  assert.equal(tr({ en: 'a', it: 'b', es: 'c' }), 'c');
  assert.equal(tr({ en: 'a' }), 'a');
  assert.equal(tr(undefined), '');
  setLang('en');
});

test('detectLang reads navigator.language prefixes', () => {
  assert.equal(detectLang('it-IT'), 'it');
  assert.equal(detectLang('es-419'), 'es');
  assert.equal(detectLang('de-DE'), 'en');
  assert.equal(detectLang(undefined), 'en');
  assert.deepEqual(LANGS, ['en', 'it', 'es']);
});
