'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import type { SessionFeedback } from '@/lib/game-engine/feedback';
import { Button } from '@/components/pushup/ui/Button';
import { accuracyLabel, rank, type Stats } from '@/lib/game-engine/scoring';
const time=(ms:number)=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
export function Results({title,stats,onReplay,onSongs,onCalibrate,onDone,feedback}:{title:string;stats:Stats;feedback:SessionFeedback;onDone:()=>void;onReplay:()=>void;onSongs:()=>void;onCalibrate:()=>void}) {
  const scoreRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    const target=scoreRef.current;if(!target)return;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0;const start=performance.now();
    const finish=()=>{cancelAnimationFrame(frame);target.textContent=stats.score.toLocaleString();};
    const tick=(now:number)=>{
      const progress=Math.min(1,(now-start)/CONFIG.animation.resultMs);
      target.textContent=Math.round(stats.score*(1-(1-progress)**3)).toLocaleString();
      if(progress<1)frame=requestAnimationFrame(tick);
    };
    if(!motion.matches)frame=requestAnimationFrame(tick);
    motion.addEventListener('change',finish);
    return ()=>{cancelAnimationFrame(frame);motion.removeEventListener('change',finish);};
  },[stats.score]);
  const resultRank=rank(stats);
  const values=[['PUSH-UPS',stats.pushups],['ACCURACY',accuracyLabel(stats)],['PERFECT',stats.perfect],['GOOD',stats.good],['OK',stats.ok],['MISSES',stats.miss],['MAX COMBO',stats.maxCombo],['WORKOUT TIME',time(stats.workoutTimeMs)],['PLANK TIME',time(stats.plankTimeMs)]];
  return <section className="screen narrow results"><span className="chapter-label">{stats.endedEarly?'YOUR SESSION / ENDED EARLY':'YOUR SESSION / COMPLETE'}</span><h1>{stats.endedEarly?'SESSION FINISHED.':'SESSION COMPLETE.'}<br/><em>{stats.endedEarly?'THANKS FOR MOVING.':'WELL DONE.'}</em></h1><p className="muted">{title} · Your session</p><div className="result-score"><div><span>SCORE</span><strong ref={scoreRef} aria-label={`${stats.score.toLocaleString()} points`}>{stats.score.toLocaleString()}</strong></div><div className={`rank rank-${resultRank}`}><span>RANK</span><strong>{resultRank}</strong></div></div><div className="session-feedback"><article><span className="chapter-label">01 / YOUR HIGHLIGHT</span><p>{feedback.highlight}</p></article><article><span className="chapter-label">02 / NEXT TIME</span><p>{feedback.next}</p></article></div>{feedback.tracking && <p className="muted tracking-note">{feedback.tracking}</p>}<div className="stats-grid">{values.map(([label,value],index)=><div key={label} className="result-stat" style={{animationDelay:`${index*CONFIG.polish.staggerMs}ms`,animationDuration:`${CONFIG.polish.enterMs}ms`} as CSSProperties}><span>{label}</span><strong>{value}</strong></div>)}</div><p className="session-signoff">Your pace. Your rhythm. A little time for movement.</p><Button variant="secondary" onClick={onDone}>DONE FOR NOW</Button><Button onClick={onReplay}>PLAY AGAIN</Button><Button variant="secondary" onClick={onSongs}>CHOOSE SONG</Button><Button variant="secondary" onClick={onCalibrate}>RECALIBRATE</Button><small className="muted">Ranks are for fun and measure game performance only. Scores aren&apos;t saved. Nothing leaves your device.</small></section>;
}
