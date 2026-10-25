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

## Self-paced push-up flow and portrait camera — 2026-10-24

Owner feedback: the push-up loop was too fast and the iPhone portrait camera
preview appeared as a wide letterboxed strip. Requested changes were phone-first,
portrait-only play; no rests or BREATHE screens; 10/10/8-second plank holds; a
slower up/down rhythm independent of the song; and an immediate next direction
when the ring closes. Scope is push-ups only; squats and knee raises keep the
existing rhythm behaviour.

Push-up gameplay is now a "wait for me" flow:

- One target at a time: `GO DOWN`, then `GO UP`, and a top `PLANK` after each set.
- Structure is 8 reps → 10s hold → 8 reps → 10s hold → 8 reps → 8s hold. There
  are 24 reps, three holds, 28 seconds of hold time and no rests or `BREATHE`
  screens anywhere in the session.
- A target never expires. Wrong directions and untracked input are ignored; the
  ring fills with actual movement and the next direction appears immediately on
  completion. There is no timing window, early/late state, MISS or `GET READY`
  gap, so the session cannot punish a slower pace.
- Holds credit only while tracking is present and steady. A wobble pauses the
  hold instead of draining or failing it.
- The song plays in the background on a loop and no longer schedules targets.
  Flow gameplay runs on a separate `flowMs` clock in `GameRuntime`; the session
  ends when the final target lands, never on song time.
- Gameplay HUD for push-ups shows set x/3, reps in the set, score/streak, session
  progress, rep x/24 and hold time. Timing, accuracy and input-delay controls are
  hidden. Results show reps, holds, hold time and session time, with rank and
  timing accuracy hidden. STOP remains visible and ends with partial results.

Flow code lives in `lib/game-engine/flow.ts` (script generation and validation)
with a flow branch in `GameSession`, `flowTarget()` in `targets.ts`, and a
single-ring renderer in `renderer.ts`. Rhythm maps and their validation are
unchanged. `PUSHUP_CONFIG.flow` centralises reps, holds, the hold zone and the
minimum hold signal threshold.

Portrait camera:

- `getUserMedia` now requests a portrait stream (720×960, aspect 3:4) with two
  constraint fallbacks for older iOS versions. The 480×640 inference canvas is
  unchanged.
- The in-game `.camera-feed` uses `object-fit: cover`, the body/head overlays use
  the matching centred cover projection (`CameraFit` in `framing.ts`), and the
  tall portrait stage no longer shows a wide letterbox strip.
- A landscape `TURN PHONE UPRIGHT` guard appears during calibration and gameplay
  and keeps a STOP action. `?dev=1` diagnostics now include the live video
  width×height to confirm the negotiated orientation.
- The shared camera preview outside push-up gameplay still uses contain
  projection; only the push-up game opts into cover.

No new dependencies. No camera frames are captured, stored or uploaded, and no
analytics or persisted scores were added.

Verification: `npm run typecheck` and `npm run lint` pass; `npm run test` passes
171 tests in 23 files, including flow script validation, slow/untracked input,
indefinite waits, hold pausing, full 24-rep/28-second completion, a runtime clock
test that would fail if song time ended the session, and cover-crop projection;
`npm run build` succeeds. These are local mouse/keyboard and unit results. The
portrait camera result is not yet observed on physical iPhone hardware; use
`docs/PHONE_QA.md` on an HTTPS build before treating the camera fix as verified.

## Two-ring push-up targets — 2026-10-24

Owner feedback: the single flow ring felt boring. Restore the two-circle layout
from the rhythm modes: `UP` on top, `DOWN` below, with the active direction
filling as the player moves.

- Push-up flow now renders both position rings at all times. Only the current
  direction is lit and filled; the other stays dim with a `NEXT` label so the
  sequence remains visible. The top ring becomes the orange `PLANK` ring during a
  hold, which keeps the hold at the position the player is already in.
- Completion feedback is canvas-only and reduced-motion aware: the finished ring
  pops and flashes, directional sparks fall for `DOWN` and rise for `UP`, and a
  small comet travels along a quiet connector rail to wake the next ring. No
  React state or per-frame component updates were added.
- `PUSHUP_CONFIG.flow` now centralises the two-ring layout, idle opacity,
  completion timing, spark budget and handoff timing. `flowTarget()` returns both
  ring views plus the hold view, so the renderer never duplicates session logic.
