# Move Along

**A little movement. A lot more play.**

## Inspiration

People say AI will end humanity within 20-30 years. Instead of using AI for
destruction, I wanted to use code for wellness and fitness. So I built an app that
gets people to exercise through a game.

Since it's a game, it has a reward system that keeps the player motivated. You get
to play and take care of your body at the same time.

## What it does

Pick a movement, press play, and do your reps. Two rings tell you DOWN or UP.
Nothing leaves your device: no account, no upload, no saved video.

## How we built it

Next.js 16, React 19, TypeScript, and Tailwind v4. Pose tracking runs locally with
MediaPipe in a Web Worker.

We take the camera feed, calibrate, and track head and shoulder movement. Every
time the head completes a move, it counts as one point. A small reward system sits
on top, inspired by game libraries. We used an 8-bit style for the UI so it looks
appealing and not like AI slop.

## Challenges we ran into

The hardest part was calibrating whether the user is standing, sitting, or doing
push-ups. Getting the input from the device, going full screen, and adding the data
points were also tough. We used a machine learning model to recognize the head,
shoulders, and other body points.

## Accomplishments that we're proud of

A fully working two-exercise routine app. You can play a song in the background and
exercise to its rhythm.

## What we learned

Tracking is easy to show and hard to trust. Calibration is part of the product. Say
less.

## What's next for Move Along

More routines and multiplayer, so two people can do it *along* together and
challenge each other to a battle.

## AI Tools & Disclosure

We used OpenCode with the DeepSeek R1 model as an AI-assisted coding tool during
development. It helped with code generation, debugging, and implementation. The
project was built, integrated, and tested during CodeFest 2026.

## Run

Use Node 24 (`.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

Installation runs `setup:mediapipe`: it copies the pinned package's JS/WASM and
checks the lite model checksum. A missing model is downloaded once from Google's
official model host during setup. Browser sessions load only local static assets.
Run `npm run setup:mediapipe` to repair missing assets.

Open http://localhost:3000. To serve the production build, run `npm run build`
then `npm start`. No environment variables are needed by application code.

## Checks

```sh
npm run typecheck
npm run lint
npm run test
npm run mapgen:validate
npm run build
```

The same checks are configured in `.github/workflows/checks.yml`.

## Project

- `plan.md`: complete product scope and sequential execution gates.
- `BUILD_PROMPT.md` and `AGENTS.md`: current project instructions.
- `docs/PROGRESS.md`: checks and browser verification evidence.
- `docs/DESIGN.md`: the selected visual direction.
- `docs/ASSETS.md`: component, artwork and font provenance.
- `components/screens/`: current interface flow.
- `components/ui/8bit/`: installed retro components.
- `lib/shared/`: central config, types and navigation reducer.
- `data/catalog.ts`: movement content and routine definitions.

## Licensing

Third-party notices are in `docs/licenses/`. The application owner has not chosen
a license for original project code. The owner-requested Shakira track is copied locally as `public/audio/pushup-shakira.mp3`
and included with application assets at the owner’s request. Redistribution
clearance remains unverified; this task does not publish a release. `public/audio/dev-click.wav` is the original fallback.
Soundtrack selection stays on the Play screen. Failed loads offer Retry sound
or the original practice beat, with no additional navigation. See `docs/ASSETS.md`.
