import { useEffect, useRef, useState } from 'react';
import { CameraSurface } from '../camera/CameraSurface';
import { Button } from '../ui/Button';
import type { PoseEngine } from '@/lib/pushup/engine';
import { MovementSession } from '@/lib/pushup/movement-session';
import { normalizePose } from '@/lib/pushup/signals';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
export function Practice({engine,onReady}:{engine?:PoseEngine;onReady:()=>void}) {
 const [reps,setReps]=useState(0),[last,setLast]=useState('Find your top position.');
 const fill=useRef<HTMLDivElement>(null);
 useEffect(()=>{
   const session=new MovementSession(event=>{setLast(event.type==='DOWN'?'DOWN detected':'UP detected');setReps(session.reps.count);});
   const off=engine?.onFrame(frame=>{
     const cal=engine.calibration,ok=!!cal&&frame.ok&&engine.getSnapshot().usable;
     const p=cal?normalizePose(frame,cal).p:1;
     session.update(frame.tPerfMs,p,ok);
     if(fill.current)fill.current.style.transform=`scaleX(${p})`;
   });
   const untrack=engine?.subscribe(()=>{if(!engine.getSnapshot().usable)session.interrupt();});
   function key(e:KeyboardEvent){if(engine||e.repeat||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();session.input({type:e.key==='ArrowUp'?'UP':'DOWN',tPerfMs:performance.now()});}
   window.addEventListener('keydown',key);
   return()=>{off?.();untrack?.();session.interrupt();window.removeEventListener('keydown',key);};
 },[engine]);
 return <section className="screen narrow"><p className="chapter-label">02 / PRACTICE</p><h1>Find your rhythm.</h1><p>Try two comfortable down-and-up movements. No timer, score, or misses.</p>{engine?<CameraSurface engine={engine}/>:<p>Keyboard: ↓ then ↑. Leave a moment between each movement.</p>}<div className="calibration-progress"><div ref={fill}/></div><p role="status">{last} · {reps} / {CONFIG.practice.reps} pairs</p><Button disabled={reps<CONFIG.practice.reps} onClick={onReady}>START SONG</Button><p className="muted">A filled target means you reached its position. Points come from reaching it on the beat.</p></section>;
}
