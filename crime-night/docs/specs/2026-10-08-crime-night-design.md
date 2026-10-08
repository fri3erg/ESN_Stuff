# ESN Crime Night: website design spec

Date: 2026-10-08 · Author: Elia (with Claude) · Status: awaiting review

## 1. Goal

A phone web app that **replaces the paper cards** for ESN Crime Night (ESN Bologna Tandem Night,
Cluricaune Irish Pub, ~400–500 Erasmus students). The printed paper only carries a QR code to the site.

The game's purpose is social: players must talk to strangers to collect clues. The site has to make that
easy and fun, load instantly on crowded pub mobile data, and need no backend.

**Success =** a player scans the QR, types their name, and within seconds has 4 private clues plus a reason
to go talk to people. They collect other clues by exchanging code words in person, and show a volunteer a
verdict screen to claim a prize.

### Non-goals
- No backend, accounts, database or answer submission. Answers are locked in **in person** with a volunteer.
- No answer checking: the site never says "correct". Volunteers hold the solutions.
- No anti-cheat beyond name normalisation. Source-code reading is accepted.
- No offline/service-worker support.

## 2. Game rules (as implemented)

- 4 cases, 9 suspects (Sissi, Roberta, Elia, Francesco, Mary, Vincenzo, Andrea, Davide, Leo).
- Each case has 5 clues **A–E**. Each clue clears 1–2 suspects. All 5 together leave the culprit(s).
- Cases 01–02: 1 culprit. Cases 03–04: 2 accomplices.
- Each player holds exactly 1 clue per case (4 total), assigned from their name.
- Content (case texts, clue texts, who each clue clears) comes from the PDF
  `ESN_Crime_Night_Cards_Color_400.pdf`. Verified: in every case the 5 clues leave exactly 1 or 2 suspects.

## 3. Architecture

Plain static site, **no build step**: HTML + CSS + vanilla JS (ES modules). All state lives in `localStorage`.
Deployed on Vercel as its own project with Root Directory `crime-night`, framework preset "Other",
no build command.

```
crime-night/
├── index.html          # shell: top bar, <main> view container, bottom tab nav, loader
├── styles.css          # B&W dossier theme, components, decorations
├── app.js              # boot, router (#hash), views, event handlers
├── lib/
│   ├── assign.js       # normaliseName(), hash, assignClues(name) -> {1:'B',2:'C',3:'D',4:'A'}
│   ├── codes.js        # normaliseCode(), lookupCode(code) -> {case, letter} | null
│   ├── state.js        # load/save localStorage, unlock(), toggleCross(), setVerdict(), reset()
│   └── i18n.js         # t(key), current language, language switching
├── data/
│   ├── cases.js        # 4 cases: title, crime text, culprit count, 5 clues {letter, clears[], code, text}
│   │                   # all texts in en/it/es
│   ├── suspects.js     # 9 suspects: name, photo path, caption (en/it/es)
│   └── ui.js           # interface strings en/it/es
├── img/suspects/       # <name>.jpg (placeholder silhouette SVG until real photos arrive)
├── tests/
│   └── check.mjs       # node script: data integrity + distribution simulation
├── vercel.json         # cache headers only
└── README.md
```

Each `lib/` module is pure, with no DOM access except `state.js`'s storage calls, so `tests/check.mjs` can
import it directly with Node.

## 4. Clue assignment

- `normaliseName(s)`: Unicode NFD, strip diacritics, lowercase, remove anything that is not a letter, digit
  or space, collapse whitespace, trim. `" Márco  "`, `"marco"` and `"MARCO!"` all become `marco`.
- For each case `n` ∈ 1..4: `letter = "ABCDE"[fnv1a32(normalised + "|" + n) % 5]`.
- Same normalised name gives the same clues, on any phone, at any time.
- Empty name after normalisation is rejected.
- `tests/check.mjs` simulates 500 realistic names and asserts every letter in every case gets
  between 14% and 26% of the players (expected 20%).

## 5. Code words

Each clue has one **language-independent** code word taken from its alibi. Holders read them aloud,
so they are the same in EN/IT/ES. Codes are matched after `normaliseCode()`: lowercase, strip accents,
spaces and punctuation (`"Hello Kitty"` = `hellokitty`).

| Case | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| 01 Alcohol Heist | GOSSIP | KARAOKE | JENGA | SLIPPERS | ZALANDO |
| 02 Freestyle Takeover | LIVESTREAM | SUPPLIES | ROUTER | FANTACALCIO | HELLO KITTY |
| 03 VP is Missing | FOCACCIA | SHOTS | RUNNING | TRAIN | KEBAB |
| 04 Money Heist | DETECTIVE | BARS | NIGHT BUS | TRANSFER | PIZZA |

All 20 are unique after normalisation (checked by the test script).

**Entering a code:** there is a code field on the Cases list and on each case page. Any valid code is accepted
anywhere and unlocks its own case. If entered on a different case's page, the toast says
"Unlocked clue B in Case 03". An invalid code shakes the field: "No such evidence. Ask again!"
An already-known code says "You already have this one".

**Effect of unlocking:** the clue's full alibi text appears in that case file, its A–E box is ticked, and the
suspects it clears are **auto-crossed** with a red "CLEARED" stamp. Players can still tap any mugshot to
cross or uncross it manually. Manual marks are stored separately from auto-clears, so unticking never
"un-clears" an evidence-based suspect.

## 6. Screens

