# ESN Stuff

Websites and small tools made for **ESN Bologna** events.

Each project lives in its own folder and is deployed separately on Vercel.

## Projects

| Folder | What it is | Status |
| --- | --- | --- |
| [`crime-night/`](crime-night/) | ESN Crime Night: detective game web app for the Tandem Night at the Cluricaune Irish Pub | Live: https://esnstuff-crime-night.vercel.app |

## Deploying a project on Vercel

This repo is a monorepo, so each project needs **its own Vercel project** pointed at its folder:

1. Vercel dashboard → **Add New… → Project** → import `fri3erg/ESN_Stuff` from GitHub.
2. Set **Root Directory** to the project folder (e.g. `crime-night`).
3. Framework preset: **Other** (unless that project's README says otherwise). Leave the build command empty for static sites.
4. Deploy. Every push to `main` that touches the folder redeploys it.

Optional: under the project's *Settings → Git → Ignored Build Step*, use
`git diff --quiet HEAD^ HEAD -- .` so a project only rebuilds when its own folder changes.

## Adding a new project

1. Create a new folder at the root with a short kebab-case name.
2. Add a `README.md` inside it (what it is, the event, how to run it, how to deploy it).
3. Add a row to the table above.
4. Create a new Vercel project for it (see above).
