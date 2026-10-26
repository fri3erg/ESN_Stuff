# Side Quest: design spec

Date: 2026-10-14 · Status: awaiting review

The organiser's brief, [../brief.md](../brief.md), is the base spec. **Everything in it applies unless this
document changes it.** This file records the decisions taken with Elia after reading the brief, and the
visual design chosen from the mockups.

## 1. Changes to the brief (decided 2026-10-14)

| Brief says | Decision |
|---|---|
| Reward is a candy | Reward is **a prize** ("get a prize 🎁"). |
| Rule 2: "Do it with other people at the party." | Rule 2: **"Complete it."** |
| Visible consent/safety line on the welcome screen | **Removed.** |
| Swap once per phone | Kept, but it opens a **confirmation sheet**: "Swap your quest? You only get one swap tonight. Your new quest is final, no going back." → **Yes, swap it** / **Keep my quest**. |
| Completion screen has a live ticking clock (HH:MM:SS) | **No live clock.** The screen shows **"COMPLETED AT HH:MM"** large instead. Screenshot deterrence comes from the moving background and the light sweeping across the trophy card. The code comments say plainly that this only deters casual screenshots. |
| "Completed at HH:MM" line under the clock | Dropped (the big time *is* the completion time). |
| "One quest per person tonight" (optional) | Not shown. |
| Missions #2 (sip of a stranger's drink) and #17 (loser buys the next round) | **Kept as written** after discussion. |
| Quest auto-hides after 10 s, with a Hide button | **No re-hiding** (decided after the first build): once revealed, the quest stays visible. It still starts hidden on every load. |
| Cover text "Tap to reveal your quest" + explanation | Just **"👆 TAP TO REVEAL"**, centred. |
| Pink proof badge with a per-type emoji icon | **Border-only proof box** (pink outline, transparent inside) with the same **✓ checkmark** for every quest, pinned to the bottom of the quest card. |
| Quest box size | The hidden tile and the revealed card **fill the free space and are the same size**, so revealing doesn't make the box jump. On short phones (≤ 700 px tall) titles and text shrink slightly so the longest quest still fits. |
| Completion: "Go find a volunteer." | **"Go find a volunteer for a small prize."** |
| Mission #5 text | Adds **"No pen? Ask a volunteer for one."** |
| 20 missions | **23**: added #21 photoshoot with a piece of clothing (photo, "show the pictures to a volunteer"), #22 fake birthday "Happy Birthday" (video), #23 5 hugs to strangers (tell). **Never state the number of quests** to players or staff (banner, site, staff sheet). |
| "One quest per phone is the intended rule", no further buttons on the complete screen | **"🔁 Play again"** button on the complete screen, behind a confirmation ("Play again? This clears your completed quest from this phone and you lose this screen. Show it to a volunteer first!" → YES, NEW QUEST / Keep this screen). A new game gets a fresh swap. |
| Pick a mission uniformly at random | Kept. Random per phone, not by name: a name hash gives the same spread and adds typing. Simulation, 500 players and 20 quests: the least-picked quest typically gets ~16 people and the most-picked ~34 (ideal 25). An exact split would need a shared server counter, which the brief rules out. |

## 2. Visual design: "Neon Arcade"

Chosen from mockups v1–v3 (`.superpowers/brainstorm/…/side-quest-v3.html`).

- **Base:** pure black `#07070b` background, white text, system font stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`), and `ui-monospace` for small "arcade" labels. No web fonts.
- **Accents:** neon lime `#c6ff00` for primary buttons, headings and glows; hot pink `#ff4fae` for small kicker labels and the proof badge. The badge uses **dark text** for AA contrast. Buttons are chunky and rounded, with a "pressable" bottom shadow.
- **Welcome:** kicker "ESN · SIDE QUEST", big lime "SIDE QUEST" title, three numbered rules with lime number chips, and the **GET MY QUEST ▶** button.
- **Quest (hidden):** kicker "QUEST ACCEPTED", title "YOUR QUEST", and a large dashed-lime striped tile that pulses gently: "👆 TAP TO REVEAL / Hidden so people next to you can't read it". Below it **I DID IT ▶** and, while unused, **🔄 Swap quest (1 left)**.
- **Reveal animation: laser scan.** On tap, a glowing lime laser line sweeps top to bottom over about 0.9 s, uncovering the quest card. The quest text "decrypts", with random characters settling into the real letters left to right. Under `prefers-reduced-motion` the reveal is instant, with no laser or scramble.
- **Quest (revealed):** a card with the mission text (large and bold), the proof badge (icon + instruction), and a small "hides in 7s · Hide" countdown line. It **auto-hides after 10 s** or when Hide is pressed. The revealed state is never persisted, so the quest always starts hidden.
- **Swap confirmation:** the screen dims, and a bottom sheet with a lime border shows the text above and two buttons.
- **Quest complete:** a slowly drifting dark cyan/green gradient background (no pink), and a trophy card with a lime border and glow, 🏆 in a lime circle, "Quest complete!", "Go find a volunteer." in lime, and a light band sweeping across it continuously. Then "COMPLETED AT" (small cyan label) and the time in large type, then the quest card again with the proof badge, so the volunteer can see what was claimed. Under reduced motion the background and sweep are still, which is allowed: the brief only exempts the clock, and there is no clock now.

