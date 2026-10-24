# Build progress

## Phase 0 — Pass, 2026-10-24

- Existing independent Git repository inspected; origin is mauliciousware/move_along.
- Owner selected Move Along and the 8bitcn/ui visual direction.
- Added the complete local plan, BUILD_PROMPT, project instructions and design notes.
- Typecheck, lint, both existing tests and production build pass on the scaffold.
- No camera processing or gameplay is claimed at this checkpoint.
- No parent project files or environment variables were accessed or changed.

## Dependency justification

8bitcn/ui and its shadcn/Radix primitives are explicitly requested by the owner.
The registry installs class-variance-authority, the cn helper, Radix,
lucide-react and styling utilities to support accessible component composition.
Registry source is reviewed; runtime external Google Font imports are replaced
with next/font self-hosting. Third-party code keeps MIT attribution.

## Phase 1 — Pass, 2026-10-24

- Installed actual 8bitcn Button, Card, Badge and Progress using the shadcn CLI,
  with shadcn Dialog, Alert and Separator primitives.
- Reviewed the added sources. Replaced external font CSS with next/font; normalized
  utility imports; prevented the card font prop reaching DOM elements; increased
  buttons to 64px primary and 56px secondary/control minimum heights.
- Connected landing, safety, routines, routine preview, movement library, How to
  play, Learn, camera placement, calibration preview, practice, countdown, gameplay
  layout, rest, results and an accessible Radix pause dialog.
- Full-body/standing/single-exercise flows share an explicit reducer. STOP reaches
  early-ended results from every active screen. Safety returns library users to
  their selected setup. Skip routes through rest or results.
- Added original SVG squat, march and push-up artwork and application identity.
- All typecheck/lint/test/build checks pass. Fifteen tests cover all routine routes,
  STOP exits, safety return destination, skip and recalibration.
- Browser walkthrough: landing → safety → Full-body Mix preview → Learn → camera
  setup → three calibration screens → practice → countdown → game layout → pause
  → Skip → rest → knee-raise Learn → STOP → results. Library and How to play also
  inspected. Heading focus follows screen changes; pause has a named dialog.
- Repeat Start in the same session bypasses the acknowledged safety screen.
- Inspected desktop 1440×900 and portrait 390×844 layouts in the in-app browser.
  Document widths were 1425 and 375px respectively (scrollbar space excluded):
  no horizontal overflow. Primary buttons measured 64px; secondary controls 56px.
  Fixed cover illustrations not stretching across registry card headers and
  oversized characters overlapping the stage caption at intermediate widths.
- Browser warning/error log was empty after the walkthrough.
- Source audit: no external runtime font imports, fetches, localStorage, analytics,
  camera access or score persistence. Only the safety flag uses sessionStorage.
  This is source evidence, not a completed deployed Network-panel audit.
- Saved interface screenshots under docs/screenshots. No camera images were taken.
- Added GitHub Actions checks; remote CI is not claimed as run. Changes are local.
- Phase 2 camera/pose and physical-device tracking gates have not started. This
  preview has no measured calibration, movement input, audio clock or scored play.


## Phase 2 — Implementation complete; iPhone gate pending, 2026-10-24

Owner priority: mobile portrait first, specifically iPhone Safari. This remains a
web app; no native wrapper, PWA installation or service worker was added.

Implemented:

- Dynamic client-only camera setup and native muted/playsInline video. Portrait
  layout keeps a 64px primary action and 56px STOP/control targets accessible.
  Video uses contain projection so the source is not cropped to fill the view.
- Pinned MediaPipe tasks-vision 1.1.1, self-hosted JS/WASM and verified lite model.
  setup:mediapipe/postinstall supports clean installs; assets.json records hashes.
- One worker, GPU initialization/runtime CPU fallback, at most one bitmap in
  flight and a rolling cap of 30 inference requests per second. Transient frames
  are disposed and never encoded, recorded, uploaded or persisted by the app.