- A browser check exposed that the HUD hold clock stayed at `0s` during a hold.
  The flow tick now increments the session revision only when a whole hold second
  crosses, so the HUD updates once per second without per-frame React renders.
- Copy and phone QA steps now describe two rings instead of one. The scoring,
  calibration, hold rules, audio clock and STOP behaviour are unchanged.
- No new dependencies, camera captures, uploads or persisted scores.

Verification: `npm run typecheck` and `npm run lint` pass; `npm run test` passes
175 tests in 23 files, including the new two-ring view and hold-clock cases; the
prebuild audio check and `npm run build` pass. A headless Chrome keyboard-demo
walkthrough at a 390×844 portrait viewport confirmed the two-ring layout, both
completion animations, the handoff comet, the plank ring and the live hold clock.
These are local browser, unit and build results. The two-ring animation has not
been observed on a physical iPhone, and no camera evidence is claimed.

## Calibration order and auto-advance fix — 2026-10-24

Owner report: calibration asked for the starting position and then jumped straight
to `DOWN` without the player moving. Reproduction with the state machine confirmed
that holding the starting position completed `PLANK` at 1.5s and `UP` at 3.0s,
because `UP` accepted the same head height as the baseline.

- Calibration is now three distinct positions in the requested order: a
  comfortable middle (`MIDDLE`), `UP`, then `DOWN`.
- `UP` requires the stable head height to rise at least `minUpLift` (10% of
  shoulder width) above the measured middle. `DOWN` requires a drop of at least
  `minDownDrop` (16% of shoulder width). Holding the middle can no longer advance
  past `UP`.
- The per-step settle time increased from 1.5s to 2.5s, so the instruction is
  readable before measurement can complete.
- The calibration demo figure now shifts up and down with the active step, so the
  three positions are visually distinct. Instructions, voice text and the timeout
  retry wording describe the middle position.
- `PUSHUP_CONFIG.calibration` replaces the old `upTolerance`/`downDifference`
  values with `minUpLift`/`minDownDrop`; the total range is still validated against
  `minVerticalRange`.

Verification: `npm run typecheck`, `npm run lint`, `npm run test` (176 tests in 23
files) and `npm run build` pass. New tests cover the 2.5s settle, holding the
middle without jumping to `DOWN`, the required lift/drop, the three-step medians,
and the timeout/retry path. These are unit/build results only; the revised
calibration has not been observed on a physical iPhone.

## Sit-up lineup and waist calibration — 2026-10-24

Owner revision: the final lineup is exactly **Push-ups** and **Sit-ups**. Squats and
knee raises are removed from the catalog, routes, calibration, game branches, art
and documentation. No functionality, score or calibration state was retained under
the old exercise names.

- **Home and routes:** `/` lists two movements; `/pushup` and `/situp` open the
  direct Play → automatic framing/calibration → game → results flow. `/squat` and
  `/march` return home with permanent redirects. `/routine/standing` was removed.
- **Sit-up signal:** the tracked centre is the **waist centre**, the midpoint of
  `leftHip` and `rightHip`. `PoseFrame` now exposes both `nose` and `waist`, and
  `PoseEngine` selects `nose` for push-ups and `waist` for sit-ups. A frame without
  both confident hips is not usable for sit-ups; there is no silent fallback to the
  shoulders. The waist falls back to the nose position only so the frame remains
  well-formed, and that frame is marked not ok.
- **Sit-up framing:** requires the nose, shoulders, hips and knees. Missing hips or
  knees report the existing `legs` issue. Push-ups still require the nose,
  shoulders and both elbows.
- **Calibration scripts:** `CALIBRATION_STEPS` is keyed by exercise. Push-ups keep
  `MIDDLE → UP → DOWN`; sit-ups use `DOWN` (lying) → `UP` (sitting), with no middle
  step. Both use the same stable observed samples, real-movement requirement for
  `UP`/`DOWN`, 2.5s minimum settle, no auto-advance from holding the baseline, and
  retry after two 10-second timeouts. Sit-up results store `joint:'waist'`,
  `centerY = bottomY` at the lying baseline, and `topY` at the sitting position.
  Old head-only stored calibrations are rejected because `joint` is required.
