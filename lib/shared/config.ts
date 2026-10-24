/** All product identity, game tuning and UI progression values live here. */
export const APP_NAME = "Move Along";
export const APP_TAGLINE = "Learn a movement, make it yours, and play it to the beat.";
export const APP_DESCRIPTION = "A camera-controlled movement game with short routines, exercise teaching, personal calibration, and rhythm feedback.";
export const CONFIG = {
  sessionKeys: { safety: "move-along:safety" },
  preview: { calibrationSteps: 3, countdownSteps: 3 },
  routine: { workSeconds: 30, restSeconds: 15 },
  colors: { ink: "#222039", paper: "#f7f5ff", violet: "#7152d6", mint: "#c9edb0", peach: "#ffd9c0", muted: "#68647b" },
} as const;
