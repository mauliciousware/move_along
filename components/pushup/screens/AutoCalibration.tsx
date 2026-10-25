'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CameraSurface } from '../camera/CameraSurface';
import { Calibration } from './Calibration';
import { Button } from '../ui/Button';
import { FRAMING_COPY } from '@/lib/pose-engine/framing';
import { unlockAudio } from '@/lib/audio-engine/cues';
import { PUSHUP_CONFIG } from '@/lib/shared/config';
import type { PoseEngine } from '@/lib/pushup/engine';

/** Framing and measurement share one screen; no setup confirmation tap. */
export function AutoCalibration({ engine, complete, onComplete }: { engine: PoseEngine; complete: boolean; onComplete: () => void }) {
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [measuring, setMeasuring] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(PUSHUP_CONFIG.handsFree.preparationSeconds);
  const next = useRef(onComplete);
  useEffect(() => { next.current = onComplete; }, [onComplete]);
  useEffect(() => {
    if (state.phase !== 'running' || complete || secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [state.phase, complete, secondsLeft]);
  useEffect(() => {
    if (secondsLeft > 0 || !state.usable || state.phase !== 'running' || measuring || complete) return;
    const timer = setTimeout(() => {
      if (engine.getSnapshot().usable) setMeasuring(true);
    }, PUSHUP_CONFIG.handsFree.framingMs);
    return () => clearTimeout(timer);
  }, [engine, state.usable, state.phase, measuring, complete, secondsLeft]);

  const framing = FRAMING_COPY[state.issue];
  return <section className="screen calibration calibration-stage" aria-label="Camera calibration">
    <CameraSurface engine={engine} />
    <div className="calibration-panel">
      {complete ? <><p className="chapter-label">SETUP COMPLETE</p><h1>You’re ready.</h1><p role="status">Getting your music ready…</p></>
         : secondsLeft > 0 && state.phase === 'running' ? <>
          <p className="chapter-label">READY TO CALIBRATE</p>
          <h1>Get ready.</h1>
          <p>{engine.exercise === 'pushup' ? 'Place your phone and get into plank position.' : 'Place your phone upright and stand in view. Show your hips, knees and ankles.'}</p>
          <div className="calibration-countdown" role="timer" aria-live="polite" aria-atomic="true">{secondsLeft}</div>
          <p className="calibration-status">Follow the position prompts and pause briefly at each one.</p>
        </>
        : measuring && state.phase === 'running' ? <Calibration embedded engine={engine} onNext={() => next.current()} />
        : <>
          <p className="chapter-label">01 / FIND YOUR POSITION</p>
          <h1>{state.usable ? 'Stay right there.' : 'Get into view.'}</h1>
          <p>{engine.exercise === 'pushup' ? 'Phone near the floor, slightly to your side. Show your shoulders, elbows, wrists and hips.' : 'Phone upright, slightly diagonal to you. Start standing; show your head, hips, knees and ankles.'}</p>
          <p className="calibration-status" role="status">{state.error ?? (state.usable ? 'Body found. Next we will check your starting posture.' : state.phase === 'requesting' ? 'Allow camera access to begin.' : state.phase === 'loading' ? 'Starting local movement tracking…' : `${framing.title}. ${framing.detail}`)}</p>
        </>}
      {['idle', 'error', 'suspended'].includes(state.phase) && <Button onClick={() => { void unlockAudio(); void engine.start(); }}>{state.phase === 'error' ? 'RETRY CAMERA' : 'RESUME CALIBRATION'}</Button>}
    </div>
  </section>;
}
