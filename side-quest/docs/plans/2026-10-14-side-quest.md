# Side Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A one-page static phone site: scan → get one random side quest (hidden until tapped, laser reveal) → optional single swap with confirmation → "I did it" → trophy screen with completion time to show a volunteer for a prize.

**Architecture:** Three static files with no build step. `missions.js` (data the organiser edits), `quest.js` (pure state logic, unit-tested with Node) and `index.html` (inline CSS + inline module that renders three states and handles taps). State is in `localStorage` (`sidequest.v1`), with an in-memory fallback. Deployed by Vercel from `side-quest/`.

**Tech Stack:** HTML, CSS, vanilla JS ES modules. Node 22 `node --test` for unit tests. Headless Chrome via puppeteer-core (throwaway scratch script) for the browser walkthrough. Lighthouse for accessibility.

**Spec:** [side-quest/docs/specs/2026-10-14-side-quest-design.md](../specs/2026-10-14-side-quest-design.md), which builds on [side-quest/docs/brief.md](../brief.md)

## Global Constraints

- No backend, no third-party requests (no CDN, no web fonts, no analytics), no cookies, no env vars, no npm runtime dependencies.
- English only, short plain sentences.
- Works at 360 px wide with no horizontal scroll. Tap targets ≥ 48 px. Body text ≥ 18 px. WCAG AA contrast. Dark theme.
- Respect `prefers-reduced-motion`: no laser/scramble/background drift/sweep; the reveal is instant.
- Storage key `sidequest.v1`, value `{ "missionId": n, "status": "assigned"|"completed", "swapsUsed": 0|1, "completedAt": ISO|null }`.
- Copy: rules "Get your quest." / "Complete it." / "Done? Find a volunteer, show them, get a prize 🎁". Buttons "GET MY QUEST ▶", "I DID IT ▶", "🔄 Swap quest (1 left)". Sheet "Swap your quest?" / "You only get one swap tonight. Your new quest is final, no going back." / "YES, SWAP IT" / "Keep my quest". Complete: "Quest complete!" / "Go find a volunteer." / "COMPLETED AT" + HH:MM.
- No consent line, no live clock, no "One quest per person" line (spec §1).
- Colours: bg `#07070b`, lime `#c6ff00`, pink `#ff4fae` (badge text dark `#0a0a0a`), card `#14141c`, complete-screen cyan `#7ee8f2`.
- `?reset=1` clears state and strips the parameter with `history.replaceState`.
- Commit after each task and push right away (standing instruction for this repo).

## Review Focus

