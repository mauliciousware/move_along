import { OverlayControl } from '@/components/pushup/pose/OverlayControl';
import { visibleJoint } from '@/lib/pushup/body-overlay';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MovementSession } from '@/lib/pushup/movement-session';
import { normalizePose } from '@/lib/pushup/signals';
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
export function Gameplay({ onEnd, onCalibrate, engine, runtime }: { runtime: GameRuntime; engine?: PoseEngine; onEnd: (stats: Stats) => void; onCalibrate: () => void }) {
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
    const movement=new MovementSession(event=>{runtime.input(event);runtime.setReps(baseline+movement.reps.count);});
    const unpause=runtime.subscribe(()=>{if(runtime.getSnapshot().phase!=='playing')movement.interrupt();});
    let previousP=1, previousTime=0;
    const unsubscribe=engine?.onFrame(frame=>{
      if(runtime.getSnapshot().phase!=='playing'){movement.interrupt();return;}
      if(frame.ok && !runtime.game.getRest(runtime.songMs)) {
        runtime.observeBody(visibleJoint(frame.joints?.leftElbow) && visibleJoint(frame.joints?.rightElbow));
      }
      const cal=engine.calibration, ok=!!cal && frame.ok && engine.getSnapshot().tracking==='TRACKING';
      if(runtime.game.getRest(runtime.songMs)){movement.interrupt();return;}
      const p=cal?normalizePose(frame,cal).p:1;
      const velocity=previousTime && frame.tPerfMs>previousTime ? (p-previousP)/((frame.tPerfMs-previousTime)/1000):Infinity;
      runtime.setSignal(p,velocity,ok?frame.tPerfMs:-Infinity);previousP=p;previousTime=frame.tPerfMs;
      movement.update(frame.tPerfMs,p,ok);
    });
    function tracking(){runtime.setTracking(engine ? (engine.getSnapshot().usable ? 'TRACKING' : engine.getSnapshot().tracking === 'LOST_LONG' ? 'LOST_LONG' : 'LOST') : 'TRACKING');if(runtime.tracking!=='TRACKING')movement.interrupt();}
    const untrack=engine?.subscribe(tracking);tracking();
    function key(event:KeyboardEvent) {
      if(event.key==='Escape'){runtime.pause();movement.interrupt();setSheet('pause');return;}
      if(event.repeat)return;
      if(event.key==='[' || event.key===']') {if(new URLSearchParams(location.search).get('dev')==='1'){runtime.nudgeOffset(event.key===']'?1:-1);}return;}
      if(engine || runtime.getSnapshot().phase!=='playing' || runtime.game.getRest(runtime.songMs))return;
      if(event.code==='Space'){event.preventDefault();runtime.setSpace(true);return;}
      if(!['ArrowDown','ArrowUp'].includes(event.key))return;
      event.preventDefault();runtime.setSignal(event.key==='ArrowUp'?1:0,0,performance.now());
      movement.input({type:event.key==='ArrowUp'?'UP':'DOWN',tPerfMs:performance.now()});
    }
    const keyup=(event:KeyboardEvent)=>{if(event.code==='Space')runtime.setSpace(false);};
    const blur=()=>{runtime.setSpace(false);movement.interrupt();runtime.pause();};
    const visibility=()=>{if(document.hidden)blur();};
    window.addEventListener('keydown',key);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
    let raf=0,lastDiagnostics=0,lastClock=0;
    const dev=new URLSearchParams(location.search).get('dev')==='1';
    function paint(now:number) {
      if(progress.current)progress.current.style.transform=`scaleX(${Math.max(0,Math.min(1,runtime.songMs/runtime.game.map.durationMs))})`;
      if(elapsed.current && now-lastClock>=CONFIG.targets.hudIntervalMs){lastClock=now;elapsed.current.textContent=formatTime(runtime.songMs);
        if(milestones.current)Array.from(milestones.current.children).forEach((element,index)=>{(element as HTMLElement).dataset.reached=String(runtime.songMs/runtime.game.map.durationMs>=(index+1)/CONFIG.targets.milestoneCount);});}
      if(dev && diagnostics.current && now-lastDiagnostics>=CONFIG.camera.metricsWindowMs){lastDiagnostics=now;diagnostics.current.textContent=`${runtime.fps.toFixed(0)} FPS · ${Math.max(0,runtime.songMs/1000).toFixed(1)}s / ${runtime.game.map.durationMs/1000}s\np ${runtime.p.toFixed(2)} · ${movement.detector.state} · delay ${runtime.game.latency}ms\nLast Δ ${runtime.game.judgment?.delta.toFixed(0)??'—'}ms · offset ${runtime.audio.offsetMs}ms\n${runtime.game.map.sections.find(s=>runtime.songMs>=s.startMs && runtime.songMs<s.endMs)?.label??'countdown'} · skipped ${runtime.game.stats.skipped}`;}
      raf=requestAnimationFrame(paint);
    }
    raf=requestAnimationFrame(paint);
    return()=>{unpause();unsubscribe?.();untrack?.();cancelAnimationFrame(raf);movement.interrupt();runtime.setSpace(false);window.removeEventListener('keydown',key);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
  },[engine,runtime]);
  useEffect(()=>{if(state.phase==='ended')endRef.current({...runtime.game.stats});},[state.phase,runtime]);
  const stats=runtime.game.stats;
  const finish=()=>{runtime.end(true);};
  const pause=(kind:'pause'|'stop')=>{runtime.pause();setSheet(kind);};
  const resume=()=>{setSheet(null);runtime.reenter();};
  const showPause=sheet==='pause' || state.phase==='paused' && !sheet;
  const plannedReps=runtime.game.map.notes.filter(note=>note.type==='UP').length;
  const tierProgress=Math.min(1,stats.combo/CONFIG.game.tierCombos[CONFIG.game.tierCombos.length-1]);
  return <section className="game-column pump-game" aria-label="MOVE ALONG workout">
    <div className="arena">
      <div style={{"--tier-reset-ms": `${CONFIG.animation.tierResetMs}ms`} as React.CSSProperties} className={`play-stage tier-${Math.min(4,CONFIG.game.tierCombos.filter(n=>stats.combo>=n).length)}`}>
        {engine?<CameraSurface engine={engine} lanes runtime={runtime}/>:<GameCanvas runtime={runtime}/>}
        {(state.phase==='countdown' || state.phase==='reentry') && <Countdown count={state.count} reentry={state.phase==='reentry'}/>}
        {state.phase==='loading' && <div className="game-message" role="status">Loading local audio…</div>}
        {state.phase==='lost' && <div className="game-message" role="status">STEP BACK — I CAN&apos;T SEE YOU<br/><small>Music paused. Find your position, then resume.</small><Button onClick={resume}>READY TO RESUME</Button></div>}
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
        <div className="combo-block"><span className="console-eyebrow">COMBO</span><strong key={stats.combo} className="combo-number">{String(stats.combo).padStart(2,'0')}</strong><span className="combo-caption">{stats.combo>=CONFIG.game.tierCombos[3]?'ON FIRE':stats.combo?'KEEP THE RHYTHM':'FIND YOUR RHYTHM'}</span></div>
        <div className="score-block"><span className="console-eyebrow">SCORE</span><strong className="arena-score">{stats.score.toLocaleString()}</strong><span className="multiplier"><span aria-hidden="true">ϟ</span> ×{multiplier(stats.combo)} <small>STREAK</small></span></div>
      </div>
      <aside className="combo-ladder" aria-label={`Combo tier progress: ${stats.combo}`}>
        {[...CONFIG.game.tierCombos].reverse().map(value=><span key={value} className={stats.combo>=value?'earned':''} aria-label={`${value} combo${stats.combo>=value?' reached':''}`}>✦<small>{value}</small></span>)}
        <div className="ladder-meter"><div style={{transform:`scaleY(${tierProgress})`}}/></div>
      </aside>
      <footer className="workout-dock">
        <div className="rep-readout"><span className="console-eyebrow">REPS</span><strong>{stats.pushups}<small> / {plannedReps}</small></strong></div>
        <div className="dock-progress"><span className="console-eyebrow">SONG PROGRESS</span><div className="progress-milestones" ref={milestones} aria-hidden="true">{Array.from({length:CONFIG.targets.milestoneCount},(_,index)=><span key={index}>✦</span>)}</div><div className="music-progress" aria-label="Song progress"><div ref={progress}/></div></div>
        <div className="accuracy-readout"><span className="console-eyebrow">ACCURACY</span><strong>{accuracyLabel(stats)}</strong><span className="accuracy-rule"/></div>
      </footer>
    </div>
    <p className="game-instruction">{!engine?'KEYBOARD · ↓ lower · ↑ push up · Space to hold':'CAMERA ACTIVE · Lower. Push up. Meet the beat.'}<span>Processed on this device</span></p>
    <pre className="game-diagnostics" ref={diagnostics}/>
    {sheet==='stop' && <Modal title="End workout?" onClose={resume}><p>You can rest anytime.</p><Button variant="danger" onClick={finish}>END & SEE SCORE</Button><Button variant="secondary" onClick={resume}>KEEP GOING</Button></Modal>}
    {showPause && <Modal title="TAKE A BREATHER." onClose={resume}><Button onClick={resume}>RESUME</Button><>{engine && <OverlayControl value={overlayMode} onChange={mode=>{runtime.setBodyOverlay(mode);engine?.setBodyOverlay(mode);setOverlayMode(mode);}}/>}</><Slider label="INPUT DELAY (ms)" value={delay} max={CONFIG.maxInputLatencyMs} onChange={value=>{setDelay(value);runtime.setLatency(value);}}/><Button variant="secondary" onClick={()=>{runtime.setSfx(!sfx);setSfx(!sfx);}}>HIT SOUND {sfx?'ON':'OFF'}</Button><Button variant="secondary" onClick={async()=>{if(await runtime.prepareCalibration())onCalibrate();}}>RECALIBRATE</Button><Button variant="danger" onClick={finish}>END WORKOUT</Button></Modal>}
  </section>;
}
