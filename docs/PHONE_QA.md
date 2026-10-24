# iPhone Safari checks — camera and playable push-ups

Status: implementation and local browser checks complete; physical iPhone gate
is pending. Do not replace this gate with an emulated phone viewport.

## Open the correct build

Use an HTTPS deployment containing the Phase 2 changes. The configured repository
homepage is https://movealong.vercel.app, but the current local changes have not
been pushed or deployed by this task. An older deployment may show only previews.
For local testing on the Mac use http://localhost:3000. On the iPhone, localhost
means the phone itself, and ordinary HTTP LAN addresses cannot request a camera.

On the updated HTTPS site, choose Squats, Knee raises or Push-ups. Tap Play on
the exercise screen (Shakira is selected by default). Allow camera access and
follow the automatic calibration prompts on that same flow. There is no separate
Learn, safety acknowledgement, soundtrack, camera setup or practice page.
`?dev=1` enables text diagnostics; `?debug=1` exposes camera-free keyboard testing.

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

## Complete push-up slice

Open `/pushup?dev=1` in the updated build. The compact soundtrack selector defaults
to Shakira; the original practice beat is available as a fallback. Tap Play once.
Use the floor/front setup.

1. Pass framing, then calibrate starting/top/lower positions. Steps must finish
   only from stable observed samples; insufficient range offers a placement retry.
2. Calibration leads straight into the countdown and game. Ten observed comfortable
   push-ups should yield 10 ±1 DOWN/UP pairs, without stationary double counts.
3. The song starts automatically. Verify Safari audio unlock, countdown, fixed targets, distinct
   movement fill and timing bar, hit grades and actual score/count updates.
4. Verify a TOP hold and 15-second rest. Rest movements must not add reps. Long
   tracking loss during rest must not shorten the minimum recovery interval.
5. Pause and wait. Resume with countdown at the identical song position; audio and
   cue timing must not drift. Recalibrate while paused: song stays silent.
6. Cover the camera during cues. Inputs stop immediately, expired cues are skipped
   without accuracy penalties, sustained loss pauses, recovery waits for Ready.
7. Rotate, background, lock, or interrupt the camera. Reenter through setup and
   fresh calibration, with the song parked. No invisible/background scoring.
8. STOP must immediately end audio/camera and show partial actual results. The
   naturally completed song must show complete results without scoring future cues.
9. Repeat full-song performance/network audit and record device/browser versions.
   No camera screenshots or recordings. Confirm ≥24Hz pose / ≥60FPS and stable
   behavior over the full song; review beat alignment by ear.

The same direct flow applies to squat and marching exercises. Old routine URLs
return home. Physical trials remain deferred by the owner; automated and keyboard
tests do not sign off physical exercise detection or iPhone Safari support.

## Record actual evidence

- iPhone model / iOS / Safari version:
- Tested HTTPS URL / commit:
- Squat/march full-body framing and mirrored marker alignment:
- Push-up upper-body framing:
- Loss / stable recovery / rotation / background / STOP:
- Pose Hz / inference ms / render FPS / React updates after 60 seconds:
- Network audit:
- Issues or untested paths:

No physical-device rows have been signed off yet.