1. **A double tap on "YES, SWAP IT" or "I DID IT"** must not swap twice or crash. State functions are idempotent through guards. Unit test in Task 2.
2. **Missions edited between visits** (a stored `missionId` that no longer exists) must show the welcome screen, not crash. Unit test in Task 2.
3. **Tapping reveal repeatedly / during the animation** must not stack countdown timers or leave the quest permanently visible. Browser check in Task 3.
4. **Completion time is in the phone's local time** (HH:MM, 24 h), not UTC. Unit test in Task 2.
5. **Mission text with quotes, dashes, apostrophes** (e.g. #9, #2) must render as text, never as HTML. Browser check in Task 3.

---

## File map

```
side-quest/
├── index.html          # Task 3
├── missions.js         # Task 1
├── quest.js            # Task 2
├── package.json        # Task 1
├── .vercelignore       # Task 1
├── tests/missions.test.mjs  # Task 1
├── tests/quest.test.mjs     # Task 2
├── README.md           # Task 4
└── docs/               # brief, spec, this plan
```

Run commands from `D:/git/ESN_Stuff/side-quest` unless stated.

---

### Task 1: Mission data

**Files:**
- Create: `side-quest/package.json`, `side-quest/.vercelignore`, `side-quest/missions.js`
- Test: `side-quest/tests/missions.test.mjs`

**Interfaces:**
- Produces: `PROOFS: Record<'live'|'photo'|'video'|'phone'|'tell', {icon: string, text: string}>`, `MISSIONS: Array<{id: number, proof: string, text: string, proofNote?: string}>`, `proofOf(mission) -> {icon, text}`.

- [ ] **Step 1: Create `package.json` and `.vercelignore`**

```json
{
  "name": "esn-side-quest",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"tests/*.test.mjs\""
  }
}
```

`.vercelignore`:
```
tests
docs
package.json
README.md
```

- [ ] **Step 2: Write the failing test** `tests/missions.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, PROOFS, proofOf } from '../missions.js';

test('20 missions with ids 1..20, unique', () => {
  assert.deepEqual(MISSIONS.map(m => m.id), Array.from({ length: 20 }, (_, i) => i + 1));
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
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node --test tests/missions.test.mjs`
Expected: FAIL, `Cannot find module '…/missions.js'`.

- [ ] **Step 4: Create `missions.js`** (texts copied verbatim from the brief §5)

```js
// The 20 side quests. To change wording, edit only this file; the logic lives in quest.js.
// proof: how the player proves it to a volunteer. proofNote replaces the default instruction.
export const PROOFS = {
  live:  { icon: '✋', text: 'Proof: do it live in front of a volunteer' },
  photo: { icon: '📷', text: 'Proof: show a volunteer the photo' },
  video: { icon: '🎥', text: 'Proof: show a volunteer the video' },
  phone: { icon: '📱', text: 'Proof: show a volunteer on your phone' },
  tell:  { icon: '💬', text: 'Proof: tell a volunteer what happened' },
};

export const MISSIONS = [
  { id: 1,  proof: 'live',  text: 'Swap a piece of clothing (hoodie, hat, scarf) with a stranger.', proofNote: 'Proof: wear it and show a volunteer' },
  { id: 2,  proof: 'tell',  text: "Get a sip of someone's drink you don't know." },
  { id: 3,  proof: 'phone', text: "Get two strangers who don't know each other to exchange Instagram.", proofNote: 'Proof: show the new follow or chat on your phone' },
  { id: 4,  proof: 'video', text: 'Get someone to teach you a dance move and dance it together.' },
  { id: 5,  proof: 'live',  text: 'Get a stranger to draw a small fake tattoo on your hand with a pen.', proofNote: 'Proof: show the tattoo to a volunteer' },
  { id: 6,  proof: 'photo', text: 'Get two separate groups of strangers to toast all together.' },
  { id: 7,  proof: 'tell',  text: 'Have a whole conversation with a stranger, each of you speaking only your own language, trying to understand each other.' },
  { id: 8,  proof: 'photo', text: 'Set up a swap between your group and a group of strangers: send one of your friends over to them, and get one of them sent over to you.' },
  { id: 9,  proof: 'tell',  text: "Get a stranger to tell you a story — true or made up on the spot — behind a tattoo, scar, or item they're wearing: at the end you have to guess whether it was true or false, and get it right." },
  { id: 10, proof: 'tell',  text: "Get someone to tell you a secret they've never told a stranger before.", proofNote: 'Proof: tell a volunteer who it was, not the secret' },
  { id: 11, proof: 'phone', text: "Get a small group of strangers to record AND actually send a video message together for a friend of yours who isn't here tonight.", proofNote: 'Proof: show the sent message on your phone' },
  { id: 12, proof: 'video', text: 'Get a group of at least 3 strangers to sing a song of your choice with you, and get someone to film it.' },
  { id: 13, proof: 'photo', text: "Organize a group photo with at least 5 strangers who don't know each other, and get it sent to you." },
  { id: 14, proof: 'video', text: 'Set up a mini a cappella karaoke battle with a stranger: take turns singing a verse each of the same song, no music.' },
  { id: 15, proof: 'live',  text: 'Invent a secret handshake with a stranger, on the spot, with at least 3 different moves, and lock it in together.', proofNote: 'Proof: show the handshake to a volunteer' },
  { id: 16, proof: 'tell',  text: 'Try to guess where a stranger is from and what they study: you only get 3 guesses in total.' },
  { id: 17, proof: 'video', text: 'Challenge a stranger to a staring contest: whoever laughs or blinks first buys the next round (non-alcoholic is fine too).' },
  { id: 18, proof: 'live',  text: 'Get someone to teach you a small good-luck ritual from their country, and do it together before the next toast.', proofNote: 'Proof: show the ritual to a volunteer' },
  { id: 19, proof: 'live',  text: 'Get a stranger to teach you a full sentence (not just a word) in their language, then use it with a different third person and make yourself understood.', proofNote: 'Proof: say the sentence to a volunteer' },
  { id: 20, proof: 'video', text: 'Create a dance combo with a stranger, just the two of you.' },
];

export function proofOf(mission) {
  const p = PROOFS[mission.proof];
  return { icon: p.icon, text: mission.proofNote || p.text };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test tests/missions.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit and push**

```bash
git add side-quest/package.json side-quest/.vercelignore side-quest/missions.js side-quest/tests/missions.test.mjs
git commit -m "Side Quest: mission data with tests"
git push origin main
```

---

### Task 2: State logic

**Files:**
- Create: `side-quest/quest.js`
- Test: `side-quest/tests/quest.test.mjs`

**Interfaces:**
- Consumes: `MISSIONS` from `missions.js`.
- Produces:
  - `KEY = 'sidequest.v1'`, `IDS: number[]`, `missionById(id) -> mission|null`
  - `secureRandomInt(n) -> 0..n-1` (crypto + rejection sampling, Math.random fallback)
  - `pickMission(rng = secureRandomInt, exclude = null) -> id` where `rng(n)` returns an int in `0..n-1`
  - `assign(rng?) -> State`, `canSwap(state) -> boolean`, `swap(state, rng?) -> State`, `complete(state, now = new Date()) -> State`
  - `isValid(obj) -> boolean`, `load(storage) -> State|null`, `save(storage, state)`, `clear(storage)`
  - `memoryStorage()`, `safeStorage()`, `formatTime(iso) -> 'HH:MM'` (local time)

- [ ] **Step 1: Write the failing test** `tests/quest.test.mjs`

```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/quest.test.mjs`
Expected: FAIL, `Cannot find module '…/quest.js'`.

- [ ] **Step 3: Implement `quest.js`**

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test "tests/*.test.mjs"`
Expected: PASS, all tests in both files.

- [ ] **Step 5: Commit and push**

```bash
git add side-quest/quest.js side-quest/tests/quest.test.mjs
git commit -m "Side Quest: state logic (random pick, single swap, complete, safe storage)"
git push origin main
```

---

### Task 3: The page (render, reveal, swap sheet, trophy screen)

**Files:**
- Create: `side-quest/index.html`
- Scratch (not committed): `<scratchpad>/e2e/sq-walk.mjs`

**Interfaces:**
- Consumes: `MISSIONS`, `proofOf` (missions.js); `safeStorage, load, save, clear, assign, canSwap, swap, complete, missionById, formatTime` (quest.js).
- DOM ids used by the walkthrough: `#get`, `#reveal`, `#qtext`, `#left`, `#hide`, `#did`, `#swap`, `#sheet`, `#yes`, `#no`, `.badge`, `.ach`, `#ctime`, `.qcard`, `.laser`.

- [ ] **Step 1: Write the failing browser walkthrough** `<scratchpad>/e2e/sq-walk.mjs`

(Uses the puppeteer-core install already in the scratch `e2e` folder; serve the site with `npx --yes serve -l 5174 side-quest` from the repo root, in the background.)

```js
// Throwaway walkthrough of the brief's acceptance checks (as changed by the spec).
import puppeteer from 'puppeteer-core';
const BASE = 'http://localhost:5174/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = []; const check = (n, ok, x = '') => out.push(`${ok ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [], foreign = [];
p.on('pageerror', e => errors.push(e.message));
p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
p.on('request', r => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) foreign.push(r.url()); });
const txt = sel => p.$eval(sel, e => e.textContent);
const overflow = () => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const smallTaps = () => p.$$eval('button, a', els => els.filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.height < 48 || r.width < 48); }).map(e => e.id || e.textContent.trim()));