- **Game:** both exercises use the existing self-paced two-ring flow (DOWN and UP,
  top holds, no rests). `Stats.pushups` was renamed to `Stats.reps`; results show
  `PUSH-UPS` or `SIT-UPS`, and the top hold is labelled `PLANK` for push-ups and
  `HOLD` for sit-ups. Scores remain in memory and STOP stays visible.
- **Removed code:** squat/march routes, `lib/exercises/standing.ts`, standing
  calibration session/tests, `StandingCalibration`, unused `Practice`,
  `CameraPermission` screens, march/`LEFT`/`RIGHT` branches in the scheduler,
  renderer, validator, work limits, feedback and screens, plus the unused
  `LH`/`RH` note types. Original sit-up artwork replaces the squat/knee-raise art.

Automated verification:

- `npm run typecheck`: pass.
- `npm run lint`: pass, no warnings.
- `npm run test`: **183 tests in 25 files**, pass. New coverage includes the
  waist adapter/framing, sit-up `DOWN → UP` calibration, baseline hold never
  advancing, insufficient waist rise staying on `UP`, retry clearing the baseline,
  two-exercise flow counts, and `PUSH-UPS`/`SIT-UPS` plus `PLANK`/`HOLD` labels.
- `npm run build`: pass, including the prebuild audio check. Static routes are
  `/`, `/pushup`, `/situp` and `/routine/mix`; `/squat` and `/march` are redirects.
- No new dependencies. No camera captures, uploads, stored frames, analytics,
  medical claims or persisted scores were added. Only the safety acknowledgement
  and derived calibration use sessionStorage.

Physical-device gate: **pending**. Unit tests, mocks and desktop checks do not
establish that the waist signal is usable on an iPhone. The owner should place the
phone upright beside the movement area so the waist, shoulders and head stay in
view from lying to sitting, then record the waist-centre vertical travel in frame
units and divide it by the measured shoulder width. If travel is below
`minVerticalRange` (0.25 × shoulder width), stop and report the measured values
rather than switching to the shoulder centre. Run the sit-up checklist in
`docs/PHONE_QA.md` on an HTTPS build and record the rows there.

## Immersive portrait gameplay shell — 2026-10-24

Owner feedback: during play the camera should fill the portrait screen, with the
controls and score floating over it rather than sitting in a framed card on a
white page. The supplied reference image guided the layout. The existing 8bitcn
pixel identity and colours were retained; this is not a glossy-neon restyle.

- On phone-width viewports (`max-width: 700px`) the gameplay screen is now a
  fixed, full-viewport stage using `100dvh` with a `100svh` fallback. The site
  header, page margins, instruction line and footer are removed from view, and
  the camera/canvas fills the stage. Desktop keeps the existing centred arena.
- The HUD floats over the camera in safe-area bands. The top gradient holds the
  song title, artist, elapsed/total time, a 56px pause control and a 56px STOP.
  Set/combo and score/streak sit in the upper corners. Reps, session progress and
  hold time (or accuracy for rhythm play) sit in the bottom gradient. `STOP` stays
  visible in every game state, including countdown, tracking loss and pause.
- `html.gameplay-immersive` locks the page background and scrolling only while the
  phone game is active; the theme colour changes to `#07070d` and is restored on
  pause, results and unmount. The pause glyph is now an SVG with an accessible
  label, and STOP has an explicit accessible name. There are no per-frame React
  updates, and no changes to game logic, scoring, audio, camera constraints,
  persistence, analytics or privacy behaviour.
- The keyboard demo uses the same full-viewport dark stage. `?dev=1` diagnostics
  are moved above the bottom dock on phone widths.
- Phone and desktop stay intentionally different: the immersive stage begins at
  700px so a wide desktop window keeps the readable centred card.

Verification:

- `npm run typecheck`, `npm run lint`, all 183 tests and `npm run build` pass.
- Headless Chrome against the production build at 390×844 and 360×800 measured
  the arena at the full viewport, equal document and viewport scroll sizes
  (`390×844`, `360×800`), hidden header and instruction, a 102–104px top console
  and an 86–88px bottom dock. Pause and STOP measured 56px high.
- The same check at 1440×900 kept the previous centred arena (540×772) with the
  header visible, confirming the phone-only boundary.
