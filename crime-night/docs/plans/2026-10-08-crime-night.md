# ESN Crime Night Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, phone-first web app that replaces the paper cards for ESN Crime Night: name → 4 private clues, code-word exchange to unlock others' clues, per-case notebook and accusation, verdict card for volunteers. EN/IT/ES.

**Architecture:** Plain static site, no build step. `index.html` shell + `styles.css` + `app.js` (hash router, views as template strings, event delegation). Pure ES modules under `lib/` (assignment hash, code lookup, state, i18n) and `data/` (cases, suspects, UI strings) are unit-tested with Node's built-in test runner. State lives in `localStorage`. Deployed by Vercel (Root Directory `crime-night`) on push to `main`.

**Tech Stack:** HTML, CSS, vanilla JS (ES modules), Google Fonts (Special Elite, Courier Prime), Node 22 `node --test` for tests. No dependencies.

**Spec:** [crime-night/docs/specs/2026-10-08-crime-night-design.md](../specs/2026-10-08-crime-night-design.md)

## Global Constraints

- No backend, no npm dependencies, no build step. Everything under `crime-night/` is served as-is.
- Solutions must not appear as explicit data or test assertions (tests assert culprit *counts*, never names).
- Languages: `en` (default), `it`, `es`. Missing translation falls back to English. Suspect names, code words and place names are never translated.
- Code words (language-independent): Case 01 `GOSSIP KARAOKE JENGA SLIPPERS ZALANDO`; Case 02 `LIVESTREAM SUPPLIES ROUTER FANTACALCIO HELLO KITTY`; Case 03 `FOCACCIA SHOTS RUNNING TRAIN KEBAB`; Case 04 `DETECTIVE BARS NIGHT BUS TRANSFER PIZZA` (letters A–E in that order).
- Clue assignment: `letter = "ABCDE"[hash32(normalisedName + "|" + caseId) % 5]` (FNV-1a + murmur3 fmix32).
- localStorage key `crimenight.v1`. Language before identity: `crimenight.lang`.
- Colours: background `#0d0d0d`, ink `#141414`, folder paper `#f3e7b3` (light yellow), red `#b3261e` is the only accent. Photos greyscale.
- Fonts: Special Elite (headings), Courier Prime (body). Body text ≥ 15px, tap targets ≥ 44px, layout column max 480px, must work at 360px wide.
- Bottom nav: filing-cabinet index tabs `01 CLUES · 02 CASES · 03 SUSPECTS · 04 RULES`; active tab raised, paper-coloured, with crooked red marker underline.
- Credit "Website by Elia" visible on Identify and Rules screens.
- Commit after each task; **do not push** without asking the user (push = live deploy).

**Deviation from spec, by design:** the spec listed a `vercel.json` with cache headers. Vercel's default static caching (`max-age=0, must-revalidate` + CDN) is already right, so it's dropped (YAGNI). A `.vercelignore` is added instead so `tests/` and `docs/` are not served. The loader plays once per browser session instead of on every load, so reloading mid-game is quick.

## Review Focus

1. **Non-Latin names** (Greek, Cyrillic, Arabic, e.g. `Δημήτρης`, `Мария`) must not be rejected as empty and must get clues. Test in Task 2.
2. **Sloppy code entry** (`night bus`, `Kebabs`, `hello-kitty`, ` pizza `, `FANTACÁLCIO`) must still match; the bare letter `s` or an empty field must not. Test in Task 3.
3. **Corrupt / old / unavailable storage** (garbage JSON, missing fields, private mode throwing) must fall back to the Identify screen, not crash; a stored state missing the player's own clue gets it re-added. Test in Task 4.
4. **Teams form mid-night**: team name must stay editable after identification and appear on the verdict. Manual check in Task 7.
5. **User-typed HTML** in name/team (`<img src=x onerror=alert(1)>`) must render as text everywhere (clues, verdict). Manual check in Task 7.

---

## File map

```
crime-night/
├── index.html                  # Task 6 (replaces placeholder)
├── styles.css                  # Task 6
├── app.js                      # Task 7
├── package.json                # Task 1 (type: module, test script; ignored by Vercel)
├── .vercelignore               # Task 1
├── lib/assign.js               # Task 2
├── lib/codes.js                # Task 3
├── lib/state.js                # Task 4
├── lib/i18n.js                 # Task 5
├── data/cases.js               # Task 1
├── data/suspects.js            # Task 1
├── data/ui.js                  # Task 5
├── img/suspects/placeholder.svg# Task 6
├── tests/data.test.mjs         # Task 1
├── tests/assign.test.mjs       # Task 2
├── tests/codes.test.mjs        # Task 3
├── tests/state.test.mjs        # Task 4
├── tests/i18n.test.mjs         # Task 5
└── README.md                   # Task 8
```

All commands below run from `D:/git/ESN_Stuff/crime-night` unless stated.

---

### Task 1: Game data + integrity tests

**Files:**
- Create: `crime-night/package.json`, `crime-night/.vercelignore`
- Create: `crime-night/data/cases.js`, `crime-night/data/suspects.js`
- Test: `crime-night/tests/data.test.mjs`

**Interfaces:**
- Produces: `CASES: Array<{ id: 1|2|3|4, culprits: 1|2, title: L, short: L, crime: L, clues: Array<{ letter: 'A'..'E', clears: string[], code: string, text: L }> }>` where `L = { en: string, it: string, es: string }`.
- Produces: `SUSPECTS: Array<{ name: string, photo: string|null, caption: L }>` (9 entries, order = display order).

- [ ] **Step 1: Create `package.json` and `.vercelignore`**

`crime-night/package.json`:
```json
{
  "name": "esn-crime-night",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

`crime-night/.vercelignore`:
```
tests
docs
package.json
README.md
```

- [ ] **Step 2: Write the failing data test**

`crime-night/tests/data.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../data/cases.js';
import { SUSPECTS } from '../data/suspects.js';

const LANGS = ['en', 'it', 'es'];
const names = SUSPECTS.map(s => s.name);

function assertTranslated(obj, where) {
  for (const l of LANGS) assert.ok(typeof obj?.[l] === 'string' && obj[l].trim(), `${where} missing ${l}`);
}

test('9 unique suspects with captions in all languages', () => {
  assert.equal(SUSPECTS.length, 9);
  assert.equal(new Set(names).size, 9);
  for (const s of SUSPECTS) assertTranslated(s.caption, `caption ${s.name}`);
});

test('4 cases with ids 1..4 and culprit counts 1,1,2,2', () => {
  assert.deepEqual(CASES.map(c => c.id), [1, 2, 3, 4]);
  assert.deepEqual(CASES.map(c => c.culprits), [1, 1, 2, 2]);
});

test('every case is fully translated and has clues A–E exactly once', () => {
  for (const c of CASES) {
    assertTranslated(c.title, `case ${c.id} title`);
    assertTranslated(c.short, `case ${c.id} short`);
    assertTranslated(c.crime, `case ${c.id} crime`);
    assert.deepEqual(c.clues.map(x => x.letter), ['A', 'B', 'C', 'D', 'E']);
    for (const clue of c.clues) {
      assertTranslated(clue.text, `case ${c.id} clue ${clue.letter}`);
      assert.ok(clue.code.trim(), `case ${c.id} clue ${clue.letter} code`);
      assert.ok(clue.clears.length >= 1 && clue.clears.length <= 2);
      for (const n of clue.clears) assert.ok(names.includes(n), `unknown suspect ${n}`);
    }
  }
});

test('collecting all 5 clues leaves exactly the culprit count', () => {
  for (const c of CASES) {
    const cleared = new Set(c.clues.flatMap(x => x.clears));
    const left = names.filter(n => !cleared.has(n));
    assert.equal(left.length, c.culprits, `case ${c.id}`);
  }
});