Proof badge icons are emoji: live ✋ · photo 📷 · video 🎥 · phone 📱 · tell 💬.

## 3. Architecture

Plain static files with no build step and no dependencies, deployed by Vercel from `side-quest/`.

```
side-quest/
├── index.html        # markup + inline CSS + inline boot script (imports the two modules)
├── missions.js       # the missions + proof types: the only file the organiser edits
├── quest.js          # pure state logic (no DOM): random pick, swap, complete, load/save/reset
├── tests/
│   ├── missions.test.mjs
│   └── quest.test.mjs
├── package.json      # {"type":"module"} + test script (not deployed)
├── .vercelignore     # tests, docs, package.json, README.md
├── docs/             # brief + this spec + plan (not deployed)
└── README.md
```

- **Three same-origin requests** (HTML + two small modules, about 20–30 KB total) instead of the brief's
  "single request". This keeps `missions.js` separate for the organiser and the logic testable without a
  build step. The brief says "aim for", so this is within it.
- **No third-party requests at all:** no fonts, no CDN, and the favicon is an inline SVG data URI.
- **No service worker.** It's optional in the brief, and on a one-night site cache invalidation after a late fix is a
  bigger risk than offline reloads. All state is in localStorage, so a reload only needs the page itself.

### State (`quest.js`)

- Storage key `sidequest.v1`, value `{ missionId, status: "assigned"|"completed", swapsUsed: 0|1, completedAt: ISO|null }`.
- `load()` treats missing, unparsable or invalid data as no state: unknown `missionId`, bad `status`,
  `swapsUsed` not 0/1, or `completed` without a valid `completedAt`.
- Storage access is wrapped. If `localStorage` throws, the app uses an in-memory store for the session.
- `pickMission(rand)`: uniform over the 20 ids using `crypto.getRandomValues` with rejection sampling
  (no modulo bias), falling back to `Math.random`.
- `swap(state)`: only when `swapsUsed === 0` and `status === "assigned"`. It picks a different id, sets `swapsUsed = 1`.
- `complete(state, now)`: sets `status = "completed"` and `completedAt = now.toISOString()`.
- `?reset=1` clears the key, then removes the parameter from the address bar (`history.replaceState`) so a
  reload doesn't keep resetting.

## 4. Requirements kept from the brief (checklist)

English only, short plain sentences. Works at 360 px with no horizontal scroll. Tap targets ≥ 48 px, body text ≥ 18 px,
WCAG AA contrast, one-handed use (primary buttons in the lower half). Page `<title>` "Side Quest", viewport meta,
`theme-color`, inline SVG favicon. The mission data is separate from the rendering code.

## 5. Testing

- **Unit (`node --test`):** the mission data (20 unique ids, valid proof types, non-empty text) and the state logic
  (uniform pick, where all 20 appear over a few hundred picks; swap only once and always different; complete sets an ISO time;
  load rejects corrupt or invalid data; a throwing storage falls back to memory without throwing).
- **Browser walkthrough (headless Chrome, throwaway script):** all 9 acceptance checks from the brief, as changed
  above. Welcome → hidden quest. Reload keeps the quest. Reveal + auto-hide at 10 s. Swap with confirmation, once, then gone.
  I did it → complete. Reload stays. `?reset=1`. localStorage blocked. 360 px with no sideways scroll. Tap targets ≥ 48 px.
  Zero requests to other origins.
- **Lighthouse mobile** accessibility run for contrast and tap targets.

## 6. Deploy

New Vercel project named **esn-side-quest**, Root Directory `side-quest`, preset Other, no build command, so the
public URL is **https://esn-side-quest.vercel.app**. The organiser makes the QR code from that URL. Elia creates the
project in the Vercel dashboard once the folder is on GitHub.
