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

## Push-up-first playable slice — 2026-10-24

The owner requested a complete push-up game, reusing Pushbeat components,
mechanics and the existing Shakira song. This explicitly changes the squat-first
implementation sequence. No outstanding physical-device gate is marked passed.

Implemented `/pushup` and a direct homepage entry: introduction → session safety
→ track selection → camera permission/framing → hands-free calibration → two
untimed practice pairs → audio-clock countdown → fixed-target rhythm game →
transient actual results. The push-up Learn page also enters this route. Other
exercise screens remain previews; this is a complete single-exercise slice.

Ported the original movement detector, calibration state machine, audio transport,
judgment, scoring, combo tiers, current-cue-only guidance, early arrival treatment,
holds, rests, particles, feedback and results. Source hashes are recorded in
SOURCE_REUSE.md. Setup and modal controls use existing 8bitcn/shadcn components.
No new dependencies. The shared Phase 2 camera engine is used through a compact
push-up adapter; it is not replaced by the older worker. No frames are stored.

Differences made deliberately: comfortable calibration language; no calorie
claims; contain projection; immediate STOP; stable readiness; two-pair practice;
explicit readiness after sustained tracking loss; stale signals cannot score;
camera interruption/rotation requires setup and recalibration. Song pause parks
its AudioBufferSource and freezes song time while the shared AudioContext can
play calibration cues. User-triggered resume unlocks audio before countdown;
recreated sources resume at the saved offset. Rest does not count movements.

Local Shakira audio is present, ignored by Git, and not published. The original
click track is the fallback. Both maps enforce at least 2 seconds between phase
cues, holds as work, 30-second maximum work stretches and 15-second rests. They
are regenerated from central config with `npm run mapgen:pushup`; validation runs
in CI. The original dev-map fixture remains only for ported regression tests.

Verification so far: 144 unit tests passed across 17 files, including adapter
invalidation, movement noise/rearm, calibration retry, timing boundary grades,
score/rank/hold math, audio pause offset, lifecycle, and full deterministic
all-PERFECT simulations of both new maps. Typecheck and lint passed. Production
build succeeded with `/pushup` statically prerendered. Final verification follows.

Browser observations: fresh-session safety shown; Shakira loaded/decoded and
countdown reached gameplay; keyboard practice required two actual timestamped
pairs; gameplay counted a pair; STOP produced actual partial results. After
clearing stale generated `.next/dev` CSS, 390px portrait arena measured 355px wide
with no horizontal overflow and STOP 68×56px above the fold. The connected local
camera reported ~29Hz, ~11.7ms GPU inference, ~120 draw FPS, ~1 React render/sec,
zero external asset requests. This is local Mac evidence, not physical iPhone QA.
Camera views were checked with text only. A separate keyboard-only QA tab was
used for visual inspection; camera was never enabled in that tab.

Pending: physical iPhone Safari camera-to-calibration-to-game movement trials,
10 real push-ups ±1, rotation/background/recovery/thermal performance on that
phone, audio/beat alignment by ear, and HTTPS deployment network audit. No GitHub
push or deployment was performed in this slice.

## Typography alignment — 2026-10-24

Owner reported calibration working and requested consistent 8bitcn typography.
The push-up experience and its portaled pause dialog now use the existing
self-hosted Press Start 2P font, including navigation, setup, controls, song HUD,
results and canvas labels. Removed the canvas's hard-coded sans-serif/italic
fonts and obsolete font variable. Pixel text is fitted by font size to target
width, preserving glyph proportions; concise target labels avoid overflow.
The main app wordmark uses the same pixel typeface. Canvas font styles are read
once on setup, with no per-frame style reads or React updates.

Checked the intro and camera-free keyboard gameplay at 390px: loaded pixel family
confirmed on wordmark, heading, controls and canvas; no horizontal overflow;
UP/DOWN, prompt, countdown and HUD visibly match. Pause actions also inherit the
pixel typeface. No camera was enabled or captured in this typography QA session.
Typecheck, lint, 144 tests and production build passed before final CSS cleanup;
final checks are recorded below.

