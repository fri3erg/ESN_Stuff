# ESN Crime Night 🔍

Web app for **ESN Crime Night**, a detective social game at the ESN Bologna Tandem Night
at the **Cluricaune Irish Pub** (~400–500 Erasmus students).

The crime is just an excuse. The real mission is meeting new people.

Website by **Elia**.

## How the game works

- Four fictional crimes have hit ESN. The 9 suspects are all ESN volunteers:
  Sissi, Roberta, Elia, Francesco, Mary, Vincenzo, Andrea, Davide, Leo.
- Each case has 5 clues (**A–E**). Every clue clears one or two suspects.
- Every player gets **one clue per case**. To solve a case you need to find people with the other clues,
  so you have to talk to strangers.
- Cases 01 and 02 have one culprit. Cases 03 and 04 have two accomplices.
- Play solo or in a team, start any time, solve one case or all four.
- **Locking in answers happens in person:** players find an ESN volunteer, show their verdict screen
  and win a prize. Solutions are *not* in the website. Volunteers get them separately.

## What the website does

The website **replaces the paper cards**. The printed paper only carries a QR code to the site.

1. **Name:** the player enters their name. The name is normalised (lowercase, trimmed, spaces collapsed,
   accents stripped) and hashed to pick one clue per case. The same name always gets the same clues,
   so re-entering it doesn't give new ones. Clues are spread evenly across A–E.
2. **Clues:** the player's 4 private clues, each with a **code word** to read to other players.
3. **Cases:** the 4 crime files. Typing a code word you heard unlocks that clue and crosses off the suspects
   it clears. Each case ends with **Make accusation**, a verdict card shown to a volunteer to claim the prize.
4. **Suspects:** the 9 volunteers with photos.
5. **Rules:** how to play, plus the credits.

Full design: [docs/specs/2026-10-08-crime-night-design.md](docs/specs/2026-10-08-crime-night-design.md).

Languages: English (default), Italiano, Español.

## Tech

Plain static site with no build step: HTML + CSS + vanilla JS, with state in `localStorage`.
No backend. It's kept tiny so it loads instantly on crowded pub mobile data.

Planned structure:

```
crime-night/
├── index.html
├── styles.css
├── app.js
├── data/        # cases, clues, translations
└── img/         # suspect photos
```

## Run locally

Any static server works, e.g. from this folder:

```
npx serve .
```

or `python -m http.server 8000`.

## Deploy

Vercel project with **Root Directory = `crime-night`**, framework preset **Other**, no build command.
See the [root README](../README.md#deploying-a-project-on-vercel).

## Content still needed

- [ ] Photos of the 9 suspects (+ Aitor, the "missing" VP, optional)
- [ ] Confirm Case 04: the brief says to tell the thief from the camera hacker, but no clue does that
      (all clues only clear people). Add a 6th clue or drop that part.
- [ ] Event date/time for the page
