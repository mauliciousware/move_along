'use client';
import { unlockAudio } from '@/lib/audio-engine/cues';
import { useEffect,useRef,useSyncExternalStore } from 'react';
import { Button } from '@/components/pushup/ui/Button';
import { MovementArt } from '@/components/illustrations/movement-art';
import { PlacementGuide } from '@/components/pushup/ui/PlacementGuide';
import { CameraSurface } from '@/components/pushup/camera/CameraSurface';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import type { PoseEngine } from '@/lib/pushup/engine';
export function CameraPermission({engine,debug,onNext,onKeyboard}:{engine:PoseEngine;debug:boolean;onNext:()=>void;onKeyboard:()=>void}){
 const state=useSyncExternalStore(engine.subscribe,engine.getSnapshot,engine.getSnapshot),next=useRef(onNext);
 useEffect(()=>{next.current=onNext;},[onNext]);
 useEffect(()=>{
  if(!state.usable||state.phase!=='running')return;
  const timer=setTimeout(()=>{if(engine.getSnapshot().usable)next.current();},CONFIG.handsFree.framingMs);
  return()=>clearTimeout(timer);
 },[state.usable,state.phase,engine]);
 const floor=engine.exercise==='pushup';
 return <section className="screen narrow"><h1>Set your phone. Step into view.</h1>
 {state.phase==='idle'?(floor?<PlacementGuide/>:<MovementArt exercise={engine.exercise}/>):<CameraSurface engine={engine}/>}
 <p>{floor?'Phone on the floor, facing you. Show your head, shoulders and elbows.':'Prop your phone upright, facing you. Keep your head, hips, knees and feet in view.'}</p>
 <p>Tap once, then get into position. Calibration starts automatically after you stay in view.</p>
 {['idle','error','suspended'].includes(state.phase)&&<Button onClick={()=>{void unlockAudio();void engine.start();}}>ENABLE CAMERA + AUTO SETUP</Button>}
 {state.phase==='running'&&<p role="status">{state.usable?'You’re in view. Calibration starts in a moment…':'Find a position where the camera can see your movement.'}</p>}
 {(state.phase==='loading'||state.phase==='requesting')&&<Button variant="secondary" onClick={()=>engine.stop()}>CANCEL</Button>}
 {debug&&<button className="keyboard-link" onClick={()=>{void unlockAudio();onKeyboard();}}>Use keyboard instead</button>}
 {state.error&&<p role="alert">{state.error}</p>}<small className="muted">Video stays on this device. Nothing is recorded or uploaded.</small></section>;
}