Final typography checks: typecheck, lint, all 144 tests and production build pass; diff whitespace check clean.

## Safari/setup and individual exercise completion — 2026-10-24

Continued the existing uncommitted implementation, without accessing the parent
working tree. Repaired missing result-analysis code and standing calibration type
errors. Automatic framing, calibration and practice progression now connect all
three exercise modes. Standing calibration checks two repeated cycles. Added
finite/stale input guards for marching, exercise-specific result labels, explicit
accuracy/coverage maths and an illustrative movement review (not posture scoring).
Typography now follows the main app: pixel headings and readable Geist copy.
Song selection activates the shared AudioContext in the tap handler and reports
load errors; STOP invalidates pending transport start/resume. Existing local
Shakira asset remains available for local testing. No new dependencies.

Typecheck, 155 tests and build passed. Lint passed with one existing unused begin
warning, to be removed when reconnecting routine selection. Tests now simulate
complete maps for push-ups, squats and marching with holds where supported.
The owner says Safari works with some bugs and explicitly deferred device testing.
No physical calibration, observed ten-rep test or listening/sync gate is claimed.

## Direct exercise flow — 2026-10-24

The owner superseded the routine UI and requested fewer pages. Home now contains
only Squats, Knee raises and Push-ups, with no hero illustration, navigation menu,
How to play, routine chooser or movement library. Each choice opens one Play
screen with a compact soundtrack selector, defaulting to Shakira. Play unlocks
audio and requests the camera in the gesture handler, then enters automatic
framing/calibration. Calibration goes directly into the countdown/game; standalone
safety, Learn, camera setup, song chooser and practice screens are no longer in
the active flow. A brief stop/rest reminder remains inline. Old routine URLs
redirect home. In-song work/rest limits and STOP/partial results remain intact.
Results have two actions: All movements and Play again (fresh calibration).

The supplied Shakira MP3 was excluded by .gitignore, so clean repository builds
could not include it. At the owner's explicit repeated request the supplied file
is now included in application assets; provenance/clearance status remains in
ASSETS.md. No track was downloaded or publicly deployed. Asset tests verify both
selectable soundtracks exist and have audio headers. Music fetch AND decoding
have a bounded timeout, with inline retry or practice-beat recovery. No new
dependencies. Only derived calibration is persisted; results remain in memory.

Local production browser observations (camera-free except a pending camera
permission request, checked through text only): all three exercise screens show
one Play action and a compact selector; Play enters automatic calibration without
interstitial pages; STOP during pending permission reaches zero-count partial
results. The Shakira keyboard demo loads/decodes, schedules the game countdown,
and pause/resume uses the reentry countdown. Gameplay STOP reaches partial maths
and movement review. No camera screenshots or recordings were made. The home
screen was visually inspected with camera off.

Typecheck, lint (no warnings), 163 tests, all 15 map checks and production build
pass; final layout verification follows. Physical iPhone exercise trials, full-song
listening/sync, rotation/background/thermal validation remain deferred at the
owner's request. This is a local implementation, not a deployed Safari sign-off.

## Main/Vercel packaging verification — 2026-10-24

Owner requested the song and shortened flow be ready for their push to main.
Added `prebuild → check:audio` so the normal `npm run build` fails if either
selectable soundtrack is missing or is not an audio file. The 3,239,544-byte
Shakira MP3 is included under public/audio, not excluded by Git. Production HTTP
verification returned 200 and audio/mpeg; the served file's SHA-256 matched the
packaged MP3 exactly. Same-origin paths work on the deployed HTTPS origin without
localhost references in application code. No dependencies were added.

Final checks: typecheck, lint without warnings, all 163 tests, all 15 map checks,
the prebuild audio check and production build pass. The simplified homepage and
all three movement routes are included. Prepare one local main commit containing
the flow and MP3; the owner will push/deploy. No remote deployment or physical
mobile playback is claimed. Physical iPhone QA remains deferred by the owner.
