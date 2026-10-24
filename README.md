# Move Along

Learn a movement, make it yours, and play it to the beat.

A camera-controlled movement game with guided learning, personal calibration and
short routines. The interface uses the owner-selected [8bitcn/ui](https://www.8bitcn.com)
components, original pixel movement artwork and self-hosted fonts.

## Current milestone

**Phase 1: navigable interface preview.** Landing, safety acknowledgement, routine
selection, movement library, Learn, camera setup, calibration, practice, countdown,
game layout, rest, pause and results are connected. Camera processing, movement
measurement, audio and scoring are not active yet. Every relevant screen labels
this limitation; the preview does not invent workout results.

Choose **Let’s move** to walk through a routine, or **The moves** to explore the
three planned exercise modes: squats, knee raises and push-ups.

## Run

Use Node 24 (`.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. To serve the production build, run `npm run build`
then `npm start`. No environment variables are needed by application code.

## Checks

```sh
npm run typecheck
npm run lint
npm run test
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

## Next milestone

Phase 2 adds self-hosted MediaPipe lite, worker inference, the local camera feed,
exercise-specific visibility checks and measured tracking performance. It has not
started. Later phases connect calibration, movement detectors and rhythm gameplay.

## Privacy and scope

Currently only the safety acknowledgement is stored in sessionStorage. There is
no camera permission request, recording, upload, analytics or score storage. Fonts
and UI assets are served locally. Future inference must process frames locally
without saving them. The app provides game feedback, not posture diagnoses,
medical assessments or predictions of a future body.

## Repository and deployment

This directory is an independent repository with origin
https://github.com/mauliciousware/move_along. Run all commands inside this folder.
The parent Pushbeat project is a reference, not the active app.

Import this repository into a compatible Next.js host for HTTPS phone testing.
No new deployment or remote push was performed during Phase 1.

## Licensing

Third-party notices are in `docs/licenses/`. The application owner has not chosen
a license for original project code. No commercial audio was copied into this app.
