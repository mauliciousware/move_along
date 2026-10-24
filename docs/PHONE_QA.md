# iPhone Safari checks — camera and playable push-ups

Status: implementation and local browser checks complete; physical iPhone gate
is pending. Do not replace this gate with an emulated phone viewport.

## Open the correct build

Use an HTTPS deployment containing the Phase 2 changes. The configured repository
homepage is https://movealong.vercel.app, but the current local changes have not
been pushed or deployed by this task. An older deployment may show only previews.
For local testing on the Mac use http://localhost:3000. On the iPhone, localhost
means the phone itself, and ordinary HTTP LAN addresses cannot request a camera.

On the updated HTTPS site, choose Push-ups or Sit-ups. Tap Play on the exercise
screen (Shakira is selected by default). Allow camera access and follow the
automatic calibration prompts on that same flow. There is no separate Learn,
safety acknowledgement, soundtrack, camera setup or practice page. `/squat` and
`/march` must redirect home. `?dev=1` enables text diagnostics; `?debug=1` exposes
camera-free keyboard testing.

## Physical checks

1. Prop the phone upright and step back. Confirm your head and feet fit without
   being cropped. Body markers should follow visible joints and mirror the front
   camera correctly. No technique or clinical measurements are displayed.
2. Hold your position. The setup should say “You’re in the frame” after a stable
   interval. Calibration starts automatically only after stable usable framing.
3. Cover the lens: readiness must turn off immediately, loss messaging should
   settle within about 0.5 seconds, and sustained loss should say Tracking paused
   after 5 seconds. Uncover and remain in view; readiness requires about 1 second
   of stable tracking. No stale markers should remain over an empty view.
4. Try the On / Minimal / Off marker controls. Camera framing checks still work
   with markers hidden. These controls do not change the detector.
5. Switch front/rear camera. The new setup must be checked again. Front is mirrored;
   rear is not. If the requested camera is unavailable, the actual facing setting
   is used where the browser reports it.
6. Rotate the phone, switch tabs/apps, or lock the screen. Camera processing should
   stop. Return to Safari and tap Resume camera; it must not restart by itself.
7. Use Pause then Back to camera. The screen must remain paused until Resume
   camera is pressed. Use STOP or leave setup: the video stream and camera indicator
   should turn off. A permission response arriving after exit must not reopen it.
8. Deny camera permission once and verify actionable retry instructions. Re-enable
   in Safari's site settings to retry; do not repeatedly grant broader permissions.
9. Watch diagnostics for at least a minute: target ≥24 pose Hz, ≥60 render FPS and
   <10 React renders/second in steady use. Note sustained slowdowns/thermal behavior.
10. Verify runtime Network traffic using Safari Web Inspector: same-origin static
    assets only, no recording/upload/analytics. Dev-mode websocket traffic is local
    tooling; production uses connect-src self. Never capture or save camera frames
    as QA evidence. Record only counts, status, performance and device details.

## Complete push-up slice (self-paced flow)

Open `/pushup?dev=1` in the updated build. The compact soundtrack selector defaults
to Shakira; the original practice beat is available as a fallback. Tap Play once.
Use the floor/front setup. The song is background music only and loops; it does not
set the pace.

1. Hold the phone upright in portrait. In `?dev=1`, check that the diagnostics show
   a portrait video size (taller than wide) and that the camera preview fills the
   tall frame without a wide letterbox strip. If the phone is turned sideways, the
   `TURN PHONE UPRIGHT` guard should cover the screen and STOP must still work.
2. Pass framing, then calibrate three positions in order: comfortable middle
   (`MIDDLE`), `UP`, then `DOWN`. Each step must wait for real movement and finish
   only from stable observed samples; holding the middle must never skip `UP`.
3. Calibration leads straight into the countdown and game. There is no rest or
   BREATHE screen at any point.
4. Both rings are visible: `UP` on top and `DOWN` below. The `DOWN` ring is lit
   first. Take your time: the target must never expire, and no timing bar,
   early/late marker or MISS may appear. Fill the `DOWN` ring, then the `UP` ring
   must light immediately. A small comet should travel from the completed ring to
   the next one, with a pop and directional sparks.
