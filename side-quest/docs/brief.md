# Side Quest — build brief

Build a small static website for a party game called **Side Quest**. This document is the full spec: read it end to end before writing code. Where it is silent, pick the simplest option and keep going.

## 1. Context

- Event: an Erasmus night at a pub, about 500 international students, mostly standing outside the pub, in the dark, in a crowd, on phones with poor signal and one hand free.
- Game: each person scans a QR code at the entrance, gets one random "side quest" (a small social challenge involving other people at the party), does it, then finds a **volunteer** and shows proof. The volunteer gives them a **candy**. That is the whole reward. There is no draw, no free drink, no leaderboard.
- Volunteers judge by eye. There is no verification step in the app (no PIN, no code, no stamp). The completion screen simply tells the player to go to a volunteer.
- The site is English only. Audience: young, international, many non-native English speakers, so keep sentences short and plain.

## 2. Hard constraints

- **Frontend only. No backend**, no database, no API routes, no serverless functions, no accounts, no analytics, no cookies, no third-party requests (no CDN fonts, no tracking). Everything needed must ship with the page.
- Deploy target: **Vercel, as a static site**. No environment variables.
- All state lives in the phone's `localStorage`. If `localStorage` throws (private mode), the app must still work for the current session with in-memory state, and must not crash.
- Mobile first. Must work at 360 px width, no horizontal scroll, tap targets at least 48 px, body text at least 18 px. One-handed use.
- Fast and light: aim for a single HTML request with inlined CSS and JS, under about 100 KB total. A plain HTML/CSS/JS page or a Vite vanilla build is fine. No framework needed.
- Must work well in the dark and outdoors: use a **dark theme with high contrast**.
- Respect `prefers-reduced-motion` (reduce decorative animation; the live clock on the completion screen still updates).

## 3. User flow

One page, three states. No router needed.

### State A — Welcome (first visit only)
- Title: **Side Quest**.
- Three short rules:
  1. Get your quest.
  2. Do it with other people at the party.
  3. Done? Find a volunteer, show them, get a candy.
- A safety/consent line, clearly visible: *"If someone says no, say thanks and move on. Only film or photograph people who are OK with it."*
- Big button: **Get my quest**.

Pressing it picks one mission uniformly at random from the list in section 5 (use `crypto.getRandomValues` if available, else `Math.random`), stores it, and moves to State B.

### State B — Your quest (assigned, not completed)
- The mission is **hidden by default** behind a large tap target ("Tap to reveal your quest") so people standing nearby cannot read it. After revealing, it **auto-hides after 10 seconds** and also has a **Hide** button.
- When revealed, show: the mission text in large type, and a **proof badge** with an icon and a one-line instruction for what to show a volunteer (see section 5). Example: "Proof: show a video".
- Button: **I did it**.
- Secondary button: **Swap quest**. It may be used **once per phone**; after use it disappears. Swapping picks a different mission than the current one. This exists for quests that are impossible tonight.
- Persist everything: reloading the page must show the same quest and the same hidden/revealed rule (revealed state itself does not need to persist; always start hidden).

### State C — Quest complete
- Shown after **I did it**. Persisted: reloading keeps the player here.
- Content, large and clear: **"Quest complete! Go find a volunteer."**
- Under it, show the quest text and the proof badge again, so the volunteer sees what was claimed and what to check.
- Include a **live element so a screenshot is not a convincing proof**: a ticking clock (HH:MM:SS) plus a slowly moving gradient or similar animation, and a "Completed at HH:MM" line fixed at the completion time. State honestly in code comments that this deters casual screenshots but cannot stop a determined cheater; the stakes are one candy.
- No further buttons are required. One quest per phone is the intended rule. (Optional, tiny, low priority: a text line "One quest per person tonight".)

## 4. State and storage

Single `localStorage` key, for example `sidequest.v1`, holding JSON like:

```json
{ "missionId": 12, "status": "assigned", "swapsUsed": 0, "completedAt": null }
```

- `status` is `"assigned"` or `"completed"`.
- `completedAt` is an ISO timestamp set when the player presses **I did it**.
- A missing key means State A. Guard against corrupted JSON by treating it as missing.
- Provide `?reset=1` in the URL to clear the state, for testing and for the organiser's own phone. It is intentionally unprotected (one candy at stake); no need to hide it.

## 5. The missions

20 missions. Proof types:

| Type | Icon idea | Player instruction |
|---|---|---|
| `live` | hand / sparkle | "Proof: do it live in front of a volunteer" |
| `photo` | camera | "Proof: show a volunteer the photo" |
| `video` | video camera | "Proof: show a volunteer the video" |
| `phone` | phone | "Proof: show a volunteer on your phone" |
| `tell` | speech bubble | "Proof: tell a volunteer what happened" |

A mission may override the instruction with `proofNote`.

