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

