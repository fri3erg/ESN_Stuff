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
