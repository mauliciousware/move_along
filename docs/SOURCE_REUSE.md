# Reused source inventory

Reference: parent Pushbeat working-tree contents, SHA-256 recorded at port time.
Only the listed files were copied; parent files were not modified.

- `../lib/pose-engine/delegate.ts` → `lib/pose-engine/delegate.ts`; SHA-256 `ece8f9eb013828fd907834111b1d6701aa8bae274e1b43e2951ef94d5489086a`.
- `../lib/pose-engine/frame-gate.ts` → `lib/pose-engine/frame-gate.ts`; SHA-256 `0ea302ab5e8479503ec0acefa8140103ee976279a4805e170c7797f12f110794`.
- `../lib/pose-engine/filter.ts` → `lib/pose-engine/filter.ts`; SHA-256 `df4f35009027aa8a7fe5569b08542b30fab570072a29af7226f2893acb1b40db`.
- `../lib/pose-engine/tracking.ts` → `lib/pose-engine/tracking.ts`; SHA-256 `74285c45520cd8552f03abc7a2e8a65efca742a0d4460ccc8faa30d37dc6454c`.

Worker transport and camera engine are new adaptations of the existing lifecycle
design, with exercise-specific framing, full-body filtering, explicit suspension,
and local diagnostics. Camera overlay and mobile setup UI are new implementations.

## Complete push-up slice (2026-10-24)

Working-tree sources, adapted after copying. The camera engine is shared through an adapter, not copied.

