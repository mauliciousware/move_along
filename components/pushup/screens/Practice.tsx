import { useEffect, useRef, useState } from 'react';
import { CameraSurface } from '../camera/CameraSurface';
import { Button } from '../ui/Button';
import type { PoseEngine } from '@/lib/pushup/engine';
import type { ExerciseId } from '@/lib/shared/types';
import { ExerciseMovement } from '@/lib/exercises/movement';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import { speakLocally,stopSpeech,unlockAudio } from '@/lib/audio-engine/cues';
export function Practice({engine,onReady,exercise='pushup'}:{engine?:PoseEngine;onReady:()=>void;exercise?:ExerciseId}) {
 const [reps,setReps]=useState(0),[last,setLast]=useState('Find your starting position.'),[starting,setStarting]=useState(false);
 const fill=useRef<HTMLDivElement>(null),next=useRef(onReady);
 useEffect(()=>{next.current=onReady;},[onReady]);
 useEffect(()=>{
   let timer:ReturnType<typeof setTimeout>|undefined;
   const session=new ExerciseMovement(exercise,event=>{setLast(`${event.type} detected`);setReps(session.count);
    const ready=exercise==='march'?session.leftCount>=CONFIG.practice.reps&&session.rightCount>=CONFIG.practice.reps:session.count>=CONFIG.practice.reps;
    if(ready&&engine&&!timer){setStarting(true);speakLocally('Practice complete. Find your starting position. The game will begin.');timer=setTimeout(()=>{if(engine.getSnapshot().usable)next.current();else {timer=undefined;setStarting(false);}},CONFIG.practice.readyMs);}
   });
   const off=engine?.onFrame(frame=>{
     const signal=engine.signal(frame);signal.ok&&=engine.getSnapshot().usable;
     session.update(frame.tPerfMs,signal);
     if(fill.current)fill.current.style.transform=`scaleX(${exercise==='march'?Math.max(signal.left,signal.right):signal.p})`;
   });
   const untrack=engine?.subscribe(()=>{if(!engine.getSnapshot().usable){session.interrupt();clearTimeout(timer);timer=undefined;setStarting(false);}});
   function key(e:KeyboardEvent){const mapping={ArrowUp:'UP',ArrowDown:'DOWN',ArrowLeft:'LEFT',ArrowRight:'RIGHT'} as const;if(engine||e.repeat||!(e.key in mapping))return;e.preventDefault();session.input({type:mapping[e.key as keyof typeof mapping],tPerfMs:performance.now()});}
   window.addEventListener('keydown',key);
   return()=>{off?.();untrack?.();session.interrupt();clearTimeout(timer);stopSpeech();window.removeEventListener('keydown',key);};
 },[engine,exercise]);
 const needed=CONFIG.practice.reps*(exercise==='march'?2:1);
 return <section className="screen narrow"><p className="chapter-label">02 / PRACTICE</p><h1>Try your targets.</h1><p>{exercise==='march'?'Lift and lower each knee twice, returning both feet between lifts.':'Try two comfortable down-and-up movements.'} The game starts automatically after practice.</p>{engine?<CameraSurface engine={engine}/>:<p>Keyboard: {exercise==='march'?'← left knee · → right knee':'↓ then ↑'}. Leave a moment between movements.</p>}<div className="calibration-progress"><div ref={fill}/></div><p role="status">{starting?'Ready! Starting automatically…':`${last} · ${reps} / ${needed} ${exercise==='march'?'steps':'pairs'}`}</p><Button disabled={reps<needed} onClick={()=>{void unlockAudio();next.current();}}>START NOW</Button><p className="muted">A filled target means you reached its position. Points come from timing.</p></section>;
}
