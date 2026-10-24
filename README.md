# Move Along

Learn a movement, make it yours, and play it to the beat.

A camera-controlled movement game with guided learning, personal calibration and
short routines. The interface uses the owner-selected [8bitcn/ui](https://www.8bitcn.com)
components, original pixel movement artwork and self-hosted fonts.




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

The same checks are configured in `.github/workflows/checks.yml`. The workflow
has not been run remotely for these unpushed changes.

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



## Repository and deployment

This directory is an independent repository with origin
https://github.com/mauliciousware/move_along. Run all commands inside this folder.
The parent Pushbeat project is a reference, not the active app.

Import this repository into a compatible Next.js host for HTTPS phone testing.
The playable push-up changes are local and have not been pushed or deployed by this task.

## Licensing

Third-party notices are in `docs/licenses/`. The application owner has not chosen
a license for original project code. The owner-requested Shakira track is copied locally as `public/audio/pushup-shakira.mp3`
and ignored by Git. Redistribution clearance remains unverified, so it is not
included in deployment. `public/audio/dev-click.wav` is the original fallback.
A missing soundtrack is disabled in the chooser. See `docs/ASSETS.md`.