| Source | Destination | Source SHA256 |
| --- | --- | --- |
| `lib/game-engine/feedback.test.ts` | `lib/game-engine/feedback.test.ts` | `bc60acbf5c32266f0972595aae4ced13fde8278fae7a131b369f5fd8922d89af` |
| `lib/game-engine/game.test.ts` | `lib/game-engine/game.test.ts` | `dae680f51461a8fe1b4e9a786288f5b628810e30b3690b75c7baf6a076b34b86` |
| `lib/game-engine/targets.test.ts` | `lib/game-engine/targets.test.ts` | `c8064c760d835a9848df0526cd6bb6bbfcd6cfb520657381900c18945d0e95ee` |
| `lib/game-engine/runtime.ts` | `lib/game-engine/runtime.ts` | `3da08338401daafebd1bcd9ccb1b8a9604ec89218537c11b2e963c83bca8bf84` |
| `lib/game-engine/session.ts` | `lib/game-engine/session.ts` | `11a9573194dfb28f75ddf2638b9cf3f280d954433a7e78efac13890d27c7a2b6` |
| `lib/game-engine/scoring.ts` | `lib/game-engine/scoring.ts` | `031b5d75652aa86e034a286bf9ec3aee14660503c12c1efebd1508f2a49e5ecf` |
| `lib/game-engine/feedback.ts` | `lib/game-engine/feedback.ts` | `cc9cfe5bd4080ceaa44df8cd02a2cd5cfa70526dbb513825a63cdf5b0c591261` |
| `lib/game-engine/renderer.ts` | `lib/game-engine/renderer.ts` | `ad0970ea7a35a4592511e054e9cb9889d231c90671eb2bcb6455be444c4a83c3` |
| `lib/game-engine/targets.ts` | `lib/game-engine/targets.ts` | `847e5ce78a9d47a0eca3af9caa8eeef9535a3ee1813ca3fa432a97560b518e77` |
| `lib/game-engine/runtime.test.ts` | `lib/game-engine/runtime.test.ts` | `b653d969ad1711b1d7e929ac24da9c28dc14316bb5bae422554bb262bab9ff77` |
| `lib/game-engine/hold.ts` | `lib/game-engine/hold.ts` | `829992757ea03a7c9db74f66571858bd7a21f19ba6a63757d297a4df32dcea18` |
| `lib/game-engine/validator.ts` | `lib/game-engine/validator.ts` | `46301e6054d9cba8d87e191c48cb263bfc7d4bfb0d02f5473ad35839d1266ab2` |
| `lib/audio-engine/cues.ts` | `lib/audio-engine/cues.ts` | `0c7392f093beb9fdc6898ac0dc571ab3ae6ee151e61610e5ad16c601060ed8aa` |
| `lib/audio-engine/transport.test.ts` | `lib/audio-engine/transport.test.ts` | `d66746b07fbf7876dca5f1be8edd4b8daee3b00ee72414421f7840c5641d3718` |
| `lib/audio-engine/transport.ts` | `lib/audio-engine/transport.ts` | `1c452f987a481bf1f0775cc4b0f8369455c294d85a609efcb1293555899970bd` |
| `lib/pose-engine/movement.ts` | `lib/pushup/movement.ts` | `5f077c6944745160dbc7ab8062ed667b1ab61aaf2dcd314e6a25234a26bda5a0` |
| `lib/pose-engine/movement.test.ts` | `lib/pushup/movement.test.ts` | `127c656a6ba779f93c9658fbd4a1eae0c5c289bc6aac77c3220f513aa6aee631` |
| `lib/pose-engine/movement-session.ts` | `lib/pushup/movement-session.ts` | `2a7f4d0065ad63c6963ad6c32df4c4a11799c60074994311ffb219d7e9ed47a6` |
| `lib/pose-engine/calibration.ts` | `lib/pushup/calibration.ts` | `33f7f00f0ab8d91eaee06baf5909690d15dfc6dab886b7d006a9b92c8a7be8fb` |
| `lib/pose-engine/calibration.test.ts` | `lib/pushup/calibration.test.ts` | `a408ab101bb85c1b75b5e114d3974a4978ba60f7d54015727042e6a6a555e8e5` |
| `lib/pose-engine/signals.ts` | `lib/pushup/signals.ts` | `a5830d2092d40473203aa8b9cd8c71efa702061f3d35523449e7aec6658d64e6` |
| `lib/pose-engine/body-overlay.ts` | `lib/pushup/body-overlay.ts` | `e979298f5831e4b5b71bb87b40c45fa4feb238731d1750977e882fb8fe79ea84` |
| `lib/pose-engine/body-overlay.test.ts` | `lib/pushup/body-overlay.test.ts` | `ccc2fddbe6ac1b61990a50956c59485cdecc362145fa7dc7d30664d8cbf386ac` |
| `lib/shared/types.ts` | `lib/shared/pushup-types.ts` | `fab9770156868a9030f2e84dbb44ffd07cb3f850e1320713482ee21868f7dc48` |
| `components/screens/Calibration.tsx` | `components/pushup/screens/Calibration.tsx` | `a9831c5290b4100bc554e394f3b5d3a30337c39a47493602688fbd17093f26e8` |
| `components/screens/Gameplay.tsx` | `components/pushup/screens/Gameplay.tsx` | `466c69ac2588fad829c9afcc53479f27919f4c8612697ef6b5b07d5c648c69e5` |
| `components/screens/Countdown.tsx` | `components/pushup/screens/Countdown.tsx` | `bd60854d94b67a954a106f140f062e33ee1bdebe7aded858bc1f2307e1fb2378` |
| `components/screens/Results.tsx` | `components/pushup/screens/Results.tsx` | `0e7e13f6ee8a54c2ec38e8eedb58df0f3a8b08c84ec91052484cfcf7ca778245` |
| `components/camera/CameraSurface.tsx` | `components/pushup/camera/CameraSurface.tsx` | `7b603ec2831eb3668c89d19d52de0c9a213630a7434e940385e0153fa2d0aa82` |
| `components/camera/CameraFeed.tsx` | `components/pushup/camera/CameraFeed.tsx` | `67718f07624f10c3971f591d70ae9d2b45966fdc602d45dee44ccb90b73c4480` |
| `components/camera/PoseView.tsx` | `components/pushup/camera/PoseView.tsx` | `4f17b517656d0f78f996161a01322fc116c8ad8572baf8ad5e9151ad47bfb6a8` |
| `components/game/GameCanvas.tsx` | `components/pushup/game/GameCanvas.tsx` | `e2f46ec408fd8f46c112c0386e91ccb1a6275ca384783c60e3b8b096ccb7d5c6` |
| `components/game/StepBackOverlay.tsx` | `components/pushup/game/StepBackOverlay.tsx` | `f5f84925fc55565c31b2644f2179eae838348fac3f8c4a957b89b29dbe19c5b7` |
| `components/pose/BodyOverlay.test.ts` | `components/pushup/pose/BodyOverlay.test.ts` | `7468ddd00acb2ba8575245c17a32b00a636a81a3e917ff92b55826c2f8c28530` |
| `components/pose/BodyOverlay.ts` | `components/pushup/pose/BodyOverlay.ts` | `6db47ed5b38d53f2c8b43814846704c19296c5335267f61235f6a33fbe10f44f` |
| `components/pose/HeadMarker.ts` | `components/pushup/pose/HeadMarker.ts` | `7373e23a2289d07bc0f968f5332a9297fb67d37bf135f355b59c7cd564cfb8f3` |
| `components/pose/PositionGauge.ts` | `components/pushup/pose/PositionGauge.ts` | `e5cdab3c0221fcefca9a63430cd03e854902dea1e608a372524f5c39916be941` |
| `components/pose/OverlayControl.tsx` | `components/pushup/pose/OverlayControl.tsx` | `3a4bc12526cda55a0ed1237616e3a29556c2bf1a63f754722c48f1f755b2229c` |
| `components/ui/PlacementGuide.tsx` | `components/pushup/ui/PlacementGuide.tsx` | `48cd5057f3ca36fce9a5b38235820523cc7f6875c8b068a8fed1ae8b3b651431` |
| `components/ui/Slider.tsx` | `components/pushup/ui/Slider.tsx` | `9f058e64f646ca8a24c2f2896912b14d3b8c99743157de912a09ba814bb3594c` |