```json
[
  { "id": 1,  "proof": "live",  "text": "Swap a piece of clothing (hoodie, hat, scarf) with a stranger.", "proofNote": "Proof: wear it and show a volunteer" },
  { "id": 2,  "proof": "tell",  "text": "Get a sip of someone's drink you don't know." },
  { "id": 3,  "proof": "phone", "text": "Get two strangers who don't know each other to exchange Instagram.", "proofNote": "Proof: show the new follow or chat on your phone" },
  { "id": 4,  "proof": "video", "text": "Get someone to teach you a dance move and dance it together." },
  { "id": 5,  "proof": "live",  "text": "Get a stranger to draw a small fake tattoo on your hand with a pen.", "proofNote": "Proof: show the tattoo to a volunteer" },
  { "id": 6,  "proof": "photo", "text": "Get two separate groups of strangers to toast all together." },
  { "id": 7,  "proof": "tell",  "text": "Have a whole conversation with a stranger, each of you speaking only your own language, trying to understand each other." },
  { "id": 8,  "proof": "photo", "text": "Set up a swap between your group and a group of strangers: send one of your friends over to them, and get one of them sent over to you." },
  { "id": 9,  "proof": "tell",  "text": "Get a stranger to tell you a story — true or made up on the spot — behind a tattoo, scar, or item they're wearing: at the end you have to guess whether it was true or false, and get it right." },
  { "id": 10, "proof": "tell",  "text": "Get someone to tell you a secret they've never told a stranger before.", "proofNote": "Proof: tell a volunteer who it was, not the secret" },
  { "id": 11, "proof": "phone", "text": "Get a small group of strangers to record AND actually send a video message together for a friend of yours who isn't here tonight.", "proofNote": "Proof: show the sent message on your phone" },
  { "id": 12, "proof": "video", "text": "Get a group of at least 3 strangers to sing a song of your choice with you, and get someone to film it." },
  { "id": 13, "proof": "photo", "text": "Organize a group photo with at least 5 strangers who don't know each other, and get it sent to you." },
  { "id": 14, "proof": "video", "text": "Set up a mini a cappella karaoke battle with a stranger: take turns singing a verse each of the same song, no music." },
  { "id": 15, "proof": "live",  "text": "Invent a secret handshake with a stranger, on the spot, with at least 3 different moves, and lock it in together.", "proofNote": "Proof: show the handshake to a volunteer" },
  { "id": 16, "proof": "tell",  "text": "Try to guess where a stranger is from and what they study: you only get 3 guesses in total." },
  { "id": 17, "proof": "video", "text": "Challenge a stranger to a staring contest: whoever laughs or blinks first buys the next round (non-alcoholic is fine too)." },
  { "id": 18, "proof": "live",  "text": "Get someone to teach you a small good-luck ritual from their country, and do it together before the next toast.", "proofNote": "Proof: show the ritual to a volunteer" },
  { "id": 19, "proof": "live",  "text": "Get a stranger to teach you a full sentence (not just a word) in their language, then use it with a different third person and make yourself understood.", "proofNote": "Proof: say the sentence to a volunteer" },
  { "id": 20, "proof": "video", "text": "Create a dance combo with a stranger, just the two of you." }
]
```

Keep the mission data in one file or one constant, separate from the rendering code, so the organiser can edit wording without touching logic.

## 6. Look and feel

- Playful quest/game tone (think "Quest accepted", "Quest complete") but clean, not cluttered. Large type, generous spacing, one primary action per screen.
- Dark background, bright accent colour for the primary button and the proof badge. Make sure text contrast is at least WCAG AA.
- System font stack is fine (no web fonts). Emoji or simple inline SVG for icons.
- Page `<title>` "Side Quest". Add a viewport meta tag, a `theme-color`, and a simple favicon (inline SVG data URI is fine).
- Optional and low priority: a web manifest and a tiny service worker so the page keeps working offline after the first load. Skip it if it complicates the build.

## 7. Out of scope

Backend of any kind, the free-drink draw, verification codes or PINs, accounts, analytics, admin pages, multiple languages, uploading photos or videos, leaderboards. If something here seems missing, it is on purpose.

## 8. Acceptance checks

Verify these manually (and with simple automated tests where cheap, for example for the state logic):

1. First visit shows the welcome screen; **Get my quest** assigns a mission and shows it hidden.
2. Reloading keeps the same quest. Revealing works and auto-hides after 10 seconds.
3. **Swap quest** works once, gives a different mission, then disappears.
4. **I did it** moves to the completion screen; reloading stays there; the clock ticks.
5. `?reset=1` returns to the welcome screen.
6. With `localStorage` disabled, the flow still works for the session and nothing throws.
7. No horizontal scroll at 360 px; tap targets at least 48 px; no network requests to other origins (check the network tab).
8. Over a few hundred random assignments every one of the 20 missions appears.
9. Lighthouse mobile: no accessibility errors for contrast or tap-target size.

## 9. Deploy

Static output deployed to Vercel (CLI or git integration). No build-time secrets, no env vars. The organiser will generate the QR code from the final URL; the QR is not part of this site.
