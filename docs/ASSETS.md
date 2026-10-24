# Asset and component provenance

- Pixel movement characters, movement stage, spark mark and application icon:
  original SVG artwork created for Move Along; no third-party character assets.
- 8bitcn/ui Button, Card, Badge, Progress and retro CSS: installed using
  `npx shadcn@latest add @8bitcn/button @8bitcn/card @8bitcn/badge @8bitcn/progress`.
  Source: https://github.com/TheOrcDev/8bitcn-ui. MIT notice: licenses/8bitcn-MIT.md.
- Local modifications: self-hosted pixel font, component import correction to the
  configured utils alias, card props removed before DOM spread, touch target sizes.
- shadcn/ui primitives: installed through its CLI, https://ui.shadcn.com, MIT.
- Geist and Press Start 2P: next/font, self-hosted at build. Google Fonts families
  are distributed under SIL Open Font License; upstream notices are bundled here.
- lucide-react: ISC licensed icons supplied through the requested component stack.
- No music, camera frames, generated body images or parent-project media copied.

The app has no runtime dependency on the 8bitcn documentation website.

## Phase 2 tracking

- `@mediapipe/tasks-vision` is pinned to 1.1.1. Its JS/WASM files are copied from
  node_modules into public/mediapipe by scripts/setup-mediapipe.mjs.
- PoseLandmarker lite float16 model, version 1: Google's official model asset.
  Its URL and verified SHA-256 are recorded in public/mediapipe/assets.json.
- MediaPipe/model distribution notice: licenses/MediaPipe-Apache-2.0.txt.
- Framing-guide SVG is original, illustrative artwork. The live canvas draws only
  numeric pose landmarks over a separate native video element.
- Source reuse paths and hashes are recorded in SOURCE_REUSE.md.

## Push-up soundtrack and reference code (2026-10-24)

The user explicitly requested reuse of the existing Pushbeat Shakira track.
`public/audio/pushup-shakira.mp3` is a byte-for-byte local copy of the parent's
owner-supplied `public/audio/song-1.mp3` (178-second edit of “Hips Don't Lie”,
Shakira feat. Wyclef Jean). No music was downloaded. The parent metadata says
“Pending owner confirmation” for license. The owner explicitly requested the supplied file be included with application
assets so soundtrack selection works in reproducible builds; it is no longer
ignored by Git. Redistribution clearance remains unverified; no public release
was performed in this task. The song chooser
loads the selected same-origin asset and displays an explicit retry/fallback error if absent.

`public/audio/dev-click.wav` is the existing original generated development
click track, copied from Pushbeat. It is the distributable fallback. Both playable
maps use Move Along's slower spacing and actual rest windows; the commercial
track's analyzed 100.27013 BPM and 85.006 ms grid origin were reused. Maps need
human listening review before a synchronization gate can be marked passed.