// 1 welcome → quest hidden
await p.goto(BASE + '?reset=1'); await sleep(300);
check('reset param removed from address bar', !p.url().includes('reset'));
check('welcome rules', /Get your quest\.[\s\S]*Complete it\.[\s\S]*get a prize/.test(await txt('main')));
check('no consent line', !/says no/.test(await txt('main')));
check('welcome: no sideways scroll', (await overflow()) <= 0);
check('welcome: tap targets >= 48px', (await smallTaps()).length === 0, (await smallTaps()).join(','));
await p.click('#get'); await sleep(200);
check('quest starts hidden', !!(await p.$('#reveal')) && !(await p.$('#qtext')));
const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('sidequest.v1')));
check('state stored', stored.status === 'assigned' && stored.swapsUsed === 0 && stored.completedAt === null);

// 2 reload keeps quest; reveal + auto-hide
await p.reload(); await sleep(300);
check('reload keeps same quest', (await p.evaluate(() => JSON.parse(localStorage.getItem('sidequest.v1')).missionId)) === stored.missionId);
check('reload starts hidden again', !!(await p.$('#reveal')));
await p.click('#reveal'); await sleep(1300);
const missionText = await p.evaluate(async id => (await import('./missions.js')).MISSIONS.find(m => m.id === id).text, stored.missionId);
check('revealed text is the mission (scramble settled)', (await txt('#qtext')) === missionText, await txt('#qtext'));
check('proof badge shown', /Proof:/.test(await txt('.badge')));
await p.click('#hide'); await sleep(150);
check('Hide button hides', !!(await p.$('#reveal')));
await p.click('#reveal'); await sleep(100); await p.click('#hide'); await sleep(100); await p.click('#reveal'); await sleep(200);
await sleep(10500);
check('auto-hides after 10s (no stacked timers)', !!(await p.$('#reveal')));
check('quest screen: no sideways scroll', (await overflow()) <= 0);

