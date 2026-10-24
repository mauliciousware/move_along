'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { CameraPermission } from './screens/CameraPermission';
import { StandingCalibration } from './screens/StandingCalibration';
import type { ExerciseId } from '@/lib/shared/types';
import { EXERCISES } from '@/data/catalog';
import { analyzeSession } from '@/lib/game-engine/analysis';
import { Calibration } from './screens/Calibration';
import { Practice } from './screens/Practice';
import { Gameplay } from './screens/Gameplay';
import { Results } from './screens/Results';
import { MovementArt } from '@/components/illustrations/movement-art';
import { Badge } from '@/components/ui/8bit/badge';
import { PoseEngine } from '@/lib/pushup/engine';
import { GameRuntime } from '@/lib/game-engine/runtime';
import { newStats, type Stats } from '@/lib/game-engine/scoring';
import { sessionFeedback } from '@/lib/game-engine/feedback';
import { songsFor, type PushupSong } from '@/lib/shared/pushup-songs';
import { CONFIG } from '@/lib/shared/config';
import { unlockAudio } from '@/lib/audio-engine/cues';

import type { BlockResult } from '@/lib/game-engine/routine';

type Screen='intro'|'safety'|'songs'|'camera'|'calibration'|'practice'|'game'|'results';
export default function Workout({exercise='pushup',onComplete}:{exercise?:ExerciseId;onComplete?:(result:BlockResult)=>void}){
 const [songs]=useState(()=>songsFor(exercise));
 const movement=EXERCISES[exercise];
 const router=useRouter();
 const [engine]=useState(()=>new PoseEngine(exercise));
 const [screen,setScreen]=useState<Screen>('intro');
 const [keyboard,setKeyboard]=useState(false);
 const [song,setSong]=useState<PushupSong>(songs[0]);
 const [runtime,setRuntime]=useState(()=>new GameRuntime(songs[0].map,songs[0]));
 const [stats,setStats]=useState<Stats>(newStats);
 const [debug]=useState(()=>new URLSearchParams(location.search).get('debug')==='1');
 const [notice,setNotice]=useState('');
 const [loadingSong,setLoadingSong]=useState<string|null>(null);
 const loadId=useRef(0), finished=useRef(false);
 useEffect(()=>()=>{loadId.current++;},[]);
 useEffect(()=>()=>{runtime.dispose();},[runtime]);
 useEffect(()=>()=>engine.stop(),[engine]);
 useEffect(()=>{
   let interrupted=false;
   function interrupt(){
     if(interrupted)return;interrupted=true;
     if(['camera','calibration','practice','game'].includes(screen)){
       runtime.pause();engine.stop();setNotice('Camera setup changed or the app was interrupted. Check your position and calibrate again.');
       setScreen(keyboard?'game':'camera');
     }
   }
   function hidden(){if(document.hidden)interrupt();}
   const untrack=engine.subscribe(()=>{if(!keyboard && ['calibration','practice','game'].includes(screen) && ['suspended','error'].includes(engine.getSnapshot().phase))interrupt();});
   document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',interrupt);window.addEventListener('orientationchange',interrupt);
   return()=>{untrack();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',interrupt);window.removeEventListener('orientationchange',interrupt);};
 },[engine,runtime,screen,keyboard]);
 function begin(){let accepted=false;try{accepted=sessionStorage.getItem(CONFIG.sessionKeys.safety)==='yes';}catch{}setScreen(accepted?'songs':'safety');}
 function accept(){try{sessionStorage.setItem(CONFIG.sessionKeys.safety,'yes');}catch{}setScreen('songs');}
 async function choose(selected:PushupSong){
   finished.current=false;
   const id=++loadId.current;
   const activation=unlockAudio(); // Synchronous gesture activation, before network work.
   const nextRuntime=new GameRuntime(selected.map,selected);
   setSong(selected);setRuntime(nextRuntime);setKeyboard(false);setNotice('');setLoadingSong(selected.id);
   try {
     const [,active]=await Promise.all([nextRuntime.audio.load(),activation]);
     if(id!==loadId.current)return;
     if(!active)throw new Error('Safari needs sound enabled. Tap the song again to retry audio.');
     setLoadingSong(null);setScreen('camera');
   } catch(error){if(id===loadId.current){setLoadingSong(null);setNotice(error instanceof Error?error.message:'Could not load the soundtrack. Tap to retry.');}}
 }

 function finish(result:Stats,outcome:BlockResult['outcome']=result.endedEarly?'stopped':'complete'){
   if(finished.current)return;finished.current=true;++loadId.current;
   engine.stop();
   if(onComplete){onComplete({exercise,stats:result,outcome,analysis:analyzeSession(runtime.game.notes,result,runtime.observedFrames,runtime.validFrames,keyboard)});return;}
   setStats(result);setScreen('results');
 }
 function stop(){finish(runtime.end(true));}
 const active=['camera','calibration','practice','game'].includes(screen);
 return <div className={`pushup-experience ${screen==='game'?'in-game':''}`}>
   <header className="pushup-header"><button className="brand" onClick={()=>{runtime.dispose();engine.stop();router.push('/');}}>move along.</button><Badge font="retro" variant="secondary">{keyboard?'Keyboard demo':movement.name}</Badge>{onComplete&&<Button variant="secondary" onClick={()=>finish(runtime.end(true),'skipped')}>SKIP MOVEMENT</Button>}{(active||!!onComplete)&&screen!=='game'&&<Button variant="danger" onClick={stop}>STOP</Button>}</header>
   <main id="main-content">
   {notice&&screen!=='game'&&<p className="pushup-notice" role="status">{notice}</p>}
   {screen==='intro'&&<section className="screen narrow pushup-intro"><Badge font="retro" variant="secondary">PLAYABLE / 01</Badge><h1>{movement.name}.<br/>On the beat.</h1><MovementArt exercise={exercise}/><p>One song. Your movement as the controller. Learn your range, try the targets, then play.</p><div className="pushup-instructions"><span>01 · {exercise==='pushup'?'Phone on the floor':'Full body in view'}</span><span>02 · Calibrate + practice at your pace</span><span>03 · {exercise==='march'?'LEFT, RIGHT and REST':'UP, DOWN, HOLD and REST'}</span></div><Button onClick={begin}>LET’S PLAY</Button><p className="muted">{exercise==='pushup'?'Knee push-ups are an option. ':''}Stop or rest whenever you want.</p></section>}
   {screen==='safety'&&<section className="screen narrow"><h1>Before we move.</h1><p>Stop exercising if you feel pain or dizziness. Go at your own pace. Rest anytime.</p><p>This is a rhythm game, not medical advice or a form assessment. Scores measure timing only.</p><Button onClick={accept}>I UNDERSTAND</Button></section>}
   {screen==='songs'&&<section className="screen narrow"><p className="chapter-label">PICK YOUR SOUNDTRACK</p><h1>A song to move to.</h1><p>{exercise==='march'?'Lift the named knee, then return both feet. Left and right refer to your own body.':'Green is UP. Red is DOWN. Orange is HOLD.'} Follow the next cue after a miss—no catch-up reps.</p><div className="pushup-songs">{songs.map(track=><article key={track.id}><span className="retro">{track.id==='shakira'?'01':'02'}</span><h2>{track.title}</h2><p>{track.artist}</p><p>{track.description}</p>{track.localOnly&&<small>Owner-supplied local demo track</small>}<Button disabled={loadingSong!==null} onClick={()=>void choose(track)}>{loadingSong===track.id?'LOADING AUDIO…':'PLAY THIS SONG'}</Button></article>)}</div></section>}
   {screen==='camera'&&<CameraPermission engine={engine} debug={debug} onNext={()=>{setNotice('');setScreen('calibration');}} onKeyboard={()=>{engine.stop();setKeyboard(true);setNotice('');setScreen('practice');}}/>}
   {screen==='calibration'&&(exercise==='pushup'?<Calibration engine={engine} onNext={()=>setScreen('practice')}/>:<StandingCalibration engine={engine} onNext={()=>setScreen('practice')}/>)}
   {screen==='practice'&&<Practice exercise={exercise} engine={keyboard?undefined:engine} onReady={()=>{void unlockAudio();setScreen('game');}}/>}
   {screen==='game'&&<Gameplay exercise={exercise} runtime={runtime} engine={keyboard?undefined:engine} onEnd={finish} onCalibrate={()=>setScreen(keyboard?'practice':'calibration')}/>}
   {screen==='results'&&<Results exercise={exercise} analysis={analyzeSession(runtime.game.notes,stats,runtime.observedFrames,runtime.validFrames,keyboard)} title={song.title} stats={stats} feedback={sessionFeedback(runtime.game.notes,stats,!keyboard,runtime.bodySamples,runtime.bodyVisibleSamples,exercise)} onDone={()=>router.push('/')} onSongs={()=>setScreen('songs')} onReplay={()=>choose(song)} onCalibrate={()=>choose(song)}/>}
   </main>
   {screen!=='game'&&<footer className="pushup-footer">Processed on your device. Scores stay in this session.</footer>}
 </div>;
}
