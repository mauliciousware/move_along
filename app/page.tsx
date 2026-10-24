import { APP_NAME, APP_TAGLINE } from "@/lib/shared/config";

const STACK = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "Vitest",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 pt-8 pb-10 sm:px-10 sm:pt-12">
      <header className="flex items-center justify-between gap-4 border-b border-line pb-6">
        <span className="text-sm font-semibold tracking-[0.2em] uppercase">
          {APP_NAME}
        </span>
        <span className="rounded-full border border-line px-3 py-1 text-xs tracking-wide text-muted">
          Phase 0 · Scaffold
        </span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-20 sm:py-28">
        <p className="mb-6 text-xs font-medium tracking-[0.24em] text-accent uppercase">
          Camera-controlled movement
        </p>
        <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-6xl lg:text-7xl">
          {APP_TAGLINE}
        </h1>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Short routines, exercise teaching, personal calibration, and rhythm
          feedback. Camera tracking is designed to run locally in your browser.
        </p>
      </section>

      <footer className="flex flex-col gap-4 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-md leading-relaxed">
          Scaffold only. There is no camera tracking, calibration, audio, or
          gameplay yet.
        </p>
        <p className="text-xs tracking-[0.12em] uppercase">{STACK.join(" · ")}</p>
      </footer>
    </main>
  );
}