// 3 swap with confirmation, once
await p.click('#swap'); await sleep(150);
check('swap opens confirmation', !!(await p.$('#sheet')) && /one swap/.test(await txt('#sheet')));
await p.click('#no'); await sleep(150);
check('"Keep my quest" closes, nothing changes', !(await p.$('#sheet')) && (await p.evaluate(() => JSON.parse(localStorage.getItem('sidequest.v1')).swapsUsed)) === 0);
await p.click('#swap'); await sleep(150);
await p.evaluate(() => { const y = document.getElementById('yes'); y.click(); y.click(); });   // double tap
await sleep(200);
const afterSwap = await p.evaluate(() => JSON.parse(localStorage.getItem('sidequest.v1')));
check('swap gives a different quest, used once', afterSwap.missionId !== stored.missionId && afterSwap.swapsUsed === 1);
check('swap button gone', !(await p.$('#swap')));
await p.reload(); await sleep(300);
check('swap still gone after reload', !(await p.$('#swap')));

// 5 HTML-looking mission text renders as text (temporarily force mission 9: quotes and dashes)
await p.evaluate(() => localStorage.setItem('sidequest.v1', JSON.stringify({ missionId: 9, status: 'assigned', swapsUsed: 1, completedAt: null })));
await p.reload(); await sleep(300); await p.click('#reveal'); await sleep(1300);
check('mission 9 punctuation intact', (await txt('#qtext')).includes('— true or made up on the spot —'));

// 4 I did it → complete, reload stays
await p.click('#did'); await sleep(300);
check('complete screen', /Quest complete!/.test(await txt('.ach')) && /Go find a volunteer/.test(await txt('.ach')));
const done = await p.evaluate(() => JSON.parse(localStorage.getItem('sidequest.v1')));
const hhmm = await p.evaluate(iso => { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }, done.completedAt);
check('shows completion time HH:MM', (await txt('#ctime')) === hhmm, await txt('#ctime'));
check('shows the quest + proof again', (await txt('.qcard')).includes('true or made up') && /Proof:/.test(await txt('.qcard')));
check('no live clock (no seconds anywhere)', !/\d\d:\d\d:\d\d/.test(await txt('main')));
await p.reload(); await sleep(300);
check('reload stays on complete', !!(await p.$('.ach')));
check('complete: no sideways scroll', (await overflow()) <= 0);

// 5 reset
await p.goto(BASE + '?reset=1'); await sleep(300);
check('?reset=1 back to welcome', !!(await p.$('#get')));