5. Complete 8 controlled reps. The third set entry is a `PLANK` hold counting down
   from 10 seconds, followed by 8 more reps, another 10-second hold, 8 reps and a
   final 8-second hold. Reps and hold seconds must match the on-screen counts.
6. During a hold, hold steady at the top. Covering the camera or losing tracking
   must pause the count rather than drain or fail it; uncover and it should
   continue from the same value. A wobble may pause credit but must not restart or
   fail the hold.
7. Move at half speed or pause mid-rep. Nothing should skip, expire or penalise you.
   The song may continue or loop; it must not change when the next direction appears.
8. Pause and wait. Resume with the countdown and confirm the current target is the
   same one you left. Recalibration while paused keeps audio silent.
9. STOP must immediately end audio/camera and show partial actual results with
   reps, holds, hold time and session time. Rank and rhythm accuracy must be hidden
   for this flow. A completed session must end on the final hold, not on a song
   boundary.
10. Repeat the performance/network audit: no camera frames captured or uploaded,
    no analytics, no persisted scores. Confirm ≥24 pose Hz / ≥60 render FPS and
    stable behaviour across the whole session, and review the camera's portrait
    orientation after rotation and resume.

## Sit-up slice (waist centre, DOWN → UP)

Open `/situp?dev=1` in the updated build. Prop the phone upright beside the
movement area so the waist, shoulders and head stay visible from lying to sitting.
The waist centre is the midpoint of the hips; do not accept a shoulder substitute.

1. Confirm the sit-up framing reports the hips and knees. Cover the hips: framing
   must report a legs issue and the signal must not be usable. Uncover and recover.
2. Calibrate two positions only: `DOWN` (lying) then `UP` (sitting). Holding the
   lying baseline must never advance to `UP` or `READY`. Each step needs stable
   observed samples and a 2.5-second settle.
3. Rise only a little (well under 10% of shoulder width). The session must stay on
   `UP`, never report ready, and after two timeouts offer TRY AGAIN with guidance to
   show the waist. Make a real comfortable rise to complete.
4. Record the waist-centre vertical travel in frame units and the shoulder width.
   Travel below 0.25 × shoulder width must stop the trial and be reported; do not
   switch to the shoulder centre.
5. Start the game. The first target is `DOWN`; the first lie-down must register
   rather than being swallowed by the calibration end position. Then `UP`.
6. Complete 8 reps. The top hold is labelled `HOLD` (not `PLANK`), counts down from
   10 seconds, and pauses rather than draining when tracking drops.
7. STOP must end audio/camera and show `SIT-UPS` and `HOLD TIME` in results. No
   rank or rhythm accuracy is shown for the flow.
8. Repeat the network/performance audit. No camera frames, scores or analytics may
   leave the device.

Push-up calibration must still run `MIDDLE → UP → DOWN` without auto-advancing.
Old squat/march URLs must return home. Physical trials remain deferred by the
owner; automated, mocked and keyboard tests do not sign off physical exercise
detection, iPhone Safari support or the waist-centre signal on real hardware.

## Record actual evidence

- iPhone model / iOS / Safari version:
- Tested HTTPS URL / commit:
- Portrait preview fills the tall stage; negotiated video width×height:
- TURN PHONE UPRIGHT guard / STOP during landscape:
- Push-up flow: reps (24) / holds (10s, 10s, 8s) / hold time (28s):
- Slow or paused reps: no expiry, no MISS, immediate next direction:
- Sit-up framing: waist/shoulders/head visible lying and sitting:
- Sit-up waist travel (frame units) ÷ shoulder width; must be ≥ 0.25:
- Sit-up calibration DOWN → UP; holding DOWN never advances:
- Insufficient waist rise stays on UP and offers TRY AGAIN:
- First sit-up DOWN target registers after calibration; hold label HOLD:
- Sit-up results show SIT-UPS / HOLD TIME:
- Push-up calibration still MIDDLE → UP → DOWN:
- `/squat` and `/march` redirect home:
- Push-up upper-body framing:
- Loss / stable recovery / rotation / background / STOP:
- Pose Hz / inference ms / render FPS / React updates after 60 seconds:
- Network audit:
- Issues or untested paths:

No physical-device rows have been signed off yet.
