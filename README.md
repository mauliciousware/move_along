# Move Along

A camera-controlled movement game with short routines, exercise teaching,
personal calibration, and rhythm feedback. Camera tracking is intended to run
locally in the browser — no accounts, uploads, or stored camera frames.

**Status: Phase 0 scaffold.** Only the app shell and landing page exist. There is
no camera tracking, calibration, routine flow, audio, or gameplay yet. The
product and execution plan is in [`plan.md`](./plan.md).

## Stack

- Next.js 16 (App Router) with Turbopack
- React 19
- TypeScript, strict
- Tailwind CSS 4
- Vitest 5

## Requirements

- Node.js 24 LTS (`.nvmrc` is included)
- npm

## Run locally

```sh
npm install
npm run dev
```

Open <http://localhost:3000>.

## Checks

Run all four before committing:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

`npm start` serves the production build.

## Project structure

```text
app/                 App shell, landing page and global styles
lib/shared/          Product constants (gameplay config will live here)
public/              Static assets
plan.md              Product, safety and execution plan
```

## Deploy to Vercel

The project builds with the default Next.js settings and needs no environment
variables.

1. Create the GitHub repository and push `main`.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected **Next.js** framework preset, leave the root directory as
   the repository root, and deploy.

Vercel serves the app over HTTPS. That matters later: browsers only allow camera
access on secure origins (`localhost` or HTTPS).

## Putting this folder on GitHub

This folder lives inside the existing Pushbeat working tree, so it needs its own
repository before anything is staged:

```sh
cd move_along
git init -b main
git add .
git commit -m "chore: scaffold Move Along Next.js app"
gh repo create mauliciousware/move-along --public --source=. --remote=origin --push
```

Without `git init`, `git add .` stages into Pushbeat instead of a new repository.

## Privacy intent

The release is designed to process camera frames locally and make no network
requests beyond its own static assets. Nothing is implemented yet, and no
analytics, accounts, or persistence exist in this scaffold.

## License

No license has been chosen yet. The repository is public, so a license decision
should be made before release.