// 6 localStorage blocked
const p2 = await b.newPage();
await p2.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });
const errs2 = []; p2.on('pageerror', e => errs2.push(e.message));
await p2.evaluateOnNewDocument(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
await p2.goto(BASE); await sleep(300);
await p2.click('#get'); await sleep(150); await p2.click('#reveal'); await sleep(1300); await p2.click('#did'); await sleep(200);
check('storage blocked: full flow works', !!(await p2.$('.ach')) && errs2.length === 0, errs2.join('|'));

// 7 no third-party requests, no JS errors
check('no requests to other origins', foreign.length === 0, foreign.join(','));
check('no JS errors', errors.length === 0, errors.join(' | '));
await b.close();
console.log(out.join('\n'));
console.log(`\n${out.filter(l => l.startsWith('PASS')).length}/${out.length} passed`);
```

- [ ] **Step 2: Run it to verify it fails**

Run (repo root): `npx --yes serve -l 5174 side-quest` (background), then `node <scratchpad>/e2e/sq-walk.mjs`
Expected: failures / exception (no `index.html` yet, `#get` not found).

- [ ] **Step 3: Create `side-quest/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Side Quest</title>
  <meta name="description" content="Get your side quest, complete it, show a volunteer, get a prize.">
  <meta name="theme-color" content="#07070b">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%2307070b'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' font-family='Arial' font-weight='900' fill='%23c6ff00'%3E%3F%3C/text%3E%3C/svg%3E">
  <style>
    :root {
      --bg: #07070b; --card: #14141c; --line: #2a2a40; --text: #ffffff; --muted: #b4b4c8;
      --lime: #c6ff00; --lime-dark: #6f8f00; --pink: #ff4fae; --cyan: #7ee8f2; --ink: #0a0a0a;
      --sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      --mono: ui-monospace, "SF Mono", Consolas, monospace;
      color-scheme: dark;
    }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 18px/1.45 var(--sans); overflow-x: hidden; }
    button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

    .screen { max-width: 480px; margin: 0 auto; min-height: 100vh; min-height: 100dvh; padding: 22px 18px calc(24px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; }
    .kick { font: 800 13px var(--mono); letter-spacing: .18em; color: var(--pink); margin: 0; }
    .title { font-size: 46px; font-weight: 900; line-height: .95; margin: 6px 0 22px; color: var(--lime); text-shadow: 0 0 18px rgba(198, 255, 0, .45); letter-spacing: -.01em; }
    .actions { margin-top: auto; padding-top: 18px; display: grid; gap: 12px; }

    .btn { display: block; width: 100%; min-height: 60px; border: 0; border-radius: 18px; background: var(--lime); color: var(--ink); font-size: 20px; font-weight: 900; letter-spacing: .02em; box-shadow: 0 6px 0 var(--lime-dark); }
    .btn:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--lime-dark); }
    .btn2 { display: block; width: 100%; min-height: 52px; border: 2px solid #3a3a52; border-radius: 16px; background: transparent; color: #e2e2ee; font-size: 17px; font-weight: 700; }
    .link { background: none; border: 0; padding: 0 4px; min-height: 48px; min-width: 48px; text-decoration: underline; font-weight: 700; color: var(--text); }

    .rules { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
    .rules li { display: flex; gap: 14px; align-items: center; font-size: 21px; font-weight: 700; line-height: 1.25; }
    .rules b { flex: none; width: 36px; height: 36px; border-radius: 10px; background: var(--lime); color: var(--ink); display: grid; place-items: center; font-size: 18px; }

    /* hidden quest tile */
    .cover { display: grid; place-items: center; width: 100%; min-height: 240px; border-radius: 20px; border: 2px dashed var(--lime); color: var(--lime); text-align: center; padding: 16px;
      background: repeating-linear-gradient(45deg, #101018 0 14px, #15151f 14px 28px); animation: pulse 1.8s infinite; }
    .cover span { display: block; font-size: 24px; font-weight: 900; }
    .cover small { display: block; margin-top: 8px; font-size: 16px; color: var(--muted); font-weight: 600; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(198, 255, 0, .45); } 50% { box-shadow: 0 0 0 12px rgba(198, 255, 0, 0); } }

    /* revealed quest + laser scan */
    .timer { display: flex; justify-content: flex-end; align-items: center; gap: 4px; font: 700 15px var(--mono); color: var(--muted); margin: -10px 0 2px; }
    .scanbox { position: relative; border-radius: 20px; overflow: hidden; }
    .qcard { background: var(--card); border: 2px solid var(--lime); border-radius: 20px; padding: 18px; }
    .qtext { font-size: 22px; font-weight: 800; line-height: 1.3; margin: 0 0 16px; overflow-wrap: anywhere; }
    .badge { display: inline-flex; gap: 8px; align-items: flex-start; background: var(--pink); color: var(--ink); font-weight: 800; font-size: 17px; line-height: 1.3; padding: 9px 14px; border-radius: 14px; }
    .scanbox .veil { position: absolute; inset: 0; border-radius: 20px; background: repeating-linear-gradient(45deg, #101018 0 14px, #15151f 14px 28px); animation: uncover .9s linear forwards; }
    .scanbox .laser { position: absolute; left: 0; right: 0; top: 0; height: 3px; background: var(--lime); box-shadow: 0 0 16px 5px rgba(198, 255, 0, .7); animation: laser .9s linear forwards; }
    @keyframes uncover { from { clip-path: inset(0 0 0 0); } to { clip-path: inset(100% 0 0 0); } }
    @keyframes laser { from { top: 0; opacity: 1; } 95% { opacity: 1; } to { top: 100%; opacity: 0; } }

    /* swap sheet */
    .dim { position: fixed; inset: 0; background: rgba(0, 0, 0, .75); display: flex; align-items: flex-end; justify-content: center; padding: 14px; z-index: 10; }
    .sheet { width: 100%; max-width: 460px; background: var(--card); border: 2px solid var(--lime); border-radius: 22px; padding: 20px; display: grid; gap: 12px; margin-bottom: env(safe-area-inset-bottom); }
    .sheet h2 { margin: 0; font-size: 26px; font-weight: 900; color: var(--lime); }
    .sheet p { margin: 0 0 4px; font-size: 18px; color: #e4e4ee; }

    /* quest complete: drifting cyan/green background + light sweeping the trophy card.
       Honest note: the motion makes a screenshot look obviously dead, which deters casual cheating,
       but a determined person can still fake it (screen recording, a second phone). The stakes are one prize. */
    body.done { background: linear-gradient(120deg, #05070b, #06323a, #183300, #05070b); background-size: 300% 300%; animation: drift 5s linear infinite alternate; }
    @keyframes drift { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
    .ach { position: relative; overflow: hidden; background: rgba(14, 18, 22, .9); border: 2px solid var(--lime); border-radius: 22px; padding: 24px 18px; text-align: center; box-shadow: 0 0 26px rgba(198, 255, 0, .35); }
    .ach::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .2), transparent); animation: shine 2.6s linear infinite; }
    @keyframes shine { from { transform: translateX(-140%) skewX(-20deg); } to { transform: translateX(300%) skewX(-20deg); } }
    .trophy { width: 76px; height: 76px; border-radius: 50%; background: var(--lime); display: grid; place-items: center; font-size: 40px; margin: 0 auto 10px; box-shadow: 0 0 22px rgba(198, 255, 0, .6); }
    .ach h1 { margin: 0 0 6px; font-size: 34px; font-weight: 900; line-height: 1.05; }
    .ach p { margin: 0; font-size: 20px; font-weight: 800; color: var(--lime); }
    .tlabel { font: 800 13px var(--mono); letter-spacing: .18em; color: var(--cyan); text-align: center; margin: 22px 0 0; }
    .ctime { font: 800 56px/1.1 var(--mono); text-align: center; margin: 0 0 18px; text-shadow: 0 0 14px rgba(126, 232, 242, .7); }
    .done .qtext { font-size: 19px; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation: none !important; transition: none !important; }
      .scanbox .veil, .scanbox .laser { display: none; }
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <noscript><p style="padding:24px">Please turn on JavaScript, or find a volunteer.</p></noscript>
  <script type="module">
    import { proofOf } from './missions.js';
    import * as Q from './quest.js';

    const REVEAL_SECONDS = 10;
    const SCAN_MS = 900;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const app = document.getElementById('app');
    const store = Q.safeStorage();

    if (new URLSearchParams(location.search).has('reset')) {
      Q.clear(store);
      history.replaceState(null, '', location.pathname);   // so a reload doesn't reset again
    }
    let state = Q.load(store);
    let timers = [];

    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const stopTimers = () => { timers.forEach(t => { clearInterval(t); clearTimeout(t); cancelAnimationFrame(t); }); timers = []; };
    const persist = () => Q.save(store, state);
    const badge = m => { const p = proofOf(m); return `<span class="badge"><span aria-hidden="true">${p.icon}</span>${esc(p.text)}</span>`; };

    function render() {
      stopTimers();
      document.body.classList.toggle('done', state?.status === 'completed');
      if (!state) return renderWelcome();
      if (state.status === 'completed') return renderDone();
      renderQuest();
    }

    function renderWelcome() {
      app.innerHTML = `<main class="screen">
        <p class="kick">ESN · SIDE QUEST</p>
        <h1 class="title">SIDE<br>QUEST</h1>
        <ol class="rules">
          <li><b>1</b>Get your quest.</li>
          <li><b>2</b>Complete it.</li>
          <li><b>3</b>Done? Find a volunteer, show them, get a prize 🎁</li>
        </ol>
        <div class="actions"><button class="btn" id="get">GET MY QUEST ▶</button></div>
      </main>`;
      document.getElementById('get').onclick = () => { state = Q.assign(); persist(); render(); };
    }

    function renderQuest() {
      app.innerHTML = `<main class="screen">
        <p class="kick">QUEST ACCEPTED</p>
        <h1 class="title">YOUR<br>QUEST</h1>
        <div id="slot"></div>
        <div class="actions">
          <button class="btn" id="did">I DID IT ▶</button>
          ${Q.canSwap(state) ? '<button class="btn2" id="swap">🔄 Swap quest (1 left)</button>' : ''}
        </div>
      </main>`;
      showCover();
      document.getElementById('did').onclick = () => { state = Q.complete(state); persist(); render(); };
      const swapBtn = document.getElementById('swap');
      if (swapBtn) swapBtn.onclick = openSwapSheet;
    }

    function showCover() {
      stopTimers();
      const slot = document.getElementById('slot');
      slot.innerHTML = `<button class="cover" id="reveal"><span>👆 TAP TO REVEAL</span><small>Hidden so people next to you can't read it</small></button>`;
      document.getElementById('reveal').onclick = reveal;
    }

    function reveal() {
      stopTimers();
      const m = Q.missionById(state.missionId);
      const slot = document.getElementById('slot');
      slot.innerHTML = `<div class="timer" aria-live="off">hides in <span id="left">${REVEAL_SECONDS}</span>s · <button class="link" id="hide">Hide</button></div>
        <div class="scanbox">
          <div class="qcard"><p class="sr-only">${esc(m.text)}</p><p class="qtext" id="qtext" aria-hidden="true"></p>${badge(m)}</div>
          ${reduced ? '' : '<div class="veil"></div><div class="laser"></div>'}
        </div>`;
      document.getElementById('hide').onclick = showCover;
      scramble(document.getElementById('qtext'), m.text);
      let left = REVEAL_SECONDS;
      timers.push(setInterval(() => {
        left -= 1;
        const el = document.getElementById('left');
        if (el) el.textContent = left;
        if (left <= 0) showCover();
      }, 1000));
    }

    // "Decrypt" effect: random characters settle into the real text, left to right.
    function scramble(el, text) {
      if (reduced) { el.textContent = text; return; }
      const glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*';
      const start = performance.now();
      const frame = now => {
        const p = Math.min(1, (now - start) / SCAN_MS);
        const fixed = Math.floor(p * text.length);
        el.textContent = text.slice(0, fixed) + [...text.slice(fixed)].map(ch => (ch === ' ' ? ' ' : glyphs[Math.floor(Math.random() * glyphs.length)])).join('');
        if (p < 1) timers.push(requestAnimationFrame(frame));
        else el.textContent = text;
      };
      timers.push(requestAnimationFrame(frame));
    }

    function openSwapSheet() {
      const dim = document.createElement('div');
      dim.className = 'dim';
      dim.id = 'sheet';
      dim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <h2 id="sheet-title">Swap your quest?</h2>
        <p>You only get <b>one swap</b> tonight. Your new quest is final, no going back.</p>
        <button class="btn" id="yes">YES, SWAP IT</button>
        <button class="btn2" id="no">Keep my quest</button>
      </div>`;
      document.body.appendChild(dim);
      const close = () => dim.remove();
      document.getElementById('no').onclick = close;
      dim.onclick = e => { if (e.target === dim) close(); };
      document.getElementById('yes').onclick = () => { state = Q.swap(state); persist(); close(); render(); };
    }

    function renderDone() {
      const m = Q.missionById(state.missionId);
      app.innerHTML = `<main class="screen">
        <div class="ach"><div class="trophy" aria-hidden="true">🏆</div><h1>Quest complete!</h1><p>Go find a volunteer.</p></div>
        <p class="tlabel">COMPLETED AT</p>
        <p class="ctime" id="ctime">${Q.formatTime(state.completedAt)}</p>
        <div class="qcard"><p class="qtext">${esc(m.text)}</p>${badge(m)}</div>
      </main>`;
    }

    render();
  </script>
</body>
</html>
```

- [ ] **Step 4: Run the walkthrough to verify it passes**

Run: `node <scratchpad>/e2e/sq-walk.mjs`
Expected: all checks PASS (about 35). Then take screenshots at 360 px of welcome / hidden / revealed (after 1.2 s) / sheet / complete and look at them against mockup v3. Fix visual issues and re-run until clean.

- [ ] **Step 5: Run unit tests (no regressions)**

Run: `node --test "tests/*.test.mjs"` (in `side-quest/`)
Expected: PASS.

- [ ] **Step 6: Commit and push**

```bash
git add side-quest/index.html
git commit -m "Side Quest: page with hidden quest, laser reveal, swap sheet and trophy screen"
git push origin main
```

---

### Task 4: Accessibility check, docs, deploy hand-off

**Files:**
- Create: `side-quest/README.md`
- Modify: `README.md` (root, Side Quest row)

- [ ] **Step 1: Lighthouse mobile accessibility**

Run (server from Task 3 still on 5174):
`npx --yes lighthouse http://localhost:5174/ --only-categories=accessibility --form-factor=mobile --screenEmulation.mobile --chrome-path="C:/Program Files/Google/Chrome/Application/chrome.exe" --chrome-flags="--headless=new" --output=json --output-path=<scratchpad>/lh.json --quiet`
then `node -e "const r=require('<scratchpad>/lh.json');console.log(r.categories.accessibility.score);for(const a of Object.values(r.audits))if(a.score===0)console.log('FAIL',a.id)"`
Expected: score ≥ 0.95 and no failing `color-contrast` or `target-size` audits. Lighthouse runs a fresh profile, so it only sees the welcome screen. The other screens use the same palette, so cover them by checking every text/background pair of the palette with this script (tap sizes on those screens are already checked by the walkthrough):

```js
// node -e: WCAG contrast of the palette pairs
const L = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
for (const [f, b] of [['#ffffff','#07070b'],['#ffffff','#14141c'],['#0a0a0a','#c6ff00'],['#0a0a0a','#ff4fae'],['#7ee8f2','#07070b'],['#b4b4c8','#14141c'],['#c6ff00','#07070b'],['#ff4fae','#07070b'],['#e2e2ee','#07070b']]) console.log(f, b, cr(f, b).toFixed(2));
```
Expected: every ratio ≥ 4.5.

- [ ] **Step 2: Write `side-quest/README.md`**

```markdown
# Side Quest 🎯

One-page party game for an ESN Bologna Erasmus night: scan the QR, get one random side quest,
complete it, show a volunteer, get a prize.

Live: https://esn-side-quest.vercel.app

- Brief from the organiser: [docs/brief.md](docs/brief.md)
- Design decisions (what changed from the brief): [docs/specs/2026-10-14-side-quest-design.md](docs/specs/2026-10-14-side-quest-design.md)

## Editing the quests

All 20 quests are in [`missions.js`](missions.js). Change the wording there, nothing else.
Proof types: `live`, `photo`, `video`, `phone`, `tell`; `proofNote` replaces the default "Proof: …" line.

## Run locally

    npx serve -l 5174 .

Open http://localhost:5174. Add `?reset=1` to the URL to start over on a phone.

## Tests

    node --test "tests/*.test.mjs"

## Deploy

Vercel project **esn-side-quest**, Root Directory `side-quest`, framework preset Other, no build command.
```

- [ ] **Step 3: Update root README row**

Change the side-quest row status from `In design` to `Live: https://esn-side-quest.vercel.app` (only after Step 5 confirms it is live; until then `Built, waiting for Vercel project`).

- [ ] **Step 4: Commit and push**

```bash
git add side-quest/README.md README.md
git commit -m "Side Quest: README, accessibility check"
git push origin main
```

- [ ] **Step 5: Vercel hand-off (Elia)**

Elia: Vercel → Add New → Project → import `fri3erg/ESN_Stuff` → **Project Name `esn-side-quest`**, Root Directory `side-quest`, preset Other → Deploy.
Then verify: `curl -s https://esn-side-quest.vercel.app | grep -o "<title>.*</title>"` → `<title>Side Quest</title>`; `/tests/quest.test.mjs` → 404; run `sq-walk.mjs` with `BASE` set to the live URL → all PASS. Update the root README row to Live and push.
