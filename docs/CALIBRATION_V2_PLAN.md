# Move Along: production calibration plan

Date: 2026-10-24. Status: proposal, not implementation or device validation.
Scope: mobile portrait push-ups and sit-ups. Keep the full-screen camera, existing up/down game contract, local processing and visible STOP.

## 1. Recommendation

Build an exercise-specific measurement and verification system. Calibration should answer three questions: can we observe this movement, can we distinguish this person's endpoints, and can the same range produce a repeatable complete rep?

Keep MediaPipe and the current game initially. Replace the calibration contract and its decision logic in stages. A custom model is a later option if measured failures justify it. A larger camera and shorter timers improve usability, but do not establish tracking reliability.

The proposed experience is:

**Place phone → confirm visible movement area → demonstrate one comfortable cycle → verify another cycle → ready → monitor tracking during play.**

The camera stays visible throughout. No scored reps during setup. No requirement to move deeper or faster to satisfy detection. Failure means “adjust the camera or retry,” not an assessment of the person's body.

## 2. What other systems document

These are public product behaviors and published engineering techniques. They do not reveal competitors' proprietary calibration algorithms or establish that those systems use our proposed two-cycle procedure.

| System | Publicly documented behavior | Applicable lesson |
| --- | --- | --- |
| Tempo | Specifies positioning, direction, distance and environmental requirements; acknowledges missed/double counts; supports selected movements and modifications. | Define supported camera placements and movements, and test them explicitly. Do not promise arbitrary placement. Tempo's sensor setup is not equivalent to our monocular browser camera. [Official support](https://support.tempo.fit/support/solutions/articles/151000154714-3d-tempo-vision-form-feedback) |
| Kaia Motion Coach | Provides audio guidance, rep counting and hold instructions; explicitly limits exercise and device support. | Use concise audio/visual cues and an honest support matrix. [Official help](https://help.kaiahealth.com/article/15-how-to-use-kaia-motion-coach) |
| Hinge Health TrueMotion | Describes separate capture/inference/interpolation work, variable device latency and testing across devices and thermal conditions. | Measure pose delivery independently from display FPS. Smooth the visual overlay without inventing evidence for calibration or scoring. [Engineering article, August 4, 2026](https://rnd.hingehealth.com/blog/cutting-latency-by-up-to-15-percent) |
| Google ML Kit example | Describes normalized landmark features, pose classification and repetition counting using pose entry/exit. Notes 2D angle sensitivity to viewing angle. | Evaluate body-relative features and explicit state transitions; angle-based detection still needs controlled viewpoints and validation. [Official guide](https://developers.google.com/ml-kit/vision/pose-detection/classifying-poses) |
| MediaPipe | Supplies image/world landmark estimates and configurable detection, presence and tracking confidence. | Pose landmarks are inputs to our calibration system, not ready-made calibrated exercise measurements. World coordinates should be evaluated, not assumed to be ground truth. [Official guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker) |

## 3. Current implementation: what works and what remains weak

Recent improvements already delivered: persistent camera across framing/measurement, full-screen camera UI, an eight-Hz synthetic regression, six-sample minimum, honest settling progress, immediate restart and issue-specific framing messages. Preserve these. Existing worker separation, timestamp checks, confidence gates, median sampling and detector hysteresis are also useful foundations.

| Priority | Finding from current source | Consequence / proposed remedy |
| --- | --- | --- |
| P0 | Push-ups calibrate nose Y; sit-ups calibrate hip-midpoint Y (`lib/pushup/calibration.ts`, `lib/pushup/signals.ts`). | These are image-space proxies. Head-only movement can potentially resemble a push-up; hip height may have insufficient travel during a sit-up. These failure hypotheses require real-device tests. Compare exercise-specific features before tuning acceptance. |
| P0 | Push-ups require an arbitrary MIDDLE hold before UP and DOWN. | A user does not know their future midpoint, and holding halfway is an awkward setup task. Prototype comfortable top → bottom → top; require independent verification before readiness. |
| P0 | No repeatability check after endpoint collection; the final valid endpoint immediately produces READY. | Stable endpoints do not prove reliable movement detection. Use a second complete cycle to validate the same signal and thresholds. |
| P0 | Sit-up framing requires both shoulders, both hips and both knees (`lib/pose-engine/framing.ts`). | A side view may obscure the far side. Define the viewpoint and feature first, then distinguish essential joints from optional corroborating joints. Never simply reduce all confidence thresholds. |
| P0 | Full-screen video uses cover cropping, but framing evaluates the uncropped camera coordinates. | A joint can be accepted by inference while outside the visible preview. Check both inference visibility and projected on-screen visibility; keep the entire movement envelope in usable screen space. |
| P1 | Stability uses fixed image-space standard deviation `.006`; range uses shoulder width. The allowed minimum shoulder width is `.001` (`lib/shared/config.ts`). | Noise tolerance varies with camera distance. Side views can make shoulder width too small to be a useful scale. Use a validated, observable body scale plus a measured noise floor; reject degenerate geometry. |
| P1 | Any invalid/stale frame clears the active sample window; recovery requires a continuous usable interval; timers continue during missing tracking. | Brief occlusions can repeatedly restart progress and trigger timeouts for the wrong reason. Separate visibility recovery, evidence accumulation and time spent attempting the requested movement. |
| P1 | We assess stability on filtered coordinates; filtering can lag a moving body (`lib/pose-engine/engine.ts`, `filter.ts`). | Stable-looking output alone is insufficient. Keep raw confidence/motion diagnostics separate from display smoothing; validate end-to-end latency. |
| P1 | The local camera setup ID follows camera lifecycle, not physical movement of a still-running phone (`lib/pushup/engine.ts`). | Moving the phone without restarting can invalidate endpoints without invalidating calibration. Add a conservative setup-change detector and explicit recheck path. |
| P1 | Calibration stores endpoint/scale values without exercise, schema/model version, quality summary or setup fingerprint. | A future reuse path could accept incompatible data. Current active flow recalibrates; do not claim it currently reuses stale saved calibration. Introduce a versioned contract before implementing reuse. |
| P1 | The engine is configured for one pose; there is no explicit person identity continuity policy. | Another person entering view may replace the tracked pose. Detect implausible discontinuities; document single-person support. Consider multi-person detection only after performance evaluation. |
| P1 | Most evidence is unit tests and synthetic browser input. | These validate logic and UI, not camera recognition quality. Physical-device acceptance must be an independent release gate. |

Lowering the minimum sample count addressed a specific low-rate bottleneck. It did not validate the motion features, confidence cutoffs, viewpoint or jitter tolerance.

## 4. Proposed user flow

1. **Placement.** Show a short, exercise-specific diagram within the camera screen. Explain which side should face the phone and what must stay visible. Use empirically tested placement guidance rather than copying another product's distance.
2. **Framing.** Show one actionable correction at a time: missing body part, framing edge, unsuitable angle, or unstable tracking. Distinguish “camera permission,” “model starting,” “no usable pose” and “insufficient movement.” Do not diagnose poor lighting solely from low confidence.
3. **Observe a cycle.** Push-up candidate: comfortable top → lower → return to top. Sit-up sequence must follow the feature/viewpoint experiment below. Ask for brief endpoint pauses only when needed to distinguish endpoints from noise. Show progress tied to accepted evidence, not a decorative countdown.
4. **Verify.** Ask for one more comfortable cycle. Confirm endpoint separation, sequence, joint visibility and signal repeatability. First cycle learns; second checks. A failed check explains the reason and retries only the invalid portion when the setup is unchanged.
5. **Ready.** Say “Movement detected” and transition through a short preparation countdown. Calibration success does not mean correct form or clinical safety.
6. **Recover.** A short occlusion pauses evidence collection. A longer loss or probable camera relocation pauses play and requests repositioning/recalibration. Preserve the existing score and clear partial movement state so recovery cannot manufacture a rep.

Keep STOP, voice toggle and Restart available. Prefer one instruction plus one short status line. Avoid a moving skeleton or confetti obscuring joints needed for setup. Voice must work as an optional supplement; text remains complete when speech is unavailable.

## 5. Signal selection is the first technical gate

Do not commit to a new detector before comparing it on real movements.

**Push-up candidates:** retain the current nose-height signal as a baseline; compare shoulder motion normalized by a robust visible body reference, and camera-facing elbow angle with torso corroboration. Head motion alone should not be sufficient evidence of a completed cycle. Front and oblique/side placements must be evaluated separately; do not silently switch feature definitions between frames.

**Sit-up candidates:** first establish whether the existing waist-height signal produces adequate separation across two repeated cycles in the intended placement. Compare it with torso orientation or shoulder–hip–knee angle on the visible side. Hip height alone may remain comparatively unchanged while the torso rotates—this is a hypothesis to test, not an observed failure for every user.

The existing product requirement explicitly mandates waist-centre sit-up tracking and forbids a shoulder substitute. A torso/angle replacement would be a deliberate product/architecture revision, with new tests and instructions, not a hidden fallback. If waist-only tracking fails the gate, document that limitation and decide the supported signal before implementing the replacement.

For each candidate, measure endpoint separation relative to noise, repeatability, visibility coverage, false positives during non-exercise movement, and latency. Select one supported camera/feature combination per exercise for the first release. Freeze that choice for the session; losing its required joints should pause measurement rather than switch to another uncalibrated signal.

## 6. Engine design

Use a pure state machine:

`camera-starting → framing → sampling-start → learning-cycle → verifying-cycle → ready`

Any active state can enter `reposition`, `retry`, `suspended` or `stopped` with a structured reason. Camera ownership remains outside this machine, so instruction changes never restart the stream. The game continues to receive normalized progress and ordered UP/DOWN events through an adapter.

Separate three kinds of data:

- **Observation:** fresh measured joints, timestamps, confidence, missing joints, viewpoint and scale checks.
- **Calibration evidence:** short-lived accepted samples, endpoint distributions, noise estimates, elapsed valid observation time and completed-cycle evidence.
- **Display:** smoothed marker positions, progress animation and captions. Interpolated/extrapolated display positions never count as observed evidence.

Proposed quality rules:

- Use robust endpoint estimates and noise estimates such as median absolute deviation; avoid single-frame extrema.
- Require measurable endpoint separation above the measured noise floor, plus an absolute minimum useful span for the selected feature.
- Normalize stability to observable body scale where appropriate. Do not reuse shoulder width for a side view if it is nearly collapsed.
- Use elapsed valid observation time and a minimum independent sample count. Check timestamp spacing and maximum age as well as count.
- Measure delivered pose rate and inference age at startup. Extend collection for slower supported devices; do not make stale frames valid merely to pass setup. Report unsupported performance if freshness cannot be maintained.
- Small gaps may preserve completed checkpoints while pausing the current evidence window. Never infer a threshold crossing through a gap. Invalidate checkpoints on changed setup or inconsistent endpoints.
- Verify hysteresis separates UP, transition and DOWN despite noise. Keep detector arming and full-cycle requirements.
- Freeze calibration during scoring initially. Any later adaptive drift correction needs strict bounds and dedicated tests; automatic adaptation could otherwise normalize poor tracking into apparently successful reps.

Proposed in-memory/derived-session contract:

`schemaVersion, exercise, featureId, viewpoint, modelVersion, cameraFacing, videoDimensions, setupFingerprint, endpoints, robustScale, noiseEstimate, visibilityCoverage, verifiedCycles, thresholds, createdAt`.

Validate all fields and cross-field relationships. Keep the profile in memory first. Session reuse should require a fresh framing/verification check, not just a matching storage key. Camera movement detection is a heuristic: a changing body can resemble camera movement, so ambiguous cases should request a recheck rather than silently rewrite calibration.

## 7. Implementation phases and gates

| Phase | Concrete work | Completion gate |
| --- | --- | --- |
| 0 — Baseline and observation | Add local-only aggregate diagnostics for rejection reasons, pose rate, frame age, time in each state and reset count. Run current system on real phones. | Reproduce and classify actual failures. Record manual aggregate QA results; no image capture, uploads, stored landmark traces or analytics. |
| 1 — Signal/viewpoint experiment | Compare candidates above on both exercises; test head-only motion and occlusion. | Select supported signal/viewpoint per exercise or explicitly block that exercise. Decide any change to the waist-only requirement. |
| 2 — Calibration v2 core | Add pure evidence collector, quality evaluation, versioned profile and state machine. Preserve existing game through an adapter. | Deterministic tests cover valid/invalid sequences, noise, low rate, stale frames, gaps and setup changes. No accidental readiness or double reps. |
| 3 — Guided UI and recovery | Connect framing instructions, learn/verify progress, voice and partial retry. Align preview crop and measurement envelope. | Browser tests for camera continuity, permission denial, error/retry, STOP, orientation, background/resume and full-screen layout. |
| 4 — Device validation | Run a predefined matrix; compare to manual rep counts and independent observers where practical. | Meet provisional targets below on held-out users and supported devices. Publish limitations, not just an overall average. |
| 5 — Release preparation | Keep v1 available behind an internal flag, rollout v2 by supported exercise/device, preserve reproducible tuning and rollback. | All automated checks pass; real-device report signed off; unsupported cases have a usable exit. |

Likely source boundaries: new `lib/calibration/` modules for state/evidence/quality/profiles; `lib/pose-engine/framing.ts` and engine for visibility/performance; `lib/pushup/engine.ts` and signals for the adapter; `AutoCalibration.tsx` and `Calibration.tsx` for the experience; `lib/shared/config.ts` for tuning. Do not rewrite game scoring or rewards in this project phase.

Order of effort matters: finish the physical signal experiment before investing in a complete v2 UI. Reliable duration estimates require that experiment; this is not a justified one-day threshold-tuning task.

## 8. Proposed acceptance targets

These are initial engineering targets to validate and refine, not measured results or industry standards.

| Metric | Initial target / measurement |
| --- | --- |
| Setup completion | At least 90% within two attempts for the declared supported setup; report failures as well as successes, split by exercise/device. |
| Setup duration | Median ≤15s and p90 ≤25s from correct usable framing to READY, including demonstration/verification. Separately report camera/model startup and total time from Play. |
| False readiness | Zero READY events in the defined negative test suite: stationary wrong posture, missing required joints, head-only movement, frozen timestamps, unverified range and camera relocation. This is a test gate, not a zero-error population claim. |
| Rep reliability | Initial target ≥95% precision and ≥95% recall against manually observed cycles, per exercise and supported device group. Report exact sample counts and uncertainty. |
| Screen behavior | No horizontal overflow; camera fills the viewport; STOP remains visible/reachable; text fits large-text settings and safe areas. |
| Responsiveness | Target p95 observed movement-to-feedback ≤250ms on supported devices; measure capture/inference/render components and sustained thermal behavior. |
| Recovery | No new rep or hold credit from missing/stale evidence; no lost score from recalibration; no resume-induced double count. |

Start with a formative study of roughly 10–15 consenting testers across 3–5 representative phones, then tune and evaluate a separate held-out group. That pilot is for discovering problems, not proving production accuracy. Determine the final validation sample size from measured variability and desired confidence. Do not choose thresholds using the same sessions used to report acceptance.

Matrix: oldest intended supported iPhone, mid-range and recent iPhone; supported Safari versions; one Android/browser combination if Android is in the release scope; different body proportions, clothing, skin tones and movement speeds; ordinary lighting/background variation; correct and incorrect placement; near/far distances; short and sustained sessions; occlusion, camera movement, second person, permission errors and interruption. Test push-ups and sit-ups separately.

Use synthetic landmark fixtures for reproducible regressions and live observation for physical QA. Under the current privacy contract, keep real landmark histories transient and do not record camera frames. Aggregate QA notes can contain device/build, elapsed time, manual/observed rep counts and failure reason. Adding persistent traces or telemetry is a separate privacy/product decision, not part of this plan.

## 9. Immediate next deliverable

A local diagnostic build and a written real-phone comparison of current nose/waist signals against the proposed alternatives. It should identify why calibration failed, which camera placement works, which feature is repeatable, and whether sit-ups need a deliberate signal change. Only then lock the v2 detector and implement the learn-and-verify flow.

Success means a new user can set up, understand a failure, recover, and get repeatable counting on a declared supported phone—not merely that the progress bar reaches the end.
