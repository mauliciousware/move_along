import { useEffect,useRef,useState } from 'react';
import { StandingCalibrationSession,STANDING_STEPS } from '@/lib/exercises/standing';
import type { PoseEngine } from '@/lib/pushup/engine';
import { calibrationCue,speakLocally,stopSpeech } from '@/lib/audio-engine/cues';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import { CameraSurface } from '../camera/CameraSurface';
export function StandingCalibration({engine,onNext}:{engine:PoseEngine;onNext:()=>void}){
 const [state,setState]=useState<{step:number;message:string;ready:boolean}>({step:0,message:STANDING_STEPS[engine.exercise==='march'?'march':'squat'][0],ready:false});
 const progress=useRef<HTMLDivElement>(null),next=useRef(onNext);
 useEffect(()=>{next.current=onNext;},[onNext]);
 useEffect(()=>{
  engine.clearCalibration();let timer:ReturnType<typeof setTimeout>|undefined,raf=0;
  const session=new StandingCalibrationSession(engine.exercise==='march'?'march':'squat',()=>{
   setState({step:session.step,message:session.message,ready:!!session.result});speakLocally(session.message);calibrationCue(session.step%3);
   if(session.result){engine.setStandingCalibration(session.result);timer=setTimeout(()=>next.current(),CONFIG.calibration.readyMs);}
  });
  speakLocally(session.message);
  function draw(now:number){session.update(engine.getSnapshot().usable?engine.camera.frame:null,now);if(progress.current)progress.current.style.transform=`scaleX(${session.progress})`;raf=requestAnimationFrame(draw);}
  raf=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(raf);clearTimeout(timer);stopSpeech();};
 },[engine]);
 return <section className="screen narrow"><p>Automatic calibration · {state.step+1} / {STANDING_STEPS[engine.exercise==='march'?'march':'squat'].length}</p><h1>{state.ready?'Ready!':'Make it yours.'}</h1><p role="status">{state.message}</p><CameraSurface engine={engine}/><div className="calibration-progress"><div ref={progress}/></div><p>Stay in view. Each step completes automatically when your movement settles.</p></section>;
}
