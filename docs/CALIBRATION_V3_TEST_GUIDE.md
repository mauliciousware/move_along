# Calibration: forgiving demo flow

Updated 2026-10-25 after the owner reported that mandatory posture checks blocked both exercises on the real camera. The second exercise is Squats (stand → squat → stand); `/situp` redirects to `/squat`.

## Squats

1. Prop the phone upright facing you. Keep your head, both shoulders and both hips visible. Knees and ankles are optional.
2. Tap Play. There is a three-second preparation countdown, then calibration waits for usable tracking.
3. Start standing comfortably and follow **STAND → SQUAT → STAND → SQUAT → STAND**.
4. Each position says “Stay there. Measuring,” fills the hold bar, then says “Saved” and announces the next move.
5. Squat within your comfortable range. The app learns your height change and checks that you can repeat it; no exact knee angle or universal depth is required.

## Push-ups

Place the phone near the floor, facing you. Keep your head and both shoulders visible. Wrists, elbows and hips are optional for calibration.

Start in your comfortable top position and follow **UP → DOWN → UP → DOWN → UP**. The app measures your head movement with shoulder movement as corroboration. It allows moderate wobble and variation between repetitions.

## What still matters

- Follow the starting-position prompt. Posture estimates are advisory diagnostics and do not verify that your form is correct.
- Up and down must be visibly different. Remaining still cannot complete calibration.
- Fresh, usable samples and a short steady hold are still required. No progress is fabricated when tracking is missing.
- Brief tracking loss resets the current measurement hold; earlier saved positions are kept. A longer interruption offers Try again.
- Large camera/distance changes can still require restarting setup.

Posture geometry is available under Setup details for debugging, but uncertain angles cannot block setup or interrupt a valid hold. The camera saves no video or pictures. No manual/camera testing was performed by the agent for this revision.

If it gets stuck, report the exercise, exact prompt and the reason/pose Hz under Setup details. The owner performs the real-device test.
