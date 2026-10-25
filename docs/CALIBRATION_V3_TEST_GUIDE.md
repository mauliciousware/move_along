# Calibration v3: owner test guide

The second exercise is now **Squats** (stand → squat → stand), as clarified by the owner. The old `/situp` URL redirects to `/squat`. There is no floor sit-up mode in this version.

## Squats

1. Prop the phone upright, slightly diagonally in front of you. Step back until your head, shoulders, hips, knees and ankles are visible throughout the movement. A diagonal view helps the camera see knee bending.
2. Tap Play. The preparation countdown remains three seconds. Calibration waits for usable framing.
3. Start standing comfortably. The app checks torso alignment and knee/hip angles before it measures the top position.
4. Follow **STAND → SQUAT → STAND → SQUAT → STAND**. At each accepted posture, it says “Stay there. Measuring,” fills the hold bar, then confirms “Saved” and announces the next movement.
5. Standing during a SQUAT prompt should show “You are still standing.” Beginning in a crouch should ask you to stand. Intermediate or unclear geometry should not fill the measurement bar.
6. The repeated squat is compared with the first comfortable squat endpoint. Calibration does not ask you to reach a universal squat depth.

## Push-ups

Place the phone near the floor, slightly to your side, keeping your head, shoulders, elbows, wrists and hips visible. A clear arm and torso view is now needed for calibration.

Follow **UP → DOWN → UP → DOWN → UP**. An upright torso cannot establish the top plank. Bent arms cannot establish the top position. A lower position needs visible arm bending, head/shoulder travel and a steady hold. Repeated endpoints must agree. If the view is unclear, adjust the phone rather than forcing more movement.

## What changed

- Full raw numeric landmarks and source aspect ratio now reach calibration. Angle calculations correct for the source aspect ratio.
- Posture checks gate every measurement frame. Interrupted or incompatible posture resets the active hold while retaining earlier valid endpoints.
- The screen shows a live **Position estimate**. Specific correction messages settle for 500 ms before they are spoken, reducing prompt flicker.
- A bounded sample window supplies median angle and torso references. No video or images are saved; posture buffers stay in memory.
- Derived calibration profiles use version 3. Older profiles are not restored.

These are view-dependent geometric estimates, not a trained posture classifier or a form/safety grade. A single 2D view cannot always distinguish poses; uncertain evidence blocks measurement. Thresholds need physical-device feedback. The agent has not accessed the camera or performed manual tests.

If stuck, report the exercise, current prompt, Position estimate, and the reason/angle/pose Hz shown under **Setup details**. No camera photo is required.
