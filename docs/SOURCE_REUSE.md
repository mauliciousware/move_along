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
