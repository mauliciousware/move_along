# Phase 2 — iPhone Safari check

Status: implementation and local browser checks complete; physical iPhone gate
is pending. Do not replace this gate with an emulated phone viewport.

## Open the correct build

Use an HTTPS deployment containing the Phase 2 changes. The configured repository
homepage is https://movealong.vercel.app, but the current local changes have not
been pushed or deployed by this task. An older deployment may show only previews.
For local testing on the Mac use http://localhost:3000. On the iPhone, localhost
means the phone itself, and ordinary HTTP LAN addresses cannot request a camera.

On the updated HTTPS site, open `/?dev=1` to see local diagnostics. Then choose
The moves → Squats → Learn this → Show camera setup, and acknowledge safety if
prompted. Select Enable camera and allow Safari camera access. No microphone
permission is requested.

## Physical checks

1. Prop the phone upright and step back. Confirm your head and feet fit without
   being cropped. Body markers should follow visible joints and mirror the front
   camera correctly. No technique or clinical measurements are displayed.
2. Hold your position. The setup should say “You’re in the frame” after a stable
   interval. The next-screen button stays disabled when framing is unreliable.
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

Calibration, rep detection, audio and scoring remain preview screens in this phase.
Continuing from setup stops the camera; persistent live calibration comes next.

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
