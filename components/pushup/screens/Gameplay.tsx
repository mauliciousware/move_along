import { OverlayControl } from '@/components/pushup/pose/OverlayControl';
import { visibleJoint } from '@/lib/pushup/body-overlay';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ExerciseMovement } from '@/lib/exercises/movement';
import type { ExerciseId } from '@/lib/shared/types';
import { CameraSurface } from '@/components/pushup/camera/CameraSurface';
import type { PoseEngine } from '@/lib/pushup/engine';
import type { GameRuntime } from '@/lib/game-engine/runtime';
import { accuracyLabel, multiplier, type Stats } from '@/lib/game-engine/scoring';
import { GameCanvas } from '@/components/pushup/game/GameCanvas';
import { Button } from '@/components/pushup/ui/Button';
import { Modal } from '@/components/pushup/ui/Modal';
import { Slider } from '@/components/pushup/ui/Slider';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import { Countdown } from './Countdown';
export function Gameplay({ onEnd, onCalibrate, engine, runtime, exercise="pushup" }: { exercise?:ExerciseId; runtime: GameRuntime; engine?: PoseEngine; onEnd: (stats: Stats) => void; onCalibrate: () => void }) {
  const state=useSyncExternalStore(runtime.subscribe,runtime.getSnapshot,runtime.getSnapshot);
  const [sheet,setSheet]=useState<'pause'|'stop'|null>(null);
  const [delay,setDelay]=useState<number>(runtime.game.latency);
  const [overlayMode,setOverlayMode]=useState(engine?.bodyOverlay ?? runtime.bodyOverlay);
  const [sfx,setSfx]=useState(runtime.sfx);
  const progress=useRef<HTMLDivElement>(null), diagnostics=useRef<HTMLPreElement>(null);
  const elapsed=useRef<HTMLSpanElement>(null);
  const milestones=useRef<HTMLDivElement>(null);
  const formatTime=(ms: number)=>`${Math.floor(Math.max(0,ms)/60000)}:${String(Math.floor(Math.max(0,ms)/1000)%60).padStart(2,'0')}`;
  const endRef=useRef(onEnd);
  useEffect(()=>{endRef.current=onEnd;},[onEnd]);
  useEffect(()=>{engine?.noteRender();});
  useEffect(()=>{
    runtime.setKeyboard(!engine);
    if(engine)runtime.setBodyOverlay(engine.bodyOverlay);
    if(runtime.getSnapshot().phase==='paused')runtime.reenter();else void runtime.start();
    const baseline=runtime.game.stats.pushups;
    const movement=new ExerciseMovement(exercise,event=>{runtime.input(event);if(!runtime.game.flow)runtime.setReps(baseline+movement.count);});
    const unpause=runtime.subscribe(()=>{if(runtime.getSnapshot().phase!=='playing')movement.interrupt();});
    let previousP=1, previousTime=0;
    const unsubscribe=engine?.onFrame(frame=>{
      if(runtime.getSnapshot().phase!=='playing'){movement.interrupt();return;}
      if(frame.ok && !runtime.game.getRest(runtime.songMs)) {
        runtime.observeBody(visibleJoint(frame.joints?.leftElbow) && visibleJoint(frame.joints?.rightElbow));
      }
      const signal=engine.signal(frame);const ok=signal.ok && frame.ok && engine.getSnapshot().usable;
      runtime.observeTracking(ok);
      if(runtime.game.getRest(runtime.songMs)){movement.interrupt();return;}
      const cue=runtime.game.notes.find(n=>n.status==='pending')?.note.type;
      const p=exercise==='march'?(cue==='RIGHT'?signal.right:signal.left):signal.p;
      const velocity=previousTime && frame.tPerfMs>previousTime ? (p-previousP)/((frame.tPerfMs-previousTime)/1000):Infinity;
      runtime.setSignal(p,velocity,ok?frame.tPerfMs:-Infinity);previousP=p;previousTime=frame.tPerfMs;
      movement.update(frame.tPerfMs,{...signal,ok});
    });
    function tracking(){runtime.setTracking(engine ? (engine.getSnapshot().usable ? 'TRACKING' : engine.getSnapshot().tracking === 'LOST_LONG' ? 'LOST_LONG' : 'LOST') : 'TRACKING');if(runtime.tracking!=='TRACKING')movement.interrupt();}
    const untrack=engine?.subscribe(tracking);tracking();
    function key(event:KeyboardEvent) {
      if(event.key==='Escape'){runtime.pause();movement.interrupt();setSheet('pause');return;}
      if(event.repeat)return;
      if(event.key==='[' || event.key===']') {if(new URLSearchParams(location.search).get('dev')==='1'){runtime.nudgeOffset(event.key===']'?1:-1);}return;}
      if(engine || runtime.getSnapshot().phase!=='playing' || runtime.game.getRest(runtime.songMs))return;
      if(event.code==='Space'){event.preventDefault();runtime.setSpace(true);return;}
      const keys=exercise==='march'?['ArrowLeft','ArrowRight']:['ArrowDown','ArrowUp'];if(!keys.includes(event.key))return;
      event.preventDefault();runtime.setSignal(exercise==='march'||event.key==='ArrowUp'?1:0,0,performance.now());
      movement.input({type:event.key==='ArrowLeft'?'LEFT':event.key==='ArrowRight'?'RIGHT':event.key==='ArrowUp'?'UP':'DOWN',tPerfMs:performance.now()});
    }
    const keyup=(event:KeyboardEvent)=>{if(event.code==='Space')runtime.setSpace(false);};
    const blur=()=>{runtime.setSpace(false);movement.interrupt();runtime.pause();};
    const visibility=()=>{if(document.hidden)blur();};
    window.addEventListener('keydown',key);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
    let raf=0,lastDiagnostics=0,lastClock=0;
    const dev=new URLSearchParams(location.search).get('dev')==='1';
    function paint(now:number) {
      if(progress.current)progress.current.style.transform=`scaleX(${runtime.game.flow?runtime.game.progress:Math.max(0,Math.min(1,runtime.songMs/runtime.game.map.durationMs))})`;
      if(elapsed.current && now-lastClock>=CONFIG.targets.hudIntervalMs){lastClock=now;elapsed.current.textContent=formatTime(runtime.songMs);
        if(milestones.current)Array.from(milestones.current.children).forEach((element,index)=>{(element as HTMLElement).dataset.reached=String(runtime.songMs/runtime.game.map.durationMs>=(index+1)/CONFIG.targets.milestoneCount);});}
      if(dev && diagnostics.current && now-lastDiagnostics>=CONFIG.camera.metricsWindowMs){lastDiagnostics=now;diagnostics.current.textContent=runtime.game.flow?`${runtime.fps.toFixed(0)} FPS · ${Math.max(0,runtime.flowMs/1000).toFixed(1)}s flow\np ${runtime.p.toFixed(2)} · ${movement.state} · ${runtime.game.current?.note.type??'DONE'}\nSet ${runtime.game.flowSummary.set}/${runtime.game.flowSummary.sets} · rep ${runtime.game.flowSummary.repsInSet}/${runtime.game.flowSummary.repsPerSet}\nHold ${Math.round(runtime.game.stats.plankTimeMs/1000)}s · target ${Math.round((runtime.game.current?.meter?.ratio??0)*100)}%`:`${runtime.fps.toFixed(0)} FPS · ${Math.max(0,runtime.songMs/1000).toFixed(1)}s / ${runtime.game.map.durationMs/1000}s\np ${runtime.p.toFixed(2)} · ${movement.state} · delay ${runtime.game.latency}ms\nLast Δ ${runtime.game.judgment?.delta.toFixed(0)??'—'}ms · offset ${runtime.audio.offsetMs}ms\n${runtime.game.map.sections.find(s=>runtime.songMs>=s.startMs && runtime.songMs<s.endMs)?.label??'countdown'} · skipped ${runtime.game.stats.skipped}`;}
      raf=requestAnimationFrame(paint);
    }
    raf=requestAnimationFrame(paint);
    return()=>{unpause();unsubscribe?.();untrack?.();cancelAnimationFrame(raf);movement.interrupt();runtime.setSpace(false);window.removeEventListener('keydown',key);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
  },[engine,runtime,exercise]);
  useEffect(()=>{if(state.phase==='ended')endRef.current({...runtime.game.stats});},[state.phase,runtime]);
  const stats=runtime.game.stats;
  const flow=runtime.game.flow;
  const summary=runtime.game.flowSummary;
  const finish=()=>{runtime.end(true);};
  const pause=(kind:'pause'|'stop')=>{runtime.pause();setSheet(kind);};
  const resume=()=>{setSheet(null);runtime.reenter();};
  const showPause=sheet==='pause' || state.phase==='paused' && !sheet;
  const plannedReps=flow?summary.totalReps:runtime.game.map.notes.filter(note=>exercise==='march'?note.type==='LEFT'||note.type==='RIGHT':note.type==='UP').length;
  const tierProgress=Math.min(1,stats.combo/CONFIG.game.tierCombos[CONFIG.game.tierCombos.length-1]);
  return <section className="game-column pump-game" aria-label="MOVE ALONG workout">
    <div className="arena">
      <div style={{"--tier-reset-ms": `${CONFIG.animation.tierResetMs}ms`} as React.CSSProperties} className={`play-stage tier-${Math.min(4,CONFIG.game.tierCombos.filter(n=>stats.combo>=n).length)}`}>
        {engine?<CameraSurface engine={engine} lanes runtime={runtime}/>:<GameCanvas runtime={runtime}/>}
        {(state.phase==='countdown' || state.phase==='reentry') && <Countdown count={state.count} reentry={state.phase==='reentry'}/>}
        {state.phase==='loading' && <div className="game-message" role="status">Loading local audio…</div>}
        {state.phase==='lost' && <div className="game-message" role="status">TRACKING LOST — CHECK YOUR POSITION<br/><small>Music paused. Find your position, then resume.</small><Button onClick={resume}>READY TO RESUME</Button></div>}
        {state.phase==='error' && <div className="game-message" role="alert"><p>{state.error}</p><Button onClick={()=>void runtime.start()}>RETRY AUDIO</Button></div>}
      </div>
      <header className="song-console">
        <div className="song-emblem" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M4 34h12l7-20 12 37 9-27 6 10h10"/><circle cx="32" cy="32" r="28"/></svg></div>
        <div className="song-console-title"><span className="console-eyebrow">MOVE ALONG / NOW PLAYING</span><strong>{runtime.title}</strong><span className="console-artist">{runtime.artist} · INTERMEDIATE</span></div>
        <div className="song-time"><span ref={elapsed}>0:00</span><span> / {formatTime(runtime.game.map.durationMs)}</span></div>
        <button className="pause-button" aria-label="Pause workout" onClick={()=>pause('pause')}>Ⅱ</button>
        <button className="stop-button" onClick={finish}>■ STOP</button>
      </header>
      <div className="arena-stats">
        <div className="combo-block"><span className="console-eyebrow">{flow?'SET':'COMBO'}</span><strong key={flow?summary.set:stats.combo} className="combo-number">{flow?`${summary.set}/${summary.sets}`:String(stats.combo).padStart(2,'0')}</strong><span className="combo-caption">{flow?`${summary.repsInSet}/${summary.repsPerSet} REPS THIS SET`:stats.combo>=CONFIG.game.tierCombos[3]?'ON FIRE':stats.combo?'KEEP THE RHYTHM':'FIND YOUR RHYTHM'}</span></div>
        <div className="score-block"><span className="console-eyebrow">SCORE</span><strong className="arena-score">{stats.score.toLocaleString()}</strong><span className="multiplier"><span aria-hidden="true">ϟ</span> ×{multiplier(stats.combo)} <small>STREAK</small></span></div>
      </div>
      <aside className="combo-ladder" aria-label={`Combo tier progress: ${stats.combo}`}>
        {[...CONFIG.game.tierCombos].reverse().map(value=><span key={value} className={stats.combo>=value?'earned':''} aria-label={`${value} combo${stats.combo>=value?' reached':''}`}>✦<small>{value}</small></span>)}
        <div className="ladder-meter"><div style={{transform:`scaleY(${tierProgress})`}}/></div>
      </aside>
      <footer className="workout-dock">
        <div className="rep-readout"><span className="console-eyebrow">{exercise==='march'?'STEPS':'REPS'}</span><strong>{stats.pushups}<small> / {plannedReps}</small></strong></div>
        <div className="dock-progress"><span className="console-eyebrow">{flow?'SESSION PROGRESS':'SONG PROGRESS'}</span>{!flow&&<div className="progress-milestones" ref={milestones} aria-hidden="true">{Array.from({length:CONFIG.targets.milestoneCount},(_,index)=><span key={index}>✦</span>)}</div>}<div className="music-progress" aria-label={flow?'Session progress':'Song progress'}><div ref={progress}/></div></div>
        <div className="accuracy-readout"><span className="console-eyebrow">{flow?'HOLD TIME':'ACCURACY'}</span><strong>{flow?`${Math.floor(stats.plankTimeMs/1000)}s`:accuracyLabel(stats)}</strong>{!flow&&<span className="accuracy-rule"/>}</div>
      </footer>
    </div>
    <p className="game-instruction">{flow?'Close the ring with your movement. The song is background music.':!engine?(exercise==='march'?'KEYBOARD · ← left knee · → right knee':'KEYBOARD · ↓ lower · ↑ rise · Space to hold'):(exercise==='march'?'Lift. Return. Alternate.':'Lower. Rise. Meet the beat.')}<span>Processed on this device</span></p>
    <pre className="game-diagnostics" ref={diagnostics}/>
    {sheet==='stop' && <Modal title="End workout?" onClose={resume}><p>You can rest anytime.</p><Button variant="danger" onClick={finish}>END & SEE SCORE</Button><Button variant="secondary" onClick={resume}>KEEP GOING</Button></Modal>}
    {showPause && <Modal title={flow?'PAUSED.':'TAKE A BREATHER.'} onClose={resume}><Button onClick={resume}>RESUME</Button><>{engine && <OverlayControl value={overlayMode} onChange={mode=>{runtime.setBodyOverlay(mode);engine?.setBodyOverlay(mode);setOverlayMode(mode);}}/>}</>{!flow&&<Slider label="INPUT DELAY (ms)" value={delay} max={CONFIG.maxInputLatencyMs} onChange={value=>{setDelay(value);runtime.setLatency(value);}}/>}<Button variant="secondary" onClick={()=>{runtime.setSfx(!sfx);setSfx(!sfx);}}>HIT SOUND {sfx?'ON':'OFF'}</Button><Button variant="secondary" onClick={async()=>{if(await runtime.prepareCalibration())onCalibrate();}}>RECALIBRATE</Button><Button variant="danger" onClick={finish}>END WORKOUT</Button></Modal>}
  </section>;
}