test('no single clue is redundant (each clears someone no other clue clears)', () => {
  for (const c of CASES) {
    for (const clue of c.clues) {
      const others = new Set(c.clues.filter(x => x !== clue).flatMap(x => x.clears));
      assert.ok(clue.clears.some(n => !others.has(n)), `case ${c.id} clue ${clue.letter} is redundant`);
    }
  }
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node --test tests/data.test.mjs`
Expected: FAIL with `Cannot find module '.../data/cases.js'`.

- [ ] **Step 4: Create `data/suspects.js`**

```js
// The 9 suspects, same for every case. To add a photo: put the file in img/suspects/
// (e.g. img/suspects/sissi.jpg, square-ish) and set `photo` to that path.
export const SUSPECTS = [
  { name: 'Sissi', photo: null, caption: {
    en: 'Gossip expert. Organised this whole mess.',
    it: 'Esperta di gossip. Ha organizzato tutto questo caos.',
    es: 'Experta en cotilleos. Organizó todo este lío.' } },
  { name: 'Roberta', photo: null, caption: {
    en: "Sissi's partner in (fake) crime.",
    it: 'Complice (per finta) di Sissi.',
    es: 'Cómplice (de mentira) de Sissi.' } },
  { name: 'Elia', photo: null, caption: {
    en: 'Built this website. Restarts routers for fun.',
    it: 'Ha fatto questo sito. Riavvia router per divertimento.',
    es: 'Hizo esta web. Reinicia routers por diversión.' } },
  { name: 'Francesco', photo: null, caption: {
    en: 'Runs too fast. Picks fantacalcio players too badly.',
    it: 'Corre troppo veloce. Sceglie i giocatori del fantacalcio troppo male.',
    es: 'Corre demasiado rápido. Elige fatal en el fantacalcio.' } },
  { name: 'Mary', photo: null, caption: {
    en: 'Professional negotiator. Zero deals closed.',
    it: 'Negoziatrice professionista. Zero accordi chiusi.',
    es: 'Negociadora profesional. Cero acuerdos cerrados.' } },
  { name: 'Vincenzo', photo: null, caption: {
    en: 'Plans aperitivi in litres of Spritz.',
    it: 'Pianifica aperitivi a litri di Spritz.',
    es: 'Planifica aperitivos en litros de Spritz.' } },
  { name: 'Andrea', photo: null, caption: {
    en: 'Owns more elegant jackets than you.',
    it: 'Ha più giacche eleganti di te.',
    es: 'Tiene más chaquetas elegantes que tú.' } },
  { name: 'Davide', photo: null, caption: {
    en: 'Claims to have the best bars in Bologna.',
    it: 'Dice di avere le barre migliori di Bologna.',
    es: 'Dice tener las mejores barras de Bolonia.' } },
  { name: 'Leo', photo: null, caption: {
    en: 'Kebab shop regular. Karaoke menace.',
    it: 'Habitué del kebabbaro. Minaccia del karaoke.',
    es: 'Cliente fijo del kebab. Amenaza del karaoke.' } },
];
```

- [ ] **Step 5: Create `data/cases.js`**

```js
// The 4 cases. English texts come from the printed cards (ESN_Crime_Night_Cards_Color_400.pdf).
// `clears` = suspects this clue gives an alibi to. `code` = word players read to each other.
export const CASES = [
  {
    id: 1, culprits: 1,
    title: { en: 'The Great Alcohol Heist', it: "Il Grande Furto dell'Alcol", es: 'El Gran Robo del Alcohol' },
    short: { en: 'Alcohol Heist', it: "Furto dell'Alcol", es: 'Robo del Alcohol' },
    crime: {
      en: 'At 01:00, the entire alcohol supply for the next ESN trip mysteriously vanished. The fridge was completely empty. The only thing left behind was a receipt on the table. Whoever did this knew exactly where the alcohol was stored. Clearly, an inside job. And someone is about to have a VERY good weekend.',
      it: "All'01:00 l'intera scorta di alcol per il prossimo viaggio ESN è misteriosamente sparita. Il frigo era completamente vuoto. L'unica cosa rimasta era uno scontrino sul tavolo. Chiunque sia stato sapeva esattamente dove fosse l'alcol. Chiaramente un lavoro dall'interno. E qualcuno sta per passare un weekend MOLTO piacevole.",
      es: 'A la 01:00, toda la reserva de alcohol para el próximo viaje de ESN desapareció misteriosamente. La nevera estaba completamente vacía. Lo único que quedó fue un ticket sobre la mesa. Quien lo hizo sabía exactamente dónde estaba guardado el alcohol. Claramente, un trabajo desde dentro. Y alguien está a punto de tener un fin de semana MUY bueno.',
    },
    clues: [
      { letter: 'A', clears: ['Sissi', 'Roberta'], code: 'GOSSIP', text: {
        en: 'Sissi and Roberta were spotted at a table in the Irish Pub, sipping beers and exchanging some VERY juicy gossip. Apparently, the tea was hotter than the beer was cold.',
        it: "Sissi e Roberta sono state viste a un tavolo dell'Irish Pub, a sorseggiare birra e scambiarsi gossip MOLTO succosi. A quanto pare, i pettegolezzi scottavano più di quanto fosse fredda la birra.",
        es: 'Sissi y Roberta fueron vistas en una mesa del Irish Pub, bebiendo cerveza e intercambiando cotilleos MUY jugosos. Al parecer, el salseo estaba más caliente que fría la cerveza.' } },
      { letter: 'B', clears: ['Davide', 'Leo'], code: 'KARAOKE', text: {
        en: 'Security cameras at Le Mercanzie show Davide and Leo arguing over karaoke lyrics at 01:00.',
        it: "Le telecamere di Le Mercanzie mostrano Davide e Leo che litigano sul testo di una canzone al karaoke all'01:00.",
        es: 'Las cámaras de seguridad de Le Mercanzie muestran a Davide y Leo discutiendo por la letra de una canción de karaoke a la 01:00.' } },
      { letter: 'C', clears: ['Elia', 'Mary'], code: 'JENGA', text: {
        en: 'Elia and Mary were playing Jenga at Ostello Bello at 01:00. Someone knocked over the tower, and they spent the next 30 minutes blaming each other. Five witnesses confirm they never left the table.',
        it: "Elia e Mary stavano giocando a Jenga all'Ostello Bello all'01:00. Qualcuno ha fatto crollare la torre e hanno passato i 30 minuti successivi a darsi la colpa a vicenda. Cinque testimoni confermano che non si sono mai alzati dal tavolo.",
        es: 'Elia y Mary estaban jugando al Jenga en el Ostello Bello a la 01:00. Alguien tiró la torre y pasaron los siguientes 30 minutos echándose la culpa. Cinco testigos confirman que nunca se levantaron de la mesa.' } },
      { letter: 'D', clears: ['Francesco'], code: 'SLIPPERS', text: {
        en: 'Francesco was locked outside his apartment wearing slippers at 01:00. His doorbell camera recorded the whole tragedy.',
        it: "All'01:00 Francesco era chiuso fuori casa in ciabatte. La telecamera del citofono ha registrato tutta la tragedia.",
        es: 'A la 01:00, Francesco se había quedado encerrado fuera de su piso en zapatillas. La cámara del timbre grabó toda la tragedia.' } },
      { letter: 'E', clears: ['Andrea'], code: 'ZALANDO', text: {
        en: 'Andrea was spotted at Le Mercanzie, scrolling through Zalando all night in search of yet another elegant jacket. Meanwhile, “Sarà perché ti amo” was being sung for the 47th time that evening.',
        it: "Andrea è stato visto a Le Mercanzie, a scorrere Zalando tutta la notte alla ricerca dell'ennesima giacca elegante. Nel frattempo, “Sarà perché ti amo” veniva cantata per la 47ª volta quella sera.",
        es: 'Andrea fue visto en Le Mercanzie, mirando Zalando toda la noche en busca de otra chaqueta elegante más. Mientras tanto, “Sarà perché ti amo” sonaba por 47ª vez esa noche.' } },
    ],
  },
  {
    id: 2, culprits: 1,
    title: { en: 'The Freestyle Takeover', it: 'Il Colpo Freestyle', es: 'El Asalto Freestyle' },
    short: { en: 'Freestyle Takeover', it: 'Colpo Freestyle', es: 'Asalto Freestyle' },
    crime: {
      en: "At 23:00, in the middle of the party, someone secretly took control of the DJ's laptop and replaced the entire playlist with freestyle rap beats. Within minutes, the dance floor had turned into an unauthorized rap battle. Confused Erasmus students were desperately trying to rhyme in languages they barely spoke.",
      it: 'Alle 23:00, nel pieno della festa, qualcuno ha preso segretamente il controllo del laptop del DJ e ha sostituito l’intera playlist con basi rap freestyle. In pochi minuti la pista da ballo si è trasformata in una battaglia rap non autorizzata. Studenti Erasmus confusi cercavano disperatamente di fare rime in lingue che parlavano a malapena.',
      es: 'A las 23:00, en plena fiesta, alguien tomó en secreto el control del portátil del DJ y sustituyó toda la playlist por bases de rap freestyle. En pocos minutos, la pista de baile se convirtió en una batalla de rap no autorizada. Estudiantes Erasmus confundidos intentaban rimar desesperadamente en idiomas que apenas hablaban.',
    },
    clues: [
      { letter: 'A', clears: ['Sissi', 'Roberta'], code: 'LIVESTREAM', text: {
        en: 'Sissi and Roberta were in the office counting ESN welcome bags on a livestream at 23:00. They lost count at least seven times.',
        it: 'Alle 23:00 Sissi e Roberta erano in ufficio a contare le welcome bag ESN in diretta streaming. Hanno perso il conto almeno sette volte.',
        es: 'A las 23:00, Sissi y Roberta estaban en la oficina contando las welcome bags de ESN en un directo. Perdieron la cuenta al menos siete veces.' } },
      { letter: 'B', clears: ['Vincenzo', 'Andrea'], code: 'SUPPLIES', text: {
        en: 'Vincenzo and Andrea were unloading supplies for the next ESN trip at 23:00. Security cameras confirm it.',
        it: 'Alle 23:00 Vincenzo e Andrea stavano scaricando le provviste per il prossimo viaggio ESN. Le telecamere lo confermano.',
        es: 'A las 23:00, Vincenzo y Andrea estaban descargando provisiones para el próximo viaje de ESN. Las cámaras de seguridad lo confirman.' } },
      { letter: 'C', clears: ['Elia', 'Mary'], code: 'ROUTER', text: {
        en: 'Elia and Mary were at Ostello Bello trying to fix the Wi-Fi at 23:00. The receptionist watched them restart the router twelve times.',
        it: "Alle 23:00 Elia e Mary erano all'Ostello Bello a cercare di sistemare il Wi-Fi. Il receptionist li ha visti riavviare il router dodici volte.",
        es: 'A las 23:00, Elia y Mary estaban en el Ostello Bello intentando arreglar el Wi-Fi. El recepcionista los vio reiniciar el router doce veces.' } },
      { letter: 'D', clears: ['Francesco'], code: 'FANTACALCIO', text: {
        en: 'Francesco was on a recorded fantacalcio call at 23:00, desperately defending his terrible player choices.',
        it: 'Alle 23:00 Francesco era in una call registrata del fantacalcio, a difendere disperatamente le sue pessime scelte di formazione.',
        es: 'A las 23:00, Francesco estaba en una videollamada grabada de fantacalcio, defendiendo desesperadamente sus pésimas elecciones de jugadores.' } },
      { letter: 'E', clears: ['Leo'], code: 'HELLO KITTY', text: {
        en: 'At 11 PM, Leo was spotted at Le Mercanzie giving a very passionate performance of “Hello Kitty” at karaoke. Unfortunately for everyone, there is video evidence.',
        it: 'Alle 23:00 Leo è stato visto a Le Mercanzie mentre si esibiva con grande passione in “Hello Kitty” al karaoke. Purtroppo per tutti, esiste un video.',
        es: 'A las 23:00, Leo fue visto en Le Mercanzie haciendo una interpretación muy apasionada de “Hello Kitty” en el karaoke. Por desgracia para todos, hay pruebas en vídeo.' } },
    ],
  },
  {
    id: 3, culprits: 2,
    title: { en: 'The Vice President Is Missing', it: 'Il Vicepresidente È Scomparso', es: 'El Vicepresidente Ha Desaparecido' },
    short: { en: 'VP Is Missing', it: 'VP Scomparso', es: 'VP Desaparecido' },
    crime: {
      en: 'The ESN Vice President, Aitor, mysteriously vanished for 48 hours. He was last seen at the ESN office at around 20:30, shortly before his mysterious disappearance. TWO kidnappers. ONE hostage. ONE ransom demand. Unfortunately, nobody seems willing to pay. At this point, the kidnappers are starting to wonder if ESN even wants him back.',
      it: "Il Vicepresidente di ESN, Aitor, è misteriosamente sparito per 48 ore. È stato visto l'ultima volta nell'ufficio ESN verso le 20:30, poco prima della sua misteriosa scomparsa. DUE rapitori. UN ostaggio. UNA richiesta di riscatto. Purtroppo nessuno sembra disposto a pagare. A questo punto, i rapitori iniziano a chiedersi se ESN lo rivoglia davvero indietro.",
      es: 'El Vicepresidente de ESN, Aitor, desapareció misteriosamente durante 48 horas. Fue visto por última vez en la oficina de ESN hacia las 20:30, poco antes de su misteriosa desaparición. DOS secuestradores. UN rehén. UNA petición de rescate. Por desgracia, nadie parece dispuesto a pagar. A estas alturas, los secuestradores empiezan a preguntarse si ESN lo quiere de vuelta.',
    },
    clues: [
      { letter: 'A', clears: ['Davide', 'Vincenzo'], code: 'FOCACCIA', text: {
        en: 'At 20:30, Davide and Vincenzo were with Christian, planning the grocery list for the aperitivo on the next ESN trip. After two hours of intense negotiations, they had agreed on enough focaccia to feed the entire Erasmus population and approximately 300 liters of Spritz.',
        it: "Alle 20:30 Davide e Vincenzo erano con Christian a pianificare la lista della spesa per l'aperitivo del prossimo viaggio ESN. Dopo due ore di intense trattative, si erano accordati su abbastanza focaccia da sfamare l'intera popolazione Erasmus e circa 300 litri di Spritz.",
        es: 'A las 20:30, Davide y Vincenzo estaban con Christian planeando la lista de la compra para el aperitivo del próximo viaje de ESN. Tras dos horas de intensas negociaciones, acordaron suficiente focaccia para alimentar a toda la población Erasmus y unos 300 litros de Spritz.' } },
      { letter: 'B', clears: ['Elia', 'Mary'], code: 'SHOTS', text: {
        en: 'At 20:30, Elia and Mary were going from bar to bar, trying to convince local businesses to become ESN partners. After three hours of negotiations, they had secured zero partnerships, five free shots, and a promise from a bartender to “think about it.” Apparently, getting a discount for Erasmus students is harder than negotiating a hostage release.',
        it: 'Alle 20:30 Elia e Mary giravano di bar in bar per convincere i locali a diventare partner ESN. Dopo tre ore di trattative avevano ottenuto zero partnership, cinque shot gratis e la promessa di un barista di “pensarci”. A quanto pare, ottenere uno sconto per gli Erasmus è più difficile che negoziare il rilascio di un ostaggio.',
        es: 'A las 20:30, Elia y Mary iban de bar en bar intentando convencer a los locales de hacerse partners de ESN. Tras tres horas de negociaciones, habían conseguido cero acuerdos, cinco chupitos gratis y la promesa de un camarero de “pensárselo”. Al parecer, conseguir un descuento para Erasmus es más difícil que negociar la liberación de un rehén.' } },
      { letter: 'C', clears: ['Francesco'], code: 'RUNNING', text: {
        en: 'Francesco was testing the new route for the ESN Running Club at 20:30. His fitness tracker confirms he was running, and three exhausted Erasmus students who tried to keep up with him can confirm it.',
        it: "Alle 20:30 Francesco stava testando il nuovo percorso dell'ESN Running Club. Il suo fitness tracker conferma che stava correndo, e possono confermarlo anche tre Erasmus distrutti che hanno provato a stargli dietro.",
        es: 'A las 20:30, Francesco estaba probando la nueva ruta del ESN Running Club. Su pulsera de actividad confirma que estaba corriendo, y tres estudiantes Erasmus agotados que intentaron seguirle el ritmo pueden confirmarlo.' } },
      { letter: 'D', clears: ['Andrea'], code: 'TRAIN', text: {
        en: 'Andrea was picking up newly arrived Erasmus students at the train station at 20:30. Train station security cameras confirm it.',
        it: 'Alle 20:30 Andrea stava accogliendo in stazione gli Erasmus appena arrivati. Le telecamere della stazione lo confermano.',
        es: 'A las 20:30, Andrea estaba recogiendo en la estación de tren a estudiantes Erasmus recién llegados. Las cámaras de la estación lo confirman.' } },
      { letter: 'E', clears: ['Leo'], code: 'KEBAB', text: {
        en: "Leo was ordering eight kebabs at 20:30. The kebab shop's security cameras confirm he never left.",
        it: "Alle 20:30 Leo stava ordinando otto kebab. Le telecamere del kebabbaro confermano che non se n'è mai andato.",
        es: 'A las 20:30, Leo estaba pidiendo ocho kebabs. Las cámaras del local de kebab confirman que nunca se fue.' } },
    ],
  },
  {
    id: 4, culprits: 2,
    title: { en: 'The ESN Money Heist', it: 'La Casa di Carta ESN', es: 'La Casa de Papel de ESN' },
    short: { en: 'Money Heist', it: 'Casa di Carta', es: 'Casa de Papel' },
    crime: {
      en: "At exactly 00:13, someone broke into the ESN office and stole the association's money. But this was no ordinary robbery. The security cameras had been deliberately disabled, leaving absolutely no footage of the crime. One person knew how to hack the system. The other knew where the money was kept.",
      it: "Alle 00:13 in punto qualcuno si è introdotto nell'ufficio ESN e ha rubato i soldi dell'associazione. Ma non è stata una rapina qualunque. Le telecamere erano state disattivate di proposito, senza lasciare alcuna ripresa del crimine. Uno sapeva come hackerare il sistema. L'altro sapeva dove erano custoditi i soldi.",
      es: 'A las 00:13 en punto, alguien entró en la oficina de ESN y robó el dinero de la asociación. Pero no fue un robo cualquiera. Las cámaras de seguridad habían sido desactivadas a propósito, sin dejar ninguna grabación del crimen. Uno sabía cómo hackear el sistema. El otro sabía dónde se guardaba el dinero.',
    },
    clues: [
      { letter: 'A', clears: ['Sissi', 'Roberta'], code: 'DETECTIVE', text: {
        en: 'At 00:13, Sissi and Roberta were busy organizing the detective game for this Tandem Night. Witnesses confirm they spent hours inventing ridiculous crimes and suspicious alibis involving other ESN volunteers. Apparently, organizing a fake crime takes more effort than committing a real one.',
        it: 'Alle 00:13 Sissi e Roberta erano impegnate a organizzare il gioco investigativo di questa Tandem Night. I testimoni confermano che hanno passato ore a inventare crimini ridicoli e alibi sospetti per gli altri volontari ESN. A quanto pare, organizzare un crimine finto richiede più impegno che commetterne uno vero.',
        es: 'A las 00:13, Sissi y Roberta estaban ocupadas organizando el juego de detectives de esta Tandem Night. Los testigos confirman que pasaron horas inventando crímenes ridículos y coartadas sospechosas para otros voluntarios de ESN. Al parecer, organizar un crimen falso cuesta más que cometer uno de verdad.' } },
      { letter: 'B', clears: ['Davide', 'Vincenzo'], code: 'BARS', text: {
        en: 'Davide and Vincenzo were filming a freestyle rap video outside Ostello Bello at 00:13. They were still arguing about who had the better bars.',
        it: "Alle 00:13 Davide e Vincenzo stavano girando un video rap freestyle davanti all'Ostello Bello. Stavano ancora discutendo su chi avesse le barre migliori.",
        es: 'A las 00:13, Davide y Vincenzo estaban grabando un vídeo de rap freestyle frente al Ostello Bello. Seguían discutiendo sobre quién tenía las mejores barras.' } },
      { letter: 'C', clears: ['Francesco'], code: 'NIGHT BUS', text: {
        en: 'Francesco was travelling on a night bus at 00:13. The bus security cameras confirm it.',
        it: 'Alle 00:13 Francesco era su un autobus notturno. Le telecamere del bus lo confermano.',
        es: 'A las 00:13, Francesco viajaba en un autobús nocturno. Las cámaras del autobús lo confirman.' } },
      { letter: 'D', clears: ['Andrea'], code: 'TRANSFER', text: {
        en: 'Andrea was on a recorded fantacalcio call at 00:13, arguing over a transfer as if his life depended on it.',
        it: 'Alle 00:13 Andrea era in una call registrata del fantacalcio, a discutere di uno scambio come se ne dipendesse la sua vita.',
        es: 'A las 00:13, Andrea estaba en una videollamada grabada de fantacalcio, discutiendo un fichaje como si le fuera la vida en ello.' } },
      { letter: 'E', clears: ['Leo'], code: 'PIZZA', text: {
        en: "Leo was caught on the kebab shop's security cameras at 00:13, desperately asking if they could make him a pizza instead.",
        it: 'Alle 00:13 Leo è stato ripreso dalle telecamere del kebabbaro mentre chiedeva disperatamente se potessero fargli una pizza.',
        es: 'A las 00:13, las cámaras del local de kebab grabaron a Leo preguntando desesperadamente si podían hacerle una pizza.' } },
    ],
  },
];
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `node --test tests/data.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add crime-night/package.json crime-night/.vercelignore crime-night/data crime-night/tests/data.test.mjs
git commit -m "Add Crime Night case and suspect data with integrity tests"
```

---

### Task 2: Name normalisation + clue assignment

**Files:**
- Create: `crime-night/lib/assign.js`
- Test: `crime-night/tests/assign.test.mjs`

**Interfaces:**
- Produces: `normaliseName(s: any): string` (`''` if nothing usable).
- Produces: `hash32(str: string): number` (unsigned 32-bit).
- Produces: `assignClues(name: string): { 1: L, 2: L, 3: L, 4: L } | null` with `L ∈ 'A'..'E'`; `null` when the normalised name is empty.

- [ ] **Step 1: Write the failing test**

`crime-night/tests/assign.test.mjs`:
```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/assign.test.mjs`
Expected: FAIL with `Cannot find module '.../lib/assign.js'`.

- [ ] **Step 3: Implement `lib/assign.js`**

```js
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/assign.test.mjs`
Expected: PASS, 5 tests. (Pre-checked: the 500-name spread is 15.0%–24.2%.)

- [ ] **Step 5: Commit**

```bash
git add crime-night/lib/assign.js crime-night/tests/assign.test.mjs
git commit -m "Add name normalisation and deterministic clue assignment"
```

---

### Task 3: Code-word lookup

**Files:**
- Create: `crime-night/lib/codes.js`
- Test: `crime-night/tests/codes.test.mjs`

**Interfaces:**
- Consumes: `CASES` from `data/cases.js`.
- Produces: `normaliseCode(s: any): string` (lowercase ASCII letters/digits only).
- Produces: `codeKey(s: any): string` (`normaliseCode` minus one trailing `s`, so plurals match).
- Produces: `lookupCode(input: any): { caseId: number, letter: string } | null`.

- [ ] **Step 1: Write the failing test**

`crime-night/tests/codes.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../data/cases.js';
import { normaliseCode, codeKey, lookupCode } from '../lib/codes.js';

test('all 20 codes are unique after normalisation', () => {
  const keys = CASES.flatMap(c => c.clues.map(x => codeKey(x.code)));
  assert.equal(keys.length, 20);
  assert.equal(new Set(keys).size, 20);
  assert.ok(keys.every(k => k.length >= 3));
});

test('every code resolves to its own case and letter', () => {
  for (const c of CASES) for (const clue of c.clues) {
    assert.deepEqual(lookupCode(clue.code), { caseId: c.id, letter: clue.letter });
  }
});

test('sloppy input still matches', () => {
  assert.equal(normaliseCode(' Hello-Kitty! '), 'hellokitty');
  assert.deepEqual(lookupCode('night bus'), { caseId: 4, letter: 'C' });
  assert.deepEqual(lookupCode('NIGHTBUS'), { caseId: 4, letter: 'C' });
  assert.deepEqual(lookupCode('Kebabs'), { caseId: 3, letter: 'E' });
  assert.deepEqual(lookupCode('shot'), { caseId: 3, letter: 'B' });
  assert.deepEqual(lookupCode('hello kitty'), { caseId: 2, letter: 'E' });
  assert.deepEqual(lookupCode(' pizza '), { caseId: 4, letter: 'E' });
  assert.deepEqual(lookupCode('FANTACÁLCIO'), { caseId: 2, letter: 'D' });
});

test('garbage does not match', () => {
  for (const s of ['', '   ', 's', 'S', 'pizzaa', 'kebap', 'case 1', null, undefined]) {
    assert.equal(lookupCode(s), null, String(s));
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/codes.test.mjs`
Expected: FAIL with `Cannot find module '.../lib/codes.js'`.

- [ ] **Step 3: Implement `lib/codes.js`**

```js
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/codes.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add crime-night/lib/codes.js crime-night/tests/codes.test.mjs
git commit -m "Add forgiving code-word lookup"
```

---

### Task 4: Player state

**Files:**
- Create: `crime-night/lib/state.js`
- Test: `crime-night/tests/state.test.mjs`

**Interfaces:**
- Consumes: `assignClues`, `normaliseName` from `lib/assign.js`.
- Produces:
  - `KEY = 'crimenight.v1'`
  - `memoryStorage(): Storage-like`, `safeStorage(): Storage-like` (localStorage, or memory if unavailable)
  - `create(name: string, team?: string, lang?: string): State | null`
  - `ownClues(state): {1..4: letter}`
  - `load(storage): State | null`, `save(storage, state): void`, `clear(storage): void`
  - `unlock(state, caseId, letter): 'new' | 'known'`
  - `toggleManual(state, caseId, name): void`
  - `crossed(state, caseData): { cleared: Map<name, letter>, manual: Set<name> }`
  - `setVerdict(state, caseId, accused: string[], at?: number): void`
  - `State = { name, team, lang, unlocked: {1..4: letter[]}, manual: {1..4: name[]}, verdict: {[caseId]: { accused: string[], at: number }} }`

- [ ] **Step 1: Write the failing test**

`crime-night/tests/state.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../data/cases.js';
import { assignClues } from '../lib/assign.js';
import * as S from '../lib/state.js';

test('create pre-unlocks exactly the player\'s own clues', () => {
  const s = S.create('Marco', 'Sherlock Homies', 'it');
  const own = assignClues('Marco');
  for (const id of [1, 2, 3, 4]) assert.deepEqual(s.unlocked[id], [own[id]]);
  assert.equal(s.team, 'Sherlock Homies');
  assert.equal(s.lang, 'it');
  assert.deepEqual(S.ownClues(s), own);
  assert.equal(S.create('  !! '), null);
});

test('create trims and caps name and team at 40 chars', () => {
  const s = S.create('  ' + 'x'.repeat(60), ' ' + 'y'.repeat(60));
  assert.equal(s.name.length, 40);
  assert.equal(s.team.length, 40);
});

test('save + load round-trips', () => {
  const st = S.memoryStorage();
  const s = S.create('Sara');
  S.unlock(s, 1, s.unlocked[1][0] === 'A' ? 'B' : 'A');
  S.save(st, s);
  assert.deepEqual(S.load(st), s);
  S.clear(st);
  assert.equal(S.load(st), null);
});

test('load survives garbage, missing fields and throwing storage', () => {
  const st = S.memoryStorage();
  for (const raw of ['{not json', 'null', '42', '{"name":""}', JSON.stringify({ name: 'Ok', team: '', unlocked: {}, manual: {}, verdict: {} })]) {
    st.setItem(S.KEY, raw);
    assert.equal(S.load(st), null, raw);
  }
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  assert.equal(S.load(throwing), null);
  assert.doesNotThrow(() => S.save(throwing, S.create('Ana')));
  assert.doesNotThrow(() => S.clear(throwing));
});

test('load re-adds a missing own clue', () => {
  const st = S.memoryStorage();
  const s = S.create('Lucas');
  s.unlocked[2] = [];
  st.setItem(S.KEY, JSON.stringify(s));
  assert.deepEqual(S.load(st).unlocked[2], [assignClues('Lucas')[2]]);
});

test('unlock reports new vs known', () => {
  const s = S.create('Emma');
  const mine = s.unlocked[3][0];
  const other = mine === 'A' ? 'B' : 'A';
  assert.equal(S.unlock(s, 3, mine), 'known');
  assert.equal(S.unlock(s, 3, other), 'new');
  assert.equal(S.unlock(s, 3, other), 'known');
  assert.equal(s.unlocked[3].length, 2);
});

test('crossed: evidence clears are separate from manual marks', () => {
  const s = S.create('Hugo');
  const c1 = CASES[0];
  s.unlocked[1] = ['A'];                       // A clears Sissi + Roberta
  S.toggleManual(s, 1, 'Leo');
  let x = S.crossed(s, c1);
  assert.equal(x.cleared.get('Sissi'), 'A');
  assert.equal(x.cleared.get('Roberta'), 'A');
  assert.ok(!x.cleared.has('Leo'));
  assert.ok(x.manual.has('Leo'));
  S.toggleManual(s, 1, 'Leo');
  x = S.crossed(s, c1);
  assert.ok(!x.manual.has('Leo'));
});

test('setVerdict stores a copy with a timestamp', () => {
  const s = S.create('Mia');
  const picked = ['Sissi', 'Roberta'];
  S.setVerdict(s, 3, picked, 123);
  picked.push('Leo');
  assert.deepEqual(s.verdict[3], { accused: ['Sissi', 'Roberta'], at: 123 });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/state.test.mjs`
Expected: FAIL with `Cannot find module '.../lib/state.js'`.

- [ ] **Step 3: Implement `lib/state.js`**

```js
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

export function create(name, team = '', lang = 'en') {
  const own = assignClues(name);
  if (!own) return null;
  const unlocked = perCase();
  for (const id of IDS) unlocked[id] = [own[id]];
  return {
    name: String(name).trim().slice(0, MAX_LEN),
    team: String(team ?? '').trim().slice(0, MAX_LEN),
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
    && typeof s.team === 'string'
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/state.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add crime-night/lib/state.js crime-night/tests/state.test.mjs
git commit -m "Add player state with safe localStorage persistence"
```

---

### Task 5: UI strings + i18n

**Files:**
- Create: `crime-night/data/ui.js`, `crime-night/lib/i18n.js`
- Test: `crime-night/tests/i18n.test.mjs`

**Interfaces:**
- Produces: `UI: { en: Record<key,string>, it: ..., es: ... }`.
- Produces: `LANGS`, `setLang(l): string`, `getLang(): string`, `detectLang(navLang): string`, `t(key, vars?): string` (`{var}` placeholders; unknown placeholders left as-is), `tr(obj: L): string`.

- [ ] **Step 1: Write the failing test**

`crime-night/tests/i18n.test.mjs`:
```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/i18n.test.mjs`
Expected: FAIL with `Cannot find module '.../data/ui.js'`.

- [ ] **Step 3: Create `data/ui.js`**

```js
// Interface strings. Every key must exist in all three languages (checked by tests/i18n.test.mjs).
export const UI = {
  en: {
    brand: 'ESN BOLOGNA // FILE 0413',
    lang_label: 'Language',
    loader_typing: 'OPENING CASE FILE…',
    stamp_topsecret: 'TOP SECRET',
    id_tagline: '4 crimes. 4 private clues. Talk to strangers.',
    id_title: 'Identify yourself, Detective',
    id_name: 'Your name',
    id_team: 'Team name (optional)',
    id_open: 'Open my file',
    id_note: 'Your name decides your clues. Same name, same clues.',
    id_err_empty: 'We need a name, Detective.',
    tab_clues: 'CLUES',
    tab_cases: 'CASES',
    tab_suspects: 'SUSPECTS',
    tab_rules: 'RULES',
    clues_title: 'YOUR CLUES',
    clues_detective: 'Detective: {name}',
    clues_count: '4 private clues',
    cleared: 'CLEARED:',
    cleared_stamp: 'ALIBI',
    your_code: 'Your code word',
    code_hint: 'Read it to other detectives. They type it to get your clue.',
    team_label: 'Team',
    team_placeholder: 'e.g. Sherlock Homies',
    saved: 'Saved',
    not_you: 'Not you? Start over',
    reset_confirm: 'This wipes your progress on this phone. Sure?',
    cases_title: 'CASE FILES',
    case_n: 'CASE {n}',
    culprits_1: '1 culprit',
    culprits_2: '2 accomplices',
    evidence_count: '{n}/5 evidence',
    stamp_unsolved: 'UNSOLVED',
    stamp_accused: 'ACCUSED',
    code_label: 'Heard a code word?',
    code_placeholder: 'Type it here',
    code_submit: 'Check',
    code_ok: 'New evidence! Clue {letter} unlocked in Case {n}',
    code_known: 'You already have this one',
    code_bad: 'No such evidence. Ask again!',
    back_cases: '‹ ALL CASES',
    back_case: '‹ Back to case',
    the_crime: 'THE CRIME',
    evidence: 'EVIDENCE COLLECTED',
    evidence_locked: 'Clue {letter} is still missing. Find someone who has it!',
    suspects_tap: 'SUSPECTS · tap to cross off',
    cleared_by: 'Cleared by evidence {letter}',
    accuse_btn: 'MAKE ACCUSATION',
    accuse_title: 'Who did it?',
    accuse_pick_1: 'Pick 1 suspect',
    accuse_pick_2: 'Pick 2 suspects',
    accuse_confirm: 'Lock it in',
    accuse_cancel: 'Cancel',
    verdict_title: 'VERDICT',
    verdict_accused: 'ACCUSED',
    verdict_detective: 'Detective',
    verdict_team: 'Team',
    verdict_time: 'Time',
    verdict_evidence: 'EVIDENCE {n}/5',
    verdict_show: 'Show this to an ESN volunteer to claim your prize!',
    verdict_change: 'Change accusation',
    verdict_view: 'VIEW VERDICT',
    suspects_title: 'THE 9 SUSPECTS',
    suspects_sub: 'Same suspects for every case. All ESN volunteers. All fiction!',
    rules_title: 'HOW TO PLAY',
    rules_1: 'You have 1 secret clue for each of the 4 cases (Clues tab).',
    rules_2: "Meet a stranger. Ask their name, where they're from, and their clues.",
    rules_3: 'Swap code words. Type theirs in Cases to unlock their clue: innocent suspects get crossed off.',
    rules_4: 'Each case has 5 clues (A–E). Collect them to find the culprit(s).',
    rules_5: 'Make your accusation and show the verdict to an ESN volunteer to win a prize.',
    rules_team: 'Solo or in a team: start anytime, solve one case or all four.',
    rules_mission: 'The crime is an excuse. The real mission is meeting new people.',
    rules_nophone: "Can't use your phone? Find an ESN volunteer.",
    rules_fiction: 'ALL FICTION! No volunteers were harmed.',
    credit: 'Website by Elia',
  },
  it: {
    brand: 'ESN BOLOGNA // FASCICOLO 0413',
    lang_label: 'Lingua',
    loader_typing: 'APERTURA FASCICOLO…',
    stamp_topsecret: 'TOP SECRET',
    id_tagline: '4 crimini. 4 indizi privati. Parla con gli sconosciuti.',
    id_title: 'Identificati, Detective',
    id_name: 'Il tuo nome',
    id_team: 'Nome della squadra (facoltativo)',
    id_open: 'Apri il mio fascicolo',
    id_note: 'Il tuo nome decide i tuoi indizi. Stesso nome, stessi indizi.',
    id_err_empty: 'Ci serve un nome, Detective.',
    tab_clues: 'INDIZI',
    tab_cases: 'CASI',
    tab_suspects: 'SOSPETTATI',
    tab_rules: 'REGOLE',
    clues_title: 'I TUOI INDIZI',
    clues_detective: 'Detective: {name}',
    clues_count: '4 indizi privati',
    cleared: 'FUORI DAI SOSPETTI:',
    cleared_stamp: 'ALIBI',
    your_code: 'La tua parola in codice',
    code_hint: 'Leggila agli altri detective: la scrivono per ottenere il tuo indizio.',
    team_label: 'Squadra',
    team_placeholder: 'es. Sherlock Homies',
    saved: 'Salvato',
    not_you: 'Non sei tu? Ricomincia',
    reset_confirm: 'Questo cancella i tuoi progressi su questo telefono. Sicuro?',
    cases_title: 'FASCICOLI',
    case_n: 'CASO {n}',
    culprits_1: '1 colpevole',
    culprits_2: '2 complici',
    evidence_count: '{n}/5 prove',
    stamp_unsolved: 'IRRISOLTO',
    stamp_accused: 'ACCUSA FATTA',
    code_label: 'Hai sentito una parola in codice?',
    code_placeholder: 'Scrivila qui',
    code_submit: 'Verifica',
    code_ok: 'Nuova prova! Indizio {letter} sbloccato nel Caso {n}',
    code_known: 'Questo ce l’hai già',
    code_bad: 'Nessuna prova con questo nome. Richiedi!',
    back_cases: '‹ TUTTI I CASI',
    back_case: '‹ Torna al caso',
    the_crime: 'IL CRIMINE',
    evidence: 'PROVE RACCOLTE',
    evidence_locked: 'L’indizio {letter} manca ancora. Trova chi ce l’ha!',
    suspects_tap: 'SOSPETTATI · tocca per depennare',
    cleared_by: 'Fuori dai sospetti grazie all’indizio {letter}',
    accuse_btn: 'FAI L’ACCUSA',
    accuse_title: 'Chi è stato?',
    accuse_pick_1: 'Scegli 1 sospettato',
    accuse_pick_2: 'Scegli 2 sospettati',
    accuse_confirm: 'Conferma',
    accuse_cancel: 'Annulla',
    verdict_title: 'VERDETTO',
    verdict_accused: 'ACCUSATI',
    verdict_detective: 'Detective',
    verdict_team: 'Squadra',
    verdict_time: 'Ora',
    verdict_evidence: 'PROVE {n}/5',
    verdict_show: 'Mostralo a un volontario ESN per ritirare il premio!',
    verdict_change: 'Cambia accusa',
    verdict_view: 'VEDI VERDETTO',
    suspects_title: 'I 9 SOSPETTATI',
    suspects_sub: 'Stessi sospettati per ogni caso. Tutti volontari ESN. Tutto inventato!',
    rules_title: 'COME SI GIOCA',
    rules_1: 'Hai 1 indizio segreto per ognuno dei 4 casi (scheda Indizi).',
    rules_2: 'Avvicina uno sconosciuto. Chiedigli nome, da dove viene e i suoi indizi.',
    rules_3: 'Scambiatevi le parole in codice. Scrivi la sua in Casi per sbloccare il suo indizio: i sospettati innocenti vengono depennati.',
    rules_4: 'Ogni caso ha 5 indizi (A–E). Raccoglili per trovare il colpevole o i complici.',
    rules_5: 'Fai la tua accusa e mostra il verdetto a un volontario ESN per vincere un premio.',
    rules_team: 'Da soli o in squadra: inizia quando vuoi, risolvi un caso o tutti e quattro.',
    rules_mission: 'Il crimine è una scusa. La vera missione è conoscere persone nuove.',
    rules_nophone: 'Non puoi usare il telefono? Cerca un volontario ESN.',
    rules_fiction: 'TUTTO INVENTATO! Nessun volontario è stato maltrattato.',
    credit: 'Sito di Elia',
  },
  es: {
    brand: 'ESN BOLOGNA // EXPEDIENTE 0413',
    lang_label: 'Idioma',
    loader_typing: 'ABRIENDO EXPEDIENTE…',
    stamp_topsecret: 'ALTO SECRETO',
    id_tagline: '4 crímenes. 4 pistas privadas. Habla con desconocidos.',
    id_title: 'Identifícate, Detective',
    id_name: 'Tu nombre',
    id_team: 'Nombre del equipo (opcional)',
    id_open: 'Abrir mi expediente',
    id_note: 'Tu nombre decide tus pistas. Mismo nombre, mismas pistas.',
    id_err_empty: 'Necesitamos un nombre, Detective.',
    tab_clues: 'PISTAS',
    tab_cases: 'CASOS',
    tab_suspects: 'SOSPECHOSOS',
    tab_rules: 'REGLAS',
    clues_title: 'TUS PISTAS',
    clues_detective: 'Detective: {name}',
    clues_count: '4 pistas privadas',
    cleared: 'FUERA DE SOSPECHA:',
    cleared_stamp: 'ALIBI',
    your_code: 'Tu palabra clave',
    code_hint: 'Léela a otros detectives: la escriben para conseguir tu pista.',
    team_label: 'Equipo',
    team_placeholder: 'p. ej. Sherlock Homies',
    saved: 'Guardado',
    not_you: '¿No eres tú? Empezar de nuevo',
    reset_confirm: 'Esto borra tu progreso en este móvil. ¿Seguro?',
    cases_title: 'EXPEDIENTES',
    case_n: 'CASO {n}',
    culprits_1: '1 culpable',
    culprits_2: '2 cómplices',
    evidence_count: '{n}/5 pruebas',
    stamp_unsolved: 'SIN RESOLVER',
    stamp_accused: 'ACUSACIÓN HECHA',
    code_label: '¿Has oído una palabra clave?',
    code_placeholder: 'Escríbela aquí',
    code_submit: 'Comprobar',
    code_ok: '¡Nueva prueba! Pista {letter} desbloqueada en el Caso {n}',
    code_known: 'Esta ya la tienes',
    code_bad: 'No existe esa prueba. ¡Pregunta otra vez!',
    back_cases: '‹ TODOS LOS CASOS',
    back_case: '‹ Volver al caso',
    the_crime: 'EL CRIMEN',
    evidence: 'PRUEBAS RECOGIDAS',
    evidence_locked: 'Todavía falta la pista {letter}. ¡Encuentra a quien la tenga!',
    suspects_tap: 'SOSPECHOSOS · toca para tachar',
    cleared_by: 'Fuera de sospecha por la pista {letter}',
    accuse_btn: 'HACER LA ACUSACIÓN',
    accuse_title: '¿Quién fue?',
    accuse_pick_1: 'Elige 1 sospechoso',
    accuse_pick_2: 'Elige 2 sospechosos',
    accuse_confirm: 'Confirmar',
    accuse_cancel: 'Cancelar',
    verdict_title: 'VEREDICTO',
    verdict_accused: 'ACUSADOS',
    verdict_detective: 'Detective',
    verdict_team: 'Equipo',
    verdict_time: 'Hora',
    verdict_evidence: 'PRUEBAS {n}/5',
    verdict_show: '¡Enséñaselo a un voluntario de ESN para reclamar tu premio!',
    verdict_change: 'Cambiar acusación',
    verdict_view: 'VER VEREDICTO',
    suspects_title: 'LOS 9 SOSPECHOSOS',
    suspects_sub: 'Los mismos sospechosos en todos los casos. Todos voluntarios de ESN. ¡Todo es ficción!',
    rules_title: 'CÓMO SE JUEGA',
    rules_1: 'Tienes 1 pista secreta para cada uno de los 4 casos (pestaña Pistas).',
    rules_2: 'Acércate a un desconocido. Pregúntale su nombre, de dónde es y sus pistas.',
    rules_3: 'Intercambiad palabras clave. Escribe la suya en Casos para desbloquear su pista: los sospechosos inocentes se tachan.',
    rules_4: 'Cada caso tiene 5 pistas (A–E). Reúnelas para encontrar al culpable o a los cómplices.',
    rules_5: 'Haz tu acusación y enseña el veredicto a un voluntario de ESN para ganar un premio.',
    rules_team: 'Solo o en equipo: empieza cuando quieras, resuelve un caso o los cuatro.',
    rules_mission: 'El crimen es una excusa. La verdadera misión es conocer gente nueva.',
    rules_nophone: '¿No puedes usar el móvil? Busca a un voluntario de ESN.',
    rules_fiction: '¡TODO ES FICCIÓN! Ningún voluntario sufrió daños.',
    credit: 'Web hecha por Elia',
  },
};
```

- [ ] **Step 4: Implement `lib/i18n.js`**

```js
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test`
Expected: PASS, all tests in all 5 files.

- [ ] **Step 6: Commit**

```bash
git add crime-night/data/ui.js crime-night/lib/i18n.js crime-night/tests/i18n.test.mjs
git commit -m "Add EN/IT/ES interface strings and i18n helpers"
```

---

### Task 6: Page shell, theme and loader

**Files:**
- Modify (replace placeholder): `crime-night/index.html`
- Create: `crime-night/styles.css`, `crime-night/img/suspects/placeholder.svg`

**Interfaces:**
- Produces DOM ids used by `app.js`: `#loader` (with `.typed` and `.loader-stamp` inside), `#lang` (select), `#brand`, `#view` (main), `#tabs` (nav), `#toast`.
- Produces CSS classes used by `app.js`: `folder clip stamp faded static agent page-title sub lbl crime small center slip badge cleared code code-form row shake btn-primary btn-ghost link back error identify tagline team-field case-list case-card case-no ev ev-box got mine mugs mug x by-ev picked mini-stamp polaroids polaroid rules mission credit verdict-card brand-line accused show tab on toast show print file-ref redact`.

- [ ] **Step 1: Replace `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>ESN Crime Night</title>
  <meta name="description" content="ESN Bologna Crime Night: 4 crimes, 4 private clues. Talk to strangers.">
  <meta name="theme-color" content="#0d0d0d">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%94%8D%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Special+Elite&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script type="module" src="app.js"></script>
</head>
<body>
  <div id="loader" class="loader" aria-hidden="true">
    <div class="loader-inner">
      <p class="typed"></p>
      <div class="loader-stamp">TOP SECRET</div>
    </div>
  </div>

  <div class="app">
    <header class="topbar">
      <span id="brand">ESN BOLOGNA // FILE 0413</span>
      <label class="lang">
        <span class="sr-only" id="lang-label">Language</span>
        <select id="lang" aria-labelledby="lang-label">
          <option value="en">EN</option>
          <option value="it">IT</option>
          <option value="es">ES</option>
        </select>
      </label>
    </header>
    <main id="view"></main>
  </div>

  <nav id="tabs" class="tabs" aria-label="Sections" hidden></nav>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>

  <noscript><p style="color:#fff;text-align:center;padding:24px">Please enable JavaScript, or find an ESN volunteer.</p></noscript>
</body>
</html>
```

- [ ] **Step 2: Create `img/suspects/placeholder.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#b5b5b5"/><g stroke="#9c9c9c"><path d="M0 30h120M0 60h120M0 90h120"/></g><g fill="#6f6f6f"><circle cx="60" cy="46" r="22"/><path d="M16 120c4-30 22-42 44-42s40 12 44 42z"/></g></svg>
```

- [ ] **Step 3: Create `styles.css`**

```css
/* ESN Crime Night: black & white film-noir dossier. Red is the only accent; folders are light yellow. */
:root {
  --bg: #0d0d0d;
  --ink: #141414;
  --paper: #f3e7b3;
  --paper-edge: #d6c47f;
  --slip: #fffdf6;
  --red: #b3261e;
  --muted: #9a9a9a;
  --tap: 44px;
  --type: 'Special Elite', 'Courier New', monospace;
  --body: 'Courier Prime', 'Courier New', monospace;
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg) radial-gradient(ellipse at 50% -10%, #2b2b2b, #0a0a0a 65%) fixed;
  color: #e9e9e9;
  font: 16px/1.45 var(--body);
  -webkit-tap-highlight-color: transparent;
  overflow-x: hidden;
}
/* film grain */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  opacity: .14;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E");
}
img { max-width: 100%; display: block; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--type); font-weight: 400; letter-spacing: .04em; margin: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* layout */
.app { max-width: 480px; margin: 0 auto; padding: 12px 16px calc(110px + env(safe-area-inset-bottom)); }
body[data-view="identify"] .app,
body[data-view="verdict"] .app { padding-bottom: 32px; }
.topbar {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  font-family: var(--type); font-size: 12px; letter-spacing: .06em; color: #cfcfcf;
  padding: 4px 0 14px;
}
.topbar select {
  appearance: none; background: transparent; color: #e9e9e9;
  border: 1px solid #777; border-radius: 2px; font: inherit;
  padding: 8px 14px; min-height: var(--tap); cursor: pointer;
}
.topbar select option { color: #000; }

/* folder (light yellow) */
.folder {
  display: block; position: relative;
  background: var(--paper); color: var(--ink);
  border-radius: 3px 14px 3px 3px;
  padding: 22px 16px 18px; margin: 18px 0 8px;
  box-shadow: 0 6px 0 var(--paper-edge), 0 14px 30px rgba(0, 0, 0, .7);
  text-decoration: none;
}
.folder::before {
  content: ""; position: absolute; top: -14px; left: 0;
  width: 118px; height: 16px; background: var(--paper); border-radius: 6px 6px 0 0;
}
/* coffee ring */
.folder::after {
  content: ""; position: absolute; right: 18px; bottom: 22px;
  width: 86px; height: 86px; border-radius: 50%;
  border: 6px solid rgba(90, 70, 30, .12);
  box-shadow: inset 0 0 0 2px rgba(90, 70, 30, .07);
  pointer-events: none;
}
.clip { position: absolute; top: -22px; right: 30px; width: 15px; height: 46px; border: 3px solid #9a9a9a; border-radius: 9px; }
.folder h1 { font-size: 28px; line-height: 1.1; padding-right: 100px; }
.agent { font-size: 15px; margin: 6px 0 12px; }
.file-ref { font-size: 12px; letter-spacing: .1em; margin: 0 0 8px; opacity: .8; }
.redact { background: var(--ink); color: var(--ink); padding: 0 4px; user-select: none; }
.print {
  position: absolute; left: -26px; bottom: 40px; width: 90px; height: 110px; border-radius: 50%;
  background: repeating-radial-gradient(ellipse at 50% 60%, transparent 0 4px, rgba(20, 20, 20, .07) 4px 6px);
  transform: rotate(-20deg); pointer-events: none;
}

/* stamps */
.stamp {
  position: absolute; top: 18px; right: 12px; transform: rotate(-12deg);
  border: 3px double var(--red); color: var(--red);
  font-family: var(--type); font-size: 14px; padding: 2px 8px;
  opacity: .9; pointer-events: none; text-transform: uppercase; white-space: nowrap;
}
.stamp.faded { opacity: .35; }
.stamp.static { position: static; display: inline-block; margin-top: 12px; white-space: normal; }

/* text */
.page-title { font-size: 26px; color: #f1f1f1; margin: 4px 0 6px; }
.sub { color: var(--muted); font-size: 15px; margin: 0 0 12px; }
.lbl {
  font-size: 13px; letter-spacing: .12em; text-transform: uppercase;
  border-bottom: 1.5px solid var(--ink); margin: 18px 0 8px; padding-bottom: 3px;
}
.crime { font-size: 15px; margin: 0; }
.small { font-size: 13px; opacity: .8; }
.center { text-align: center; }

/* clue slips */
.slip {
  background: var(--slip); margin: 10px 0; padding: 10px 12px;
  border-left: 4px solid var(--ink); font-size: 15px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .25); scroll-margin: 90px;
}
.slip header {
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  font-weight: 700; font-size: 12.5px; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 4px;
}
.slip p { margin: 0; }
.badge { flex: none; background: var(--ink); color: #fff; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; font-size: 13px; }
.cleared { color: var(--red); }
.code { margin-top: 10px; border: 2px dashed var(--ink); padding: 8px 10px; display: grid; gap: 2px; }
.code span { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; }
.code b { font-family: var(--type); font-weight: 400; font-size: 24px; letter-spacing: .12em; color: var(--red); }
.code small { font-size: 12.5px; opacity: .75; }

/* forms + buttons */
label { display: grid; gap: 4px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; }
input {
  font: 16px var(--body); color: var(--ink); background: var(--slip);
  border: 2px solid var(--ink); border-radius: 0; padding: 10px 12px;
  min-height: var(--tap); width: 100%;
}
input:focus { outline: 3px solid var(--red); outline-offset: 1px; }
.btn-primary {
  display: block; width: 100%; margin-top: 16px;
  background: var(--red); color: #fff; font: 18px var(--type); letter-spacing: .08em;
  text-align: center; text-decoration: none; padding: 12px;
  border: 2px solid var(--ink); box-shadow: 4px 4px 0 var(--ink);
  cursor: pointer; min-height: var(--tap);
}
.btn-primary:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--ink); }
.btn-primary:disabled { opacity: .45; cursor: not-allowed; }
.btn-ghost {
  flex: 1; display: grid; place-items: center; text-align: center; padding: 10px;
  border: 2px solid var(--ink); color: var(--ink); text-decoration: none;
  font-family: var(--type); font-size: 14px; min-height: var(--tap);
}
.link {
  background: none; border: 0; padding: 12px 0; font: 14px var(--body);
  text-decoration: underline; color: inherit; cursor: pointer;
  display: block; margin: 8px auto 0; min-height: var(--tap);
}
.back { display: inline-flex; align-items: center; font-family: var(--type); font-size: 14px; color: #cfcfcf; text-decoration: none; min-height: var(--tap); }
.error { color: var(--red); font-weight: 700; margin: 0; }
.identify form { display: grid; gap: 12px; margin-top: 14px; }
.identify h2 { font-size: 20px; }
.tagline { font-size: 15px; margin: 6px 0 16px; }
.team-field { margin-top: 14px; }
.credit { text-align: center; color: var(--muted); font-size: 13px; margin: 22px 0 0; }

/* code entry */
.code-form { background: #1c1c1c; border: 1px dashed #555; padding: 12px; margin: 14px 0; color: #e9e9e9; }
.folder .code-form { background: transparent; border-color: var(--ink); color: var(--ink); }
.code-form label { text-transform: none; letter-spacing: 0; font-size: 15px; }
.code-form .row { display: flex; gap: 8px; margin-top: 6px; }
.code-form input { text-transform: uppercase; letter-spacing: .1em; }
.code-form button {
  flex: none; background: var(--ink); color: #fff; border: 2px solid #fff;
  font: 15px var(--type); padding: 0 14px; min-height: var(--tap); cursor: pointer;
}
.folder .code-form button { border-color: var(--ink); }
.shake { animation: shake .4s; }
@keyframes shake { 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }

/* case list */
.case-list { list-style: none; margin: 22px 0 0; padding: 0; display: grid; gap: 24px; }
.case-card h2 { font-size: 20px; padding-right: 110px; margin-top: 4px; }
.case-card p { margin: 6px 0 0; font-size: 15px; }
.case-no { font-size: 12px; letter-spacing: .14em; }

/* evidence boxes */
.ev { display: flex; gap: 6px; }
.ev-box {
  flex: 1; min-height: var(--tap); border: 2px solid var(--ink);
  background: var(--slip); color: var(--ink); font: 700 18px var(--body); cursor: pointer;
}
.ev-box.got { background: var(--ink); color: #fff; }
.ev-box.mine { outline: 3px solid var(--red); outline-offset: 2px; }

/* mugshots */
.mugs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.mug {
  position: relative; background: #fff; border: 1px solid #999; padding: 4px 4px 6px;
  font: 13px var(--body); color: var(--ink); cursor: pointer; min-height: var(--tap); overflow: hidden;
}
.mug img { width: 100%; aspect-ratio: 1; object-fit: cover; filter: grayscale(1) contrast(1.1); background: #bbb; }
.mug span { display: block; margin-top: 4px; overflow-wrap: anywhere; }
.mug.x img, .mug.x span { opacity: .4; }
.mug.x::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to top right, transparent 47%, var(--red) 47% 53%, transparent 53%);
}
.mini-stamp {
  position: absolute; top: 34%; left: 50%; z-index: 1;
  transform: translate(-50%, -50%) rotate(-14deg);
  border: 2px solid var(--red); color: var(--red); background: rgba(255, 253, 246, .85);
  font: normal 12px var(--type); padding: 1px 5px;
}
.mug.picked { outline: 4px solid var(--red); outline-offset: -4px; }
.mug:disabled { cursor: not-allowed; }

/* suspects page */
.polaroids { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px 14px; margin-top: 10px; }
.polaroid {
  margin: 0; background: #f5f5f0; color: var(--ink); padding: 8px 8px 12px;
  transform: rotate(var(--tilt, 0deg)); box-shadow: 0 8px 18px rgba(0, 0, 0, .6);
}
.polaroid img { aspect-ratio: 1; object-fit: cover; width: 100%; filter: grayscale(1) contrast(1.1); background: #bbb; }
.polaroid figcaption { font-size: 13px; margin-top: 8px; display: grid; gap: 2px; }
.polaroid b { font-family: var(--type); font-size: 17px; font-weight: 400; }

/* rules */
.rules { padding-left: 22px; margin: 12px 0; }
.rules li { margin-bottom: 8px; }
.mission { font-family: var(--type); font-size: 18px; border-left: 4px solid var(--red); padding-left: 10px; }

/* verdict */
.verdict-card {
  position: relative; background: var(--slip); color: var(--ink);
  padding: 22px 18px; margin-top: 6px; border: 2px solid var(--ink);
  box-shadow: 0 14px 30px rgba(0, 0, 0, .7); text-align: center;
}
.verdict-card .brand-line { font-size: 12px; letter-spacing: .14em; margin: 0; }
.verdict-card h1 { font-size: 46px; color: var(--red); margin: 6px 0 2px; }
.verdict-card h2 { font-size: 18px; }
.verdict-card .lbl { text-align: center; }
.accused { display: flex; justify-content: center; gap: 12px; margin: 8px 0 14px; }
.accused figure { margin: 0; width: 42%; max-width: 150px; }
.accused img { aspect-ratio: 1; object-fit: cover; width: 100%; filter: grayscale(1) contrast(1.1); border: 2px solid var(--ink); background: #bbb; }
.accused figcaption { font: 22px var(--type); margin-top: 4px; }
.verdict-card dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; text-align: left; margin: 0 auto 14px; max-width: 280px; font-size: 15px; }
.verdict-card dt { font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: .1em; align-self: center; }
.verdict-card dd { margin: 0; overflow-wrap: anywhere; }
.verdict-card .stamp { position: static; display: inline-block; font-size: 20px; padding: 4px 12px; transform: rotate(-6deg); }
.verdict-card .show { font-weight: 700; margin: 16px 0; }
.verdict-card .row { display: flex; gap: 10px; }

/* bottom nav: filing-cabinet index tabs with red marker on the active one */
.tabs {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 10;
  background: #0a0a0a; border-top: 1px solid #222;
  padding: 10px 8px calc(10px + env(safe-area-inset-bottom));
  display: flex; gap: 4px; align-items: flex-end; justify-content: center;
}
.tab {
  flex: 1; max-width: 118px; min-height: var(--tap);
  background: #3a3a3a; color: #bbb; text-decoration: none; text-align: center;
  font-family: var(--type); font-size: clamp(10px, 3.1vw, 12.5px); letter-spacing: .02em;
  padding: 7px 2px 8px; border-radius: 8px 8px 0 0; position: relative;
  overflow-wrap: anywhere; transition: padding .15s;
}
.tab small { display: block; font-size: 9px; opacity: .6; }
.tab.on { background: var(--paper); color: var(--ink); padding-top: 14px; }
.tab.on::after {
  content: ""; position: absolute; left: 22%; right: 22%; bottom: 3px; height: 3px;
  background: var(--red); border-radius: 2px; transform: rotate(-3deg);
}

/* toast */
.toast {
  position: fixed; left: 50%; bottom: calc(96px + env(safe-area-inset-bottom)); z-index: 30;
  transform: translate(-50%, 20px); opacity: 0; pointer-events: none; transition: .2s;
  background: var(--ink); color: #fff; border: 1px solid #555; padding: 10px 16px;
  font-size: 15px; max-width: calc(100% - 32px); text-align: center;
}
.toast.show { opacity: 1; transform: translate(-50%, 0); }

/* loader: typewriter + stamp slam */
.loader { position: fixed; inset: 0; z-index: 100; background: #0a0a0a; display: grid; place-items: center; transition: opacity .35s; }
.loader.out { opacity: 0; }
.loader-inner { text-align: center; padding: 16px; }
.typed { font: 20px var(--type); color: #e9e9e9; min-height: 1.5em; margin: 0 0 18px; letter-spacing: .06em; }
.typed::after { content: "▌"; animation: blink .7s steps(1) infinite; }
.loader-stamp {
  display: inline-block; border: 4px double var(--red); color: var(--red);
  font: 28px var(--type); padding: 4px 14px; opacity: 0; transform: rotate(-12deg) scale(2.4);
}
.loader.stamped .loader-stamp { animation: slam .3s cubic-bezier(.2, 1.6, .4, 1) forwards; }
@keyframes slam { to { opacity: 1; transform: rotate(-12deg) scale(1); } }
@keyframes blink { 50% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 4: Verify the shell loads**

Run (from `crime-night`): `npx --yes serve -l 5173 .` in the background, then `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/styles.css` and the same for `/img/suspects/placeholder.svg`.
Expected: `200` for both. (The page itself shows only the top bar and loader until Task 7 adds `app.js`; a missing `app.js` 404 is expected at this point.)

- [ ] **Step 5: Commit**

```bash
git add crime-night/index.html crime-night/styles.css crime-night/img
git commit -m "Add noir dossier page shell, theme and loader styles"
```

---

### Task 7: App: router, views, interactions

**Files:**
- Create: `crime-night/app.js`

**Interfaces:**
- Consumes: `CASES` (`data/cases.js`), `SUSPECTS` (`data/suspects.js`), `t, tr, setLang, getLang, detectLang` (`lib/i18n.js`), `normaliseName` (`lib/assign.js`), `lookupCode` (`lib/codes.js`), everything in `lib/state.js`; DOM ids/classes from Task 6.
- Routes: `#/clues` (default), `#/cases`, `#/case/:id`, `#/case/:id/accuse`, `#/case/:id/verdict`, `#/suspects`, `#/rules`. Without a stored identity, every route shows Identify.

- [ ] **Step 1: Create `app.js`**

```js
// ESN Crime Night: hash-routed single page. Views are template strings; events are delegated on #view.
import { CASES } from './data/cases.js';
import { SUSPECTS } from './data/suspects.js';
import { t, tr, setLang, getLang, detectLang } from './lib/i18n.js';
import { normaliseName } from './lib/assign.js';
import { lookupCode } from './lib/codes.js';
import * as S from './lib/state.js';

const LANG_KEY = 'crimenight.lang';
const PLACEHOLDER = 'img/suspects/placeholder.svg';
const TABS = [['clues', 'tab_clues'], ['cases', 'tab_cases'], ['suspects', 'tab_suspects'], ['rules', 'tab_rules']];
const TILTS = [-3, 2, -1, 3, -2, 1, -3, 2, -1];

const storage = S.safeStorage();
let state = S.load(storage);
let picking = [];
let lastHash = null;
let toastTimer;

const $ = id => document.getElementById(id);
const main = $('view');
const nav = $('tabs');
const langSel = $('lang');
const toastEl = $('toast');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const caseById = id => CASES.find(c => c.id === id);
const photo = name => SUSPECTS.find(s => s.name === name)?.photo || PLACEHOLDER;
const persist = () => S.save(storage, state);
const culpritsLabel = c => t(c.culprits === 1 ? 'culprits_1' : 'culprits_2');

/* ---------- language ---------- */

function applyLang(l) {
  setLang(l);
  document.documentElement.lang = getLang();
  langSel.value = getLang();
  $('brand').textContent = t('brand');
  $('lang-label').textContent = t('lang_label');
}

function initLang() {
  let saved = null;
  try { saved = storage.getItem(LANG_KEY); } catch { /* ignore */ }
  applyLang(state?.lang || saved || detectLang(navigator.language));
}

/* ---------- routing ---------- */

function route() {
  if (!state) return { view: 'identify' };
  const [v, a, b] = location.hash.replace(/^#\/?/, '').split('/');
  const id = Number(a);
  if (v === 'case' && caseById(id)) {
    if (b === 'accuse') return { view: 'accuse', id, tab: 'cases' };
    if (b === 'verdict' && state.verdict[id]) return { view: 'verdict', id };
    return { view: 'case', id, tab: 'cases' };
  }
  if (v === 'cases' || v === 'suspects' || v === 'rules') return { view: v, tab: v };
  return { view: 'clues', tab: 'clues' };
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function onHashChange() {
  const r = route();
  if (r.view === 'accuse') {
    const { cleared } = S.crossed(state, caseById(r.id));
    picking = (state.verdict[r.id]?.accused || []).filter(n => !cleared.has(n));
  }
  render();
}

/* ---------- feedback ---------- */

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

/* ---------- partials ---------- */

function mugImg(name) {
  return `<img src="${photo(name)}" alt="" loading="lazy" width="120" height="120">`;
}

function clueSlip(c, clue, withCode) {
  return `<article class="slip" id="slip-${c.id}-${clue.letter}">
    <header><span>${t('case_n', { n: pad(c.id) })} · ${esc(tr(c.short))}</span><span class="badge">${clue.letter}</span></header>
    <p><strong class="cleared">${t('cleared')} ${clue.clears.join(' + ')}.</strong> ${esc(tr(clue.text))}</p>
    ${withCode ? `<div class="code"><span>${t('your_code')}</span><b>${esc(clue.code)}</b><small>${t('code_hint')}</small></div>` : ''}
  </article>`;
}

function codeForm() {
  return `<form class="code-form" data-form="code" autocomplete="off">
    <label for="code-input">${t('code_label')}</label>
    <div class="row">
      <input id="code-input" name="code" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="30" placeholder="${t('code_placeholder')}">
      <button type="submit">${t('code_submit')}</button>
    </div>
  </form>`;
}

/* ---------- views ---------- */

const VIEWS = {
  identify() {
    return `<section class="folder identify">
      <div class="clip"></div><div class="stamp">${t('stamp_topsecret')}</div>
      <h1>ESN CRIME NIGHT</h1>
      <p class="tagline">${t('id_tagline')}</p>
      <h2>${t('id_title')}</h2>
      <form id="identify-form" novalidate>
        <label>${t('id_name')}<input name="name" autocomplete="given-name" maxlength="40" required></label>
        <label>${t('id_team')}<input name="team" maxlength="40" placeholder="${t('team_placeholder')}"></label>
        <p class="error" id="id-error" hidden>${t('id_err_empty')}</p>
        <button class="btn-primary" type="submit">${t('id_open')}</button>
      </form>
      <p class="small">${t('id_note')}</p>
    </section>
    <p class="credit">${t('credit')} · ESN Bologna</p>`;
  },

  clues() {
    const own = S.ownClues(state);
    return `<section class="folder">
      <div class="clip"></div><div class="stamp">${t('stamp_topsecret')}</div><div class="print"></div>
      <h1>${t('clues_title')}</h1>
      <p class="agent">${t('clues_detective', { name: `<u>${esc(state.name)}</u>` })} · ${t('clues_count')}</p>
      <p class="file-ref">REF: <span class="redact">XXXXXXXX</span> · ESN/BO</p>
      ${CASES.map(c => clueSlip(c, c.clues.find(x => x.letter === own[c.id]), true)).join('')}
      <label class="team-field">${t('team_label')}
        <input data-field="team" maxlength="40" value="${esc(state.team)}" placeholder="${t('team_placeholder')}">
      </label>
      <button class="link" data-action="reset">${t('not_you')}</button>
    </section>`;
  },

  cases() {
    return `<h1 class="page-title">${t('cases_title')}</h1>
      ${codeForm()}
      <ul class="case-list">${CASES.map(c => {
        const accused = !!state.verdict[c.id];
        return `<li><a class="folder case-card" href="#/case/${c.id}">
          <span class="case-no">${t('case_n', { n: pad(c.id) })}</span>
          <h2>${esc(tr(c.title))}</h2>
          <p>${culpritsLabel(c)} · ${t('evidence_count', { n: state.unlocked[c.id].length })}</p>
          <span class="stamp ${accused ? '' : 'faded'}">${t(accused ? 'stamp_accused' : 'stamp_unsolved')}</span>
        </a></li>`;
      }).join('')}</ul>`;
  },

  case({ id }) {
    const c = caseById(id);
    const own = S.ownClues(state)[id];
    const got = state.unlocked[id];
    const { cleared, manual } = S.crossed(state, c);
    const accused = !!state.verdict[id];
    return `<a class="back" href="#/cases">${t('back_cases')}</a>
    <section class="folder">
      <div class="clip"></div><div class="stamp">${t(accused ? 'stamp_accused' : 'stamp_unsolved')}</div>
      <h1>${t('case_n', { n: pad(id) })}</h1>
      <p class="agent"><b>${esc(tr(c.title))}</b> · ${culpritsLabel(c)}</p>
      <h3 class="lbl">${t('the_crime')}</h3>
      <p class="crime">${esc(tr(c.crime))}</p>
      <h3 class="lbl">${t('evidence')}</h3>
      <div class="ev">${'ABCDE'.split('').map(L => `<button class="ev-box ${got.includes(L) ? 'got' : ''} ${L === own ? 'mine' : ''}" data-action="ev" data-letter="${L}" aria-pressed="${got.includes(L)}">${L}</button>`).join('')}</div>
      ${c.clues.filter(x => got.includes(x.letter)).map(x => clueSlip(c, x, false)).join('')}
      ${codeForm()}
      <h3 class="lbl">${t('suspects_tap')}</h3>
      <div class="mugs">${SUSPECTS.map(s => {
        const by = cleared.get(s.name);
        const x = !!by || manual.has(s.name);
        return `<button class="mug ${x ? 'x' : ''} ${by ? 'by-ev' : ''}" data-action="cross" data-name="${s.name}" aria-pressed="${x}">
          ${mugImg(s.name)}<span>${s.name}</span>${by ? `<i class="mini-stamp">${t('cleared_stamp')}</i>` : ''}
        </button>`;
      }).join('')}</div>
      <a class="btn-primary" href="#/case/${id}/${accused ? 'verdict' : 'accuse'}">${t(accused ? 'verdict_view' : 'accuse_btn')}</a>
      <p class="small center">${t('verdict_show')}</p>
    </section>`;
  },

  accuse({ id }) {
    const c = caseById(id);
    const { cleared } = S.crossed(state, c);
    return `<a class="back" href="#/case/${id}">${t('back_case')}</a>
    <section class="folder">
      <div class="clip"></div>
      <h1>${t('accuse_title')}</h1>
      <p class="agent"><b>${esc(tr(c.title))}</b> · ${t(c.culprits === 1 ? 'accuse_pick_1' : 'accuse_pick_2')}</p>
      <div class="mugs">${SUSPECTS.map(s => {
        const out = cleared.has(s.name);
        const sel = picking.includes(s.name);
        return `<button class="mug ${sel ? 'picked' : ''} ${out ? 'x' : ''}" data-action="pick" data-name="${s.name}" aria-pressed="${sel}" ${out ? 'disabled' : ''}>
          ${mugImg(s.name)}<span>${s.name}</span>
        </button>`;
      }).join('')}</div>
      <button class="btn-primary" data-action="lock" ${picking.length === c.culprits ? '' : 'disabled'}>${t('accuse_confirm')}</button>
      <a class="link center" href="#/case/${id}">${t('accuse_cancel')}</a>
    </section>`;
  },

  verdict({ id }) {
    const c = caseById(id);
    const v = state.verdict[id];
    const time = new Date(v.at).toLocaleTimeString(getLang(), { hour: '2-digit', minute: '2-digit' });
    return `<section class="verdict-card">
      <p class="brand-line">ESN CRIME NIGHT · ${t('case_n', { n: pad(id) })}</p>
      <h1>${t('verdict_title')}</h1>
      <h2>${esc(tr(c.title))}</h2>
      <p class="lbl">${t('verdict_accused')}</p>
      <div class="accused">${v.accused.map(n => `<figure>${mugImg(n)}<figcaption>${esc(n)}</figcaption></figure>`).join('')}</div>
      <dl>
        <dt>${t('verdict_detective')}</dt><dd>${esc(state.name)}</dd>
        ${state.team ? `<dt>${t('verdict_team')}</dt><dd>${esc(state.team)}</dd>` : ''}
        <dt>${t('verdict_time')}</dt><dd>${time}</dd>
      </dl>
      <div class="stamp">${t('verdict_evidence', { n: state.unlocked[id].length })}</div>
      <p class="show">${t('verdict_show')}</p>
      <div class="row">
        <a class="btn-ghost" href="#/case/${id}">${t('back_case')}</a>
        <a class="btn-ghost" href="#/case/${id}/accuse">${t('verdict_change')}</a>
      </div>
    </section>`;
  },

  suspects() {
    return `<h1 class="page-title">${t('suspects_title')}</h1>
      <p class="sub">${t('suspects_sub')}</p>
      <div class="polaroids">${SUSPECTS.map((s, i) => `<figure class="polaroid" style="--tilt:${TILTS[i % TILTS.length]}deg">
        <img src="${photo(s.name)}" alt="${s.name}" loading="lazy" width="200" height="200">
        <figcaption><b>${s.name}</b><span>${esc(tr(s.caption))}</span></figcaption>
      </figure>`).join('')}</div>`;
  },

  rules() {
    return `<section class="folder">
      <div class="clip"></div>
      <h1>${t('rules_title')}</h1>
      <ol class="rules">${[1, 2, 3, 4, 5].map(i => `<li>${t('rules_' + i)}</li>`).join('')}</ol>
      <p>${t('rules_team')}</p>
      <p class="mission">${t('rules_mission')}</p>
      <p>${t('rules_nophone')}</p>
      <div class="stamp static">${t('rules_fiction')}</div>
    </section>
    <p class="credit">${t('credit')} · ESN Bologna</p>`;
  },
};

function render() {
  const r = route();
  document.body.dataset.view = r.view;
  nav.hidden = !r.tab;
  nav.innerHTML = r.tab
    ? TABS.map(([id, key], i) => `<a href="#/${id}" class="tab ${r.tab === id ? 'on' : ''}" ${r.tab === id ? 'aria-current="page"' : ''}><small>0${i + 1}</small>${t(key)}</a>`).join('')
    : '';
  main.innerHTML = VIEWS[r.view](r);
  if (location.hash !== lastHash) {
    lastHash = location.hash;
    window.scrollTo(0, 0);
  }
}

/* ---------- events ---------- */

main.addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;

  if (form.id === 'identify-form') {
    const data = new FormData(form);
    const name = String(data.get('name') || '');
    if (!normaliseName(name)) {
      $('id-error').hidden = false;
      shake(form.querySelector('input[name="name"]'));
      return;
    }
    state = S.create(name, String(data.get('team') || ''), getLang());
    persist();
    go('#/clues');
    return;
  }

  if (form.dataset.form === 'code') {
    const input = form.querySelector('input');
    const hit = lookupCode(input.value);
    if (!hit) {
      shake(input);
      toast(t('code_bad'));
      return;
    }
    const result = S.unlock(state, hit.caseId, hit.letter);
    persist();
    toast(result === 'known' ? t('code_known') : t('code_ok', { letter: hit.letter, n: pad(hit.caseId) }));
    render();
  }
});

main.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const r = route();
  const name = el.dataset.name;

  switch (el.dataset.action) {
    case 'reset':
      if (confirm(t('reset_confirm'))) {
        S.clear(storage);
        state = null;
        go('#/');
      }
      break;

    case 'ev': {
      const L = el.dataset.letter;
      if (state.unlocked[r.id].includes(L)) {
        $(`slip-${r.id}-${L}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        toast(t('evidence_locked', { letter: L }));
      }
      break;
    }

    case 'cross': {
      const { cleared } = S.crossed(state, caseById(r.id));
      if (cleared.has(name)) {
        toast(t('cleared_by', { letter: cleared.get(name) }));
        break;
      }
      S.toggleManual(state, r.id, name);
      persist();
      render();
      break;
    }

    case 'pick': {
      const max = caseById(r.id).culprits;
      if (picking.includes(name)) picking = picking.filter(n => n !== name);
      else picking = [...picking, name].slice(-max); // picking a 3rd drops the oldest
      render();
      break;
    }

    case 'lock':
      if (picking.length !== caseById(r.id).culprits) break;
      S.setVerdict(state, r.id, picking);
      persist();
      go(`#/case/${r.id}/verdict`);
      break;
  }
});

