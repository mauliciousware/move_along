'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Workout from '@/components/pushup/workout';
import { Button } from '@/components/pushup/ui/Button';
import { MovementArt } from '@/components/illustrations/movement-art';
import { ROUTINES, EXERCISES } from '@/data/catalog';
import { aggregateRoutine, continueRoutine, finishBlock, initialRoutine } from '@/lib/game-engine/routine';
import { accuracyLabel } from '@/lib/game-engine/scoring';
import { PUSHUP_CONFIG } from '@/lib/shared/config';

export default function RoutineWorkout({id}:{id:'standing'|'mix'}) {
 const router=useRouter();
 const routine=ROUTINES[id];
 const [state,setState]=useState(initialRoutine);
 const [now,setNow]=useState(()=>performance.now());
 useEffect(()=>{
  if(state.phase!=='rest')return;
  const timer=setInterval(()=>setNow(performance.now()),PUSHUP_CONFIG.targets.hudIntervalMs);
  return()=>clearInterval(timer);
 },[state.phase]);
 if(state.phase==='workout')return <Workout key={state.index} exercise={routine.exercises[state.index]} onComplete={result=>{const time=performance.now();setNow(time);setState(current=>finishBlock(current,result,routine.exercises.length,time));}}/>;
 const next=routine.exercises[state.index+1];
 const remaining=Math.max(0,Math.ceil((state.restUntil-now)/1000));
 const total=aggregateRoutine(state.results);
 return <div className="pushup-experience"><main id="main-content"><section className="screen narrow">
  <p className="chapter-label">{routine.name}</p>
  {state.phase==='rest'?<>
   <h1>Take a breather.</h1><p role="status">{remaining?`${remaining} seconds of rest remaining`:'Continue whenever you are ready.'}</p>
   <h2>Next: {EXERCISES[next].name}</h2><MovementArt exercise={next}/>
   <p>{EXERCISES[next].placement}</p><p>{next==='pushup'?'Move your phone to the floor.':'Keep the standing setup.'} We will check framing and calibrate again. Music stays off during setup.</p>
   <Button disabled={remaining>0} onClick={()=>setState(current=>continueRoutine(current,performance.now()))}>CONTINUE WHEN READY</Button>
   <Button variant="danger" onClick={()=>setState(current=>({...current,phase:'results'}))}>STOP</Button>
  </>:<>
   <h1>Your routine results.</h1><p>{state.results.filter(r=>r.outcome==='complete').length} completed · {state.results.filter(r=>r.outcome==='skipped').length} skipped · {state.results.filter(r=>r.outcome==='stopped').length} ended early · {routine.exercises.length-state.results.length} unplayed movements</p>
   <div className="stats-grid"><div><span>Push-ups</span><strong>{total.counts.pushup}</strong></div><div><span>Squats</span><strong>{total.counts.squat}</strong></div><div><span>Knee raises</span><strong>{total.counts.march}</strong></div><div><span>Rhythm accuracy</span><strong>{accuracyLabel(total.stats)}</strong></div></div>
   <p>Combined accuracy uses all judged cues: (100 × {total.stats.perfect} + 75 × {total.stats.good} + 40 × {total.stats.ok}) ÷ (100 × {total.stats.perfect+total.stats.good+total.stats.ok+total.stats.miss}). With zero judged cues, accuracy is unavailable. Unplayed and tracking-skipped cues are excluded. Reps and steps stay separate.</p>
   {state.results.map((result,index)=><article key={index} className="routine-block-result"><h2>{EXERCISES[result.exercise].name}</h2><p>{result.outcome} · {result.stats.pushups} {result.exercise==='march'?'steps':'reps'} · {accuracyLabel(result.stats)} timing accuracy</p><p>{result.analysis.coverage===null?'No camera coverage measured.':`${result.analysis.coverage}% of received gameplay frames were usable (${result.analysis.validFrames}/${result.analysis.observedFrames}).`}</p><MovementArt exercise={result.exercise}/><ol>{EXERCISES[result.exercise].instructions.map(line=><li key={line}>{line}</li>)}</ol></article>)}
   <p>Illustrations are general movement guides. This game does not measure posture or rep quality. Results stay in memory.</p><Button onClick={()=>router.push('/')}>DONE</Button>
  </>}
 </section></main></div>;
}