- Full-body numeric landmark subset with smoothing and exercise-aware visibility:
  squats/marching require head, shoulders, hips, knees, ankles and feet; push-ups
  require the selected upper-body landmarks. Low-confidence points are suppressed.
- Immediate unusable-frame suppression, debounced framing messages, sustained-loss
  state and one-second stable recovery. Readiness does not diagnose form or health.
- Single high-frequency canvas for markers, with On/Minimal/Off controls and a
  shared uncropped/mirrored projection. Reusable render buffers avoid per-frame
  coordinate allocations. No per-frame React state.
- Camera switching, actual facing-mode checks, explicit resume after background,
  orientation, manual pause or track interruption. STOP/unmount releases the stream,
  worker, pending initialization, animation callbacks and observer. Late permission
  results and detached-video replies cannot reopen or update an ended session.
- Same-origin CSP for production connections/assets, local fonts, microphone and
  geolocation disabled through Permissions-Policy. Development websocket/eval
  allowances remain limited to the development configuration.
- Optional ?dev=1 text diagnostics update directly in the DOM; only performance,
  tracking state and asset-origin counts are displayed.

Verification:

- Clean npm ci passes, including checksum-verified self-hosted asset setup.
- npm run typecheck, npm run lint, npm run test and npm run build pass.
- 45 tests in six files cover full routine navigation plus framing, confidence,
  presence, contain/mirror coordinates, smoothing, 30Hz throttle, timed loss and
  recovery, initialization/runtime fallback, cleanup, late permission, denied and
  insecure access, initialization timeout, camera switching, stale replies and
  stable status-only React notifications.
- In-app browser, actual local camera: development GPU run measured 28.8–29.0 pose
  Hz, roughly 9.6–10.6ms average inference, 120 render FPS on this Mac display,
  0.0 steady React updates/sec and zero external assets in worker diagnostics.
- Production build also initialized GPU inference under the production CSP:
  measured about 29 pose Hz, 11.5–12.3ms inference, 120 render FPS, 0.0 steady React
  updates/sec and zero external resource requests in page+worker diagnostics.
- Live status moved through insufficient upper-body/feet visibility and eventually
  “You’re in the frame.” This verifies the live readiness route; visual alignment,
  motion quality and occlusion behavior on an iPhone remain unverified.
- Pause cleared video.srcObject and paused the video. Closing pause left Resume
  camera visible rather than restarting. STOP removed all video elements. A separate
  pending permission request was cancelled through STOP without trapping navigation.
- Marker toggle controls changed selected states in the production browser.
- Portrait UI checked at 390×844; primary camera action was above the fold. A
  text-only 320×568 measurement placed the primary button at y=492–556, height
  64px, with document width 305px inside a 320px viewport (scrollbar excluded).
- Initial clean-install activity briefly caused the running dev server to report
  missing packages while npm replaced node_modules; clearing the generated
  .next/dev cache and restarting after installation resolved it. No new warning/error logs appeared during the final production run.
- One layout screenshot unintentionally captured live video after the camera was
  enabled during the check. It was not saved to a project file or reused. All
  subsequent camera verification used text only. No Phase 2 screenshots are stored.

Outstanding gate items:

- Physical iPhone Safari: landmark alignment, full-body framing, lens occlusion and
  recovery, camera switching, rotation, background/lock/resume, thermal behavior and
  sustained performance. No iPhone results are inferred from viewport emulation.
- Deployed HTTPS Network-panel audit. Local resource diagnostics and CSP are
  evidence, not a claim that the Safari Network-panel check has been performed.
- Real CPU delegate performance on the target phone; fallback logic has unit tests.

Follow docs/PHONE_QA.md on an HTTPS build containing these changes. Changes remain
local and have not been pushed/deployed by this task. Phase 3 is not started;
calibration, movement counting, audio and scoring remain explicit previews.