main.addEventListener('change', e => {
  if (e.target.dataset.field !== 'team') return;
  state.team = e.target.value.trim().slice(0, 40);
  persist();
  toast(t('saved'));
});

langSel.addEventListener('change', () => {
  applyLang(langSel.value);
  if (state) {
    state.lang = getLang();
    persist();
  } else {
    try { storage.setItem(LANG_KEY, getLang()); } catch { /* ignore */ }
  }
  render();
});

window.addEventListener('hashchange', onHashChange);

/* ---------- loader ---------- */

function runLoader() {
  const el = $('loader');
  let seen = false;
  try { seen = sessionStorage.getItem('crimenight.loader') === '1'; } catch { /* ignore */ }
  if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.remove();
    return;
  }
  try { sessionStorage.setItem('crimenight.loader', '1'); } catch { /* ignore */ }

  const text = t('loader_typing');
  const out = el.querySelector('.typed');
  el.querySelector('.loader-stamp').textContent = t('stamp_topsecret');
  let i = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  };
  const timer = setInterval(() => {
    out.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(timer);
      el.classList.add('stamped');
      setTimeout(finish, 650);
    }
  }, 40);
  el.addEventListener('click', finish);
}

/* ---------- boot ---------- */

initLang();
onHashChange();
runLoader();
```

- [ ] **Step 2: Run unit tests (nothing should regress)**

Run: `node --test`
Expected: PASS, all tests.

- [ ] **Step 3: Serve and smoke-check every asset**

Run (from `crime-night`, server from Task 6 still up or restarted): for each of `/ /app.js /styles.css /lib/assign.js /lib/codes.js /lib/state.js /lib/i18n.js /data/cases.js /data/suspects.js /data/ui.js /img/suspects/placeholder.svg`, `curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:5173<path>`.
Expected: all `200`.

- [ ] **Step 4: Manual phone-size walkthrough** (browser devtools, 375×812 and 360×740)

Open `http://localhost:5173`. Check each item; fix and re-check anything that fails:
1. Loader types "OPENING CASE FILE…", stamp slams, fades. Reload: no loader (same session). Tap during loader: skips.
2. Identify: submit empty or `!!!` shows the red error and shakes. Submit `Δημήτρης` works.
3. Clues: 4 slips, each with a code word; yellow folder; tabs at bottom with red marker on `01 CLUES`.
4. Name `<img src=x onerror=alert(1)>`, team `<b>x</b>` (after "Not you? Start over"): both appear as literal text on Clues and on a Verdict, with no alert and no bold.
5. Cases → Case 01: own letter outlined red and filled; type another case-01 code with odd spacing/case (e.g. ` karaoke `): toast "New evidence!", box fills, slip appears, those suspects get ALIBI stamp + red slash. Tapping an ALIBI mugshot shows "Cleared by evidence B" and doesn't uncross. Tapping another mugshot toggles the slash.
6. On Case 01's page, type a Case 03 code: toast names Case 03; Case 03 shows it.
7. Invalid code `pizzaa`: field shakes, "No such evidence" toast.
8. Make accusation on Case 03: must pick 2; picking a 3rd drops the oldest; cleared ones are disabled; Lock it in → Verdict shows names, photos (placeholder), detective, team, time, "EVIDENCE n/5" stamp; nav hidden. Change accusation → picks are pre-selected.
9. Edit team name on Clues later → "Saved" → Verdict shows new team.
10. Switch language to IT and ES on Clues, Case, Verdict, Rules: all text changes, no English leftovers except names/codes/places; the tabs fit at 360px without overflowing the screen.
11. Reload on `#/case/3/verdict`: same verdict renders. Clear site data → reload → Identify.
12. Rules shows "Website by Elia".

