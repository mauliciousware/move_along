'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { CameraPermission } from './screens/CameraPermission';
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
import { PUSHUP_SONGS, type PushupSong } from '@/lib/shared/pushup-songs';
import { CONFIG } from '@/lib/shared/config';
import { unlockAudio } from '@/lib/audio-engine/cues';

type Screen='intro'|'safety'|'songs'|'camera'|'calibration'|'practice'|'game'|'results';
export default function Workout(){
 const router=useRouter();
 const [engine]=useState(()=>new PoseEngine());
 const [screen,setScreen]=useState<Screen>('intro');
 const [keyboard,setKeyboard]=useState(false);
 const [song,setSong]=useState<PushupSong>(PUSHUP_SONGS[0]);
 const [runtime,setRuntime]=useState(()=>new GameRuntime(PUSHUP_SONGS[0].map,PUSHUP_SONGS[0]));
 const [stats,setStats]=useState<Stats>(newStats);
 const [debug]=useState(()=>new URLSearchParams(location.search).get('debug')==='1');
 const [notice,setNotice]=useState('');
 const [songAvailable,setSongAvailable]=useState<Record<string,boolean>>({});
 useEffect(()=>{
   if(screen!=='songs')return;
   const controller=new AbortController();
   for(const track of PUSHUP_SONGS)void fetch(track.file,{method:'HEAD',signal:controller.signal}).then(response=>{if(!controller.signal.aborted)setSongAvailable(current=>({...current,[track.id]:response.ok}));}).catch(()=>{if(!controller.signal.aborted)setSongAvailable(current=>({...current,[track.id]:false}));});
   return()=>controller.abort();
 },[screen]);
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
 function choose(selected:PushupSong){setSong(selected);setRuntime(new GameRuntime(selected.map,selected));setKeyboard(false);setNotice('');setScreen('camera');void unlockAudio();}
 function finish(result:Stats){engine.stop();setStats(result);setScreen('results');}
 function stop(){finish(runtime.end(true));}
 const active=['camera','calibration','practice','game'].includes(screen);
 return <div className={`pushup-experience ${screen==='game'?'in-game':''}`}>
   <header className="pushup-header"><button className="brand" onClick={()=>{runtime.dispose();engine.stop();router.push('/');}}>move along.</button><Badge font="retro" variant="secondary">{keyboard?'Keyboard demo':'Push-up rhythm'}</Badge>{active&&screen!=='game'&&<Button variant="danger" onClick={stop}>STOP</Button>}</header>
   <main id="main-content">
   {notice&&active&&screen!=='game'&&<p className="pushup-notice" role="status">{notice}</p>}
   {screen==='intro'&&<section className="screen narrow pushup-intro"><Badge font="retro" variant="secondary">PLAYABLE / 01</Badge><h1>Down. Up.<br/>On the beat.</h1><MovementArt exercise="pushup"/><p>One song. Your movement as the controller. Learn your range, try the targets, then play.</p><div className="pushup-instructions"><span>01 · Phone on the floor, facing you</span><span>02 · Calibrate + practice at your pace</span><span>03 · Follow UP, DOWN, HOLD and REST</span></div><Button onClick={begin}>LET’S PLAY</Button><p className="muted">Knee push-ups are an option. Stop or rest whenever you want.</p></section>}
   {screen==='safety'&&<section className="screen narrow"><h1>Before we move.</h1><p>Stop exercising if you feel pain or dizziness. Go at your own pace. Rest anytime.</p><p>This is a rhythm game, not medical advice or a form assessment. Scores measure timing only.</p><Button onClick={accept}>I UNDERSTAND</Button></section>}
   {screen==='songs'&&<section className="screen narrow"><p className="chapter-label">PICK YOUR SOUNDTRACK</p><h1>A song to move to.</h1><p>Green is UP. Red is DOWN. Orange is HOLD. Follow the next cue after a miss—no catch-up reps.</p><div className="pushup-songs">{PUSHUP_SONGS.map(track=><article key={track.id}><span className="retro">{track.id==='shakira'?'01':'02'}</span><h2>{track.title}</h2><p>{track.artist}</p><p>{track.description}</p>{track.localOnly&&<small>Owner-supplied local demo track</small>}<Button disabled={!songAvailable[track.id]} onClick={()=>choose(track)}>{songAvailable[track.id]===undefined?"CHECKING TRACK…":songAvailable[track.id]?"PLAY THIS SONG":"AUDIO NOT AVAILABLE"}</Button>{songAvailable[track.id]===false&&<p className="muted">This track isn’t installed here. Choose the practice beat below.</p>}</article>)}</div></section>}
   {screen==='camera'&&<CameraPermission engine={engine} debug={debug} onNext={()=>{setNotice('');setScreen('calibration');}} onKeyboard={()=>{engine.stop();setKeyboard(true);setNotice('');setScreen('practice');}}/>}
   {screen==='calibration'&&<Calibration engine={engine} onNext={()=>setScreen('practice')}/>}
   {screen==='practice'&&<Practice engine={keyboard?undefined:engine} onReady={()=>{void unlockAudio();setScreen('game');}}/>}
   {screen==='game'&&<Gameplay runtime={runtime} engine={keyboard?undefined:engine} onEnd={finish} onCalibrate={()=>setScreen(keyboard?'practice':'calibration')}/>}
   {screen==='results'&&<Results title={song.title} stats={stats} feedback={sessionFeedback(runtime.game.notes,stats,!keyboard,runtime.bodySamples,runtime.bodyVisibleSamples)} onDone={()=>router.push('/')} onSongs={()=>setScreen('songs')} onReplay={()=>choose(song)} onCalibrate={()=>choose(song)}/>}
   </main>
   {screen!=='game'&&<footer className="pushup-footer">Processed on your device. Scores stay in this session.</footer>}
 </div>;
}