**Top bar** (all screens): `ESN BOLOGNA // FILE 0413` on the left, language switcher `EN ▾` (EN/IT/ES) on the right.

**Bottom nav: filing-cabinet index tabs**: `01 CLUES · 02 CASES · 03 SUSPECTS · 04 RULES`.
The active tab is raised and paper-coloured, with a crooked red marker underline.

1. **Loader** (~1.5 s, tap to skip, skipped under `prefers-reduced-motion`): a typewriter types
   "OPENING CASE FILE…", then a red TOP SECRET stamp slams down.
2. **Identify** (first visit / after reset): "Identify yourself, Detective": name field,
   language buttons, "Open my file" button. Small print explaining that the name decides your clues.
3. **01 Clues**: yellow folder with paperclip and TOP SECRET stamp, "Detective: MARCO". Four clue slips,
   each with case title, letter badge, "CLEARED: …" in red, the alibi text, and the **code word** in a
   highlighted box ("Your code: KARAOKE — read it to other detectives"). Footer: "not you? reset"
   (with a confirmation step; reset wipes progress).
4. **02 Cases (list)**: 4 file folders showing title, culprit count, `3/5 evidence`, and an
   UNSOLVED / ACCUSED stamp. Code-entry field at the top.
5. **Case page**: crime text; **Evidence** row A–E (unlocked = filled black, your own = red outline;
   tapping an unlocked letter shows its alibi); unlocked alibis listed below; **Suspects** 3×3 mugshot grid
   (tap to cross); code-entry field; **MAKE ACCUSATION** button.
6. **Accusation → Verdict**: pick exactly 1 (cases 01–02) or 2 (cases 03–04) suspects, then confirm. The verdict
   is a full-screen stamped card with case title, accused names + photos, detective name,
   **"Evidence collected: n/5"** stamp and time. "Show this to an ESN volunteer to claim your prize."
   The verdict can be reopened from the case and changed (the in-person check is what counts).
7. **03 Suspects**: 9 black-and-white polaroid mugshots with a one-line caption each.
8. **04 Rules**: how to play (from the card back, rewritten for the code-word mechanic), "The crime is an
   excuse, the real mission is meeting new people", "Can't use your phone? Find an ESN volunteer",
   "All fiction!", and credit: **"Website by Elia"**.

## 7. Visual design

- **Black-and-white film-noir dossier.** Near-black background with film grain. Black ink, typewriter type
  (Special Elite for headings, Courier Prime for body).
- **Folders/clipboard are light yellow** (pale manila). Everything else is greyscale. Suspect photos are shown
  greyscale (CSS `filter: grayscale(1)`).
- **Red (#b3261e) is the only accent**: stamps, "CLEARED", active-tab marker, accuse button.
- Decorations: paperclips, stamps, coffee rings, fingerprint smudges, occasional redaction bars. All CSS/inline
  SVG, no image downloads beyond suspect photos and the 2 Google Fonts.
- Mobile-first: designed at 360–430 px wide, works up to desktop (content column max ~480 px, centred).
  Minimum tap target 44 px; body text ≥ 15 px on the real site (mockups were scaled down).

## 8. i18n

- Languages: **en** (default), **it**, **es**. Initial language comes from `navigator.language`, and can be
  switched at any time; the choice is saved.
- Translated: all UI strings, case titles, crime texts, alibi texts, rules, captions.
- Not translated: suspect names, code words, place names (Le Mercanzie, Ostello Bello).
- Missing translation falls back to English.

## 9. State (localStorage key `crimenight.v1`)

```js
{
  name: "Marco", lang: "en",
  unlocked: { 1: ["B","A"], 2: ["C"], 3: ["D"], 4: ["A"] },   // own clues pre-unlocked
  manual:   { 1: ["Elia"], ... },                            // manual cross-offs
  verdict:  { 1: { accused: ["Vincenzo"], at: 1791480000000 }, ... }
}
```

Corrupt or unreadable storage resets to the Identify screen without crashing. Storage access is wrapped in
try/catch, so private mode still works for the session.

## 10. Error handling

- Name empty after normalisation → inline error.
- Invalid code → shake + message, no penalty, no limit.
- Missing suspect photo → silhouette fallback via `onerror`.
- Unknown `#hash` route → Clues (or Identify if there's no name).

## 11. Testing

- `node crime-night/tests/check.mjs`:
  1. every case has letters A–E exactly once, and each clue has en/it/es text and a code;
  2. all 20 normalised codes are unique;
  3. eliminating all `clears` leaves exactly 1 suspect for cases 01–02 and 2 for 03–04;
  4. distribution simulation (500 names) within 14–26% per letter per case;
  5. `normaliseName` and `normaliseCode` examples.
- Manual: run locally (`npx serve crime-night`), check at 375 px width in browser devtools: identify →
  unlock a code → auto-cross → accuse → verdict; switch language on each screen; reload to keep state.

**Change 2026-10-08:** the optional team-name field was removed (Identify, Clues, Verdict, state).
Players can still play together informally; prizes are per person.

## 12. Open items (non-blocking)

- **Case 04:** the original brief wants players to distinguish the thief from the camera hacker, but no clue
  allows it. Proposal: ignore it (accuse the pair). Ask the organiser.
- Suspect photos (9) + optional Aitor "MISSING" photo for Case 03. One-line captions per suspect.
- Event date/time to show on the Identify screen.
- The QR code on the paper points to the Vercel URL (generate once the domain is known).