- [ ] **Step 5: Commit**

```bash
git add crime-night/app.js
git commit -m "Add Crime Night app: identify, clues, cases, code words, accusation and verdict"
```

---

### Task 8: Docs, final verification, deploy

**Files:**
- Modify: `crime-night/README.md` (structure, tests, photos how-to)
- Modify: `README.md` (status column)

- [ ] **Step 1: Update `crime-night/README.md`**

Replace the "Tech" section's "Planned structure" block with the real tree from this plan's File map, and add after "Run locally":

```markdown
## Tests

From this folder (Node 18+):

    node --test

Checks the case data (every case solvable, all translations present, codes unique),
clue assignment spread, code matching and state handling.

## Adding suspect photos

1. Put square-ish photos in `img/suspects/` (e.g. `img/suspects/sissi.jpg`, ~400×400, under 100 KB).
2. In `data/suspects.js`, set that suspect's `photo: 'img/suspects/sissi.jpg'`.
They're shown in black and white automatically. Without a photo a grey silhouette is shown.
```

Also tick nothing in "Content still needed" (photos, Case 04, date are still open).

- [ ] **Step 2: Update root `README.md` status**

Change the crime-night row status from `In design` to `Live: https://esnstuff-crime-night.vercel.app`.

- [ ] **Step 3: Full verification**

Run: `node --test` → all PASS. Re-run the Task 7 Step 3 curl loop → all `200`.

- [ ] **Step 4: Commit**

```bash
git add crime-night/README.md README.md
git commit -m "Document Crime Night tests, photos and live URL"
```

- [ ] **Step 5: Ask the user before pushing**

Pushing to `main` deploys live to https://esnstuff-crime-night.vercel.app. Ask; on yes, run `git push`, then
`curl -s https://esnstuff-crime-night.vercel.app | grep -o "<title>.*</title>"` and check that `https://esnstuff-crime-night.vercel.app/tests/data.test.mjs` returns 404 (`.vercelignore` working).
