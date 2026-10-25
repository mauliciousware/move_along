'use client';

import Link from 'next/link';
import { ArrowUpRight, AudioLines, LockKeyhole } from 'lucide-react';
import { MovementArt, PixelSpark } from '@/components/illustrations/movement-art';
import { EXERCISES, EXERCISE_IDS } from '@/data/catalog';
import type { ExerciseId } from '@/lib/shared/types';

const descriptions: Record<ExerciseId, string> = {
  pushup: 'Down. Up. Make the floor your stage.',
  squat: 'Stand tall. Squat down. Meet the beat.',
};

export function MoveAlongApp() {
  return <div className="exercise-home">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="exercise-home-header"><Link href="/" className="brand">move along.</Link><span className="home-header-note"><AudioLines aria-hidden="true" /> Your pace. Your play.</span></header>
    <main id="main-content">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-eyebrow"><span aria-hidden="true" /> MOVE. PLAY. REPEAT.</p>
          <h1 id="home-title">A little movement.<br /><em>A lot more play.</em></h1>
          <p className="home-hero-description">Pick your movement. Put on a song.<br />Make a little time for yourself.</p>
        </div>
        <div className="home-hero-art" aria-hidden="true">
          <span className="hero-orbit" />
          <PixelSpark className="hero-pixel-spark" />
          <MovementArt exercise="pushup" decorative />
          <span className="hero-art-caption">YOUR BODY. YOUR CONTROLLER.</span>
        </div>
      </section>
      <div className="exercise-home-heading"><h2>Choose your movement</h2><span>01 — 02</span></div>
      {/* Squats used to have a permanent redirect. A distinct entry URL bypasses
          cached redirects; native links also avoid stale client router entries. */}
      <div className="exercise-choices">{EXERCISE_IDS.map((id, index) => <a href={id === 'squat' ? '/squat?entry=home' : `/${id}`} className={`exercise-choice choice-${id}`} key={id}>
        <span className="exercise-choice-number">0{index + 1}</span>
        <div><h2>{EXERCISES[id].name}</h2><p>{descriptions[id]}</p></div>
        <ArrowUpRight aria-hidden="true" />
      </a>)}</div>
    </main>
    <footer className="exercise-home-footer"><LockKeyhole aria-hidden="true" /><span>Camera stays on your device.<br />Results stay in this session.</span></footer>
  </div>;
}
