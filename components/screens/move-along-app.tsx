'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { EXERCISES, EXERCISE_IDS } from '@/data/catalog';
import type { ExerciseId } from '@/lib/shared/types';

const descriptions: Record<ExerciseId, string> = {
  pushup: 'Down. Up. Make the floor your stage.',
  situp: 'Lie back. Sit up. Meet the beat.',
};

export function MoveAlongApp() {
  return <div className="exercise-home">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="exercise-home-header"><Link href="/" className="brand">move along.</Link><span>A little movement. A lot more play.</span></header>
    <main id="main-content">
      <div className="exercise-home-heading"><h1>Pick a movement.</h1></div>
      <div className="exercise-choices">{EXERCISE_IDS.map((id, index) => <Link href={`/${id}`} className={`exercise-choice choice-${id}`} key={id}>
        <span className="exercise-choice-number">0{index + 1}</span>
        <div><h2>{EXERCISES[id].name}</h2><p>{descriptions[id]}</p></div>
        <ArrowUpRight aria-hidden="true" />
      </Link>)}</div>
    </main>
    <footer className="exercise-home-footer">Camera stays on your device. Results stay in this session.</footer>
  </div>;
}