- A synthetic background image was injected only in the headless test browser to
  check HUD contrast. No camera was opened, and no frames were captured or saved.
- A stale Turbopack production cache initially served the previous CSS chunk;
  clearing `.next/cache/turbopack` produced a build containing the new block. The
  final checks used that clean build.
- Physical iPhone Safari remains pending. The full-bleed stage uses `dvh`, so the
  phone check must confirm that the bottom dock clears Safari's toolbar and the
  home indicator, that the 3:4 camera stream's cover crop keeps head, shoulders and
  elbows visible, and that the landscape guard still shows STOP. No device evidence
  is claimed from these local checks. The new phone steps are in `docs/PHONE_QA.md`.


## Mobile UI polish — 2026-10-24

- Verified `main` matches fetched `origin/main` at `ccac6ab`; no open PRs.
- Preserved the existing uncommitted immersive-gameplay changes.
- Refined mobile home row surfaces, arrow affordances and header contrast without changing layout dimensions.
- Styled the native soundtrack picker with decorative music/chevron icons and associated its description for assistive technology. Selection and workout behavior remain unchanged.
- Added 160ms press feedback with reduced-motion and pointer gating; no dependencies added.
- Production Chromium checks: home, push-up and sit-up ready screens at 320, 390, 430 and 768px; no horizontal overflow and unchanged page/control geometry. Song selection and keyboard focus passed. Mobile screenshots inspected; reduced-motion transforms suppressed.
- Passed typecheck, lint, 183 tests and production build (including audio asset check).
- Physical iPhone Safari remains untested in this UI pass.


## Mobile visual refresh — 2026-10-24

- Replaced the home page's title-only introduction with a compact illustrated hero using the existing original MovementArt, pixel heading, concise intro, and privacy footer.
- Unified mobile exercise rows, soundtrack panel, setup headings, calibration surfaces, results, pause dialog and game control surfaces. Kept existing routes, gameplay, camera/audio behavior and score calculations.
- Preserved the page width constraints and immersive gameplay dimensions. Hero and both choices fit the tested 844px-high phone viewports.
- Reused self-hosted fonts, icons and artwork; no dependencies added. Preserved reduced-motion support and gated hover motion.
- Production Chromium QA at 320, 390, 430 and 768px: no horizontal overflow on home or either exercise ready screen; song selection passed. Inspected home, setup, game and results screenshots. Keyboard demo → STOP → results passed.
- Typecheck, lint, all 183 tests, audio asset check and production build passed.
- Camera calibration and physical iPhone Safari remain unverified by this UI pass.


## Full-camera calibration and rep feedback — 2026-10-24

- Calibration now uses the same edge-to-edge camera presentation as gameplay at every viewport width. Instructions/progress float at the bottom, STOP remains at the top, and body-overlay settings no longer consume calibration layout space. Existing home refresh preserved.
- Kept one CameraSurface mounted across framing, measurement and completion. This avoids the previous video detach/reattach on entering measurement.
- Reduced the extra framing delay from 2500ms to 700ms after the engine's existing tracking recovery. Stable sampling, confidence, real movement, range validation and the 2500ms step settle remain required.
- Fixed the slow-device sample-count bottleneck: minimum six distinct fresh samples across the full stable window instead of twelve. Added an 8Hz regression. Progress now accounts for the settling period and sample count. Added position-specific guidance and immediate Restart setup.
- Framing feedback uses the engine's actual missing-body/edge issue instead of always asking the player to step back.
- Every five completed reps triggers bounded canvas confetti and a short milestone label; reduced motion retains the label only. Milestones do not replay on camera remount, and scoring/detection/up-down order are unchanged. Added screen-reader milestone text.
- Production Chromium with explicitly synthetic camera/pose input: both exercise calibration sequences reached gameplay; video element identity stayed stable from framing to measurement; full camera geometry verified at 320/390/430px; STOP exited immersive mode to results. Synthetic checks do not validate actual MediaPipe accuracy or physical-device performance.
- Keyboard demo: five down/up pairs showed five reps and the celebration; pause and end-workout paths passed. Calibration and celebration screenshots inspected using synthetic input only.
- No dependencies added. Physical iPhone Safari framing, tracking reliability, orientation, and calibration remain device QA items.
- Final validation: typecheck, lint, 187 tests, audio asset check, production build and diff whitespace check passed.
