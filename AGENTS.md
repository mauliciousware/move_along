# AGENTS.md — Move Along

Work exclusively in this folder. Read BUILD_PROMPT.md and plan.md. These project
instructions replace Pushbeat's product scope for this nested repository.

- Stack: Next App Router, React, strict TypeScript, Tailwind, 8bitcn/shadcn,
  MediaPipe lite, Web Audio and Vitest. Explain added dependencies in the progress
  record. Use readable code and one central config for tunable values.
- Follow sequential plan gates. Do not claim camera/device evidence from mocks.
- No per-frame React updates; pose and game engines remain independent.
- No camera captures, uploads, stored frames, analytics or medical claims.
- Only safety acknowledgement and derived calibration may persist in sessionStorage.
- Scored gameplay keeps STOP visible. Scores stay in memory.
- Use original movement art and cleared audio. Keep third-party license notices.
- End each phase with npm run typecheck, npm run lint, npm run test, npm run build.
- Do not read or print .env. Do not alter the parent Pushbeat working tree.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
