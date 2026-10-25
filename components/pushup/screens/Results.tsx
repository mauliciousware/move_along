'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import type { SessionFeedback } from '@/lib/game-engine/feedback';
import { Button } from '@/components/pushup/ui/Button';
import { accuracyLabel, rank, type Stats } from '@/lib/game-engine/scoring';
import { repLabel } from '@/lib/game-engine/labels';
import type { SessionAnalysis } from '@/lib/game-engine/analysis';
import type { ExerciseId } from '@/lib/shared/types';
import { EXERCISES } from '@/data/catalog';
import { MovementArt } from '@/components/illustrations/movement-art';
const time = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

export function Results({ title, stats, onReplay, onDone, feedback, exercise, analysis, flow = false }: {
  exercise: ExerciseId; analysis: SessionAnalysis; title: string; stats: Stats;
  feedback: SessionFeedback; flow?: boolean; onDone: () => void; onReplay: () => void;
}) {
  const scoreRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const target = scoreRef.current; if (!target) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0; const start = performance.now();
    const finish = () => { cancelAnimationFrame(frame); target.textContent = stats.score.toLocaleString(); };
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / CONFIG.animation.resultMs);
      target.textContent = Math.round(stats.score * (1 - (1 - progress) ** 3)).toLocaleString();
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    if (!motion.matches) frame = requestAnimationFrame(tick);
    motion.addEventListener('change', finish);
    return () => { cancelAnimationFrame(frame); motion.removeEventListener('change', finish); };
  }, [stats.score]);

  const resultRank = rank(stats);
  const values: [string, string | number][] = flow
    ? [
      [repLabel(exercise), stats.reps],
      [exercise === 'squat' ? 'HOLDS' : 'PLANK HOLDS', `${analysis.holds} / ${analysis.totalHolds}`],
      ['HOLD TIME', `${Math.round(stats.plankTimeMs / 1000)}s`],
      ['SESSION TIME', time(stats.workoutTimeMs)],
    ]
    : [
      [repLabel(exercise), stats.reps],
      ['ACCURACY', accuracyLabel(stats)], ['PERFECT', stats.perfect], ['GOOD', stats.good],
      ['OK', stats.ok], ['MISSES', stats.miss], ['MAX COMBO', stats.maxCombo],
      ['SONG TIME', time(stats.workoutTimeMs)], ['HOLD TIME', time(stats.plankTimeMs)],
    ];
  const coverage = analysis.coverage === null
    ? (analysis.keyboard ? 'Keyboard demonstration: no camera tracking measured.' : 'Tracking coverage: no gameplay frames measured.')
    : `Usable tracking: ${analysis.validFrames} ÷ ${analysis.observedFrames} received gameplay frames = ${analysis.coverage}%. This does not measure form quality or time without arriving frames.`;

  return <section className="screen narrow results">
    <span className="chapter-label">{stats.endedEarly ? 'YOUR SESSION / ENDED EARLY' : 'YOUR SESSION / COMPLETE'}</span>
    <h1>{stats.endedEarly ? 'SESSION FINISHED.' : 'SESSION COMPLETE.'}<br/><em>{stats.endedEarly ? 'THANKS FOR MOVING.' : 'WELL DONE.'}</em></h1>
    <p className="muted">{title} · Your session</p>
    <div className="result-score">
      <div><span>SCORE</span><strong ref={scoreRef} aria-label={`${stats.score.toLocaleString()} points`}>{stats.score.toLocaleString()}</strong></div>
      {!flow && <div className={`rank rank-${resultRank}`}><span>RANK</span><strong>{resultRank}</strong></div>}
    </div>
    <div className="session-feedback">
      <article><span className="chapter-label">01 / YOUR HIGHLIGHT</span><p>{feedback.highlight}</p></article>
      <article><span className="chapter-label">02 / NEXT TIME</span><p>{feedback.next}</p></article>
    </div>
    {feedback.tracking && <p className="muted tracking-note">{feedback.tracking}</p>}
    <div className="stats-grid">{values.map(([label, value], index) => <div key={label} className="result-stat" style={{ animationDelay: `${index * CONFIG.polish.staggerMs}ms`, animationDuration: `${CONFIG.polish.enterMs}ms` } as CSSProperties}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <section className="result-maths" aria-label="Your session maths">
      <h2>Behind the numbers</h2>
      {flow ? <>
        <p>Each rep counts when the ring closes. The next direction appears immediately — there is no timing window, no early cue and no miss.</p>
        <p>Holds count only while the camera tracks you steadily at the top. A wobble pauses the hold; it never drains or fails it.</p>
        <p>The soundtrack plays in the background and never schedules a target.</p>
        <p>{coverage}</p>
      </> : <>
        <p>Rhythm accuracy = (100 × {stats.perfect} perfect + 75 × {stats.good} good + 40 × {stats.ok} OK) ÷ (100 × {analysis.judged} judged cues). {analysis.judged ? `Your weighted total is ${analysis.weightedPoints}.` : 'No judged cues yet; accuracy is unavailable.'}</p>
        <p>{analysis.skipped} tracking-skipped cues and {analysis.pending} unplayed cues are excluded from accuracy. Reps and steps count detected movements, independently of rhythm hits.</p>
        <p>{analysis.averageErrorMs === null ? 'Timing error: not enough hit data.' : `Average timing error: ${analysis.averageErrorMs} ms across ${analysis.timedHits} movement hits (average absolute distance from the beat).`}</p>
        <p>{coverage}</p>
      </>}
    </section>
    <section className="movement-review">
      <h2>Practice the movement</h2>
      <MovementArt exercise={exercise}/>
      <p>Illustration only. We cannot assess your posture from this game signal.</p>
      <ol>{EXERCISES[exercise].instructions.map(line => <li key={line}>{line}</li>)}</ol>
      <p>{analysis.coverage !== null && analysis.coverage < 100 ? 'If tracking drops, check the camera placement and recalibrate. ' : ''}{flow ? 'Play again to recalibrate. The camera reads movement, not form.' : 'Play again to recalibrate and make the targets repeatable. Timing scores do not tell you whether a rep had good form.'}</p>
    </section>
    <p className="session-signoff">{flow ? 'Your pace. Your movement. Two rings, one breath.' : 'Your pace. Your rhythm. A little time for movement.'}</p>
    <Button variant="secondary" onClick={onDone}>ALL MOVEMENTS</Button>
    <Button onClick={onReplay}>PLAY AGAIN</Button>
    <small className="muted">{flow ? 'Scores are for fun, stay in memory and measure game performance only. Nothing leaves your device.' : 'Ranks are for fun and measure game performance only. Scores aren’t saved. Nothing leaves your device.'}</small>
  </section>;
}
