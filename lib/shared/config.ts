/** All product identity, game tuning and UI progression values live here. */
export const APP_NAME = "Move Along";
export const APP_TAGLINE = "Learn a movement, make it yours, and play it to the beat.";
export const APP_DESCRIPTION = "A camera-controlled movement game with short routines, exercise teaching, personal calibration, and rhythm feedback.";
export const CONFIG = {
  sessionKeys: { safety: "move-along:safety" },
  preview: { calibrationSteps: 3, countdownSteps: 3 },
  routine: { workSeconds: 30, restSeconds: 15 },
  camera: {
    width: 480, height: 640, maxHz: 30, maxDpr: 2,
    staleMs: 250, initTimeoutMs: 30000, frameTimeoutMs: 5000,
    warnInferenceMs: 33, metricsWindowMs: 1000, metricSamples: 30,
    devQuery: "dev",
  },
  tracking: { minConfidence: 0.5, lostAfterMs: 500, autoPauseAfterMs: 5000, recoverMs: 1000, issueSettleMs: 300, edgeMargin: 0.015 },
  smoothing: { minCutoff: 1.2, beta: 0.05, dCutoff: 1 },
  pose: {
    libraryPath: "/mediapipe/vision_bundle.js", wasmPath: "/mediapipe/wasm", modelPath: "/models/pose_landmarker_lite.task", numPoses: 1,
    jointIndices: { nose: 0, leftShoulder: 11, rightShoulder: 12, leftElbow: 13, rightElbow: 14, leftWrist: 15, rightWrist: 16, leftHip: 23, rightHip: 24, leftKnee: 25, rightKnee: 26, leftAnkle: 27, rightAnkle: 28, leftFoot: 31, rightFoot: 32 },
    standingJoints: ["nose", "leftShoulder", "rightShoulder", "leftHip", "rightHip", "leftKnee", "rightKnee", "leftAnkle", "rightAnkle", "leftFoot", "rightFoot"],
    pushupJoints: ["nose", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow"],
    connections: [["leftShoulder", "rightShoulder"], ["leftShoulder", "leftElbow"], ["leftElbow", "leftWrist"], ["rightShoulder", "rightElbow"], ["rightElbow", "rightWrist"], ["leftShoulder", "leftHip"], ["rightShoulder", "rightHip"], ["leftHip", "rightHip"], ["leftHip", "leftKnee"], ["leftKnee", "leftAnkle"], ["rightHip", "rightKnee"], ["rightKnee", "rightAnkle"], ["leftAnkle", "leftFoot"], ["rightAnkle", "rightFoot"]],
  },
  cameraOverlay: { dotRadius: 4, noseRadius: 6, lineWidth: 2, lineOpacity: 0.5, dotOpacity: 0.95, modes: ["on", "minimal", "off"] },
  colors: { ink: "#222039", paper: "#f7f5ff", violet: "#7152d6", mint: "#c9edb0", peach: "#ffd9c0", muted: "#68647b" },
} as const;
