'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CameraSurface } from '../camera/CameraSurface';
import { Calibration } from './Calibration';
import { Button } from '../ui/Button';
import { unlockAudio } from '@/lib/audio-engine/cues';
import { PUSHUP_CONFIG } from '@/lib/shared/config';
import type { PoseEngine } from '@/lib/pushup/engine';

/** Framing and measurement share one screen; no setup confirmation tap. */
export function AutoCalibration({ engine, complete, onComplete }: { engine: PoseEngine; complete: boolean; onComplete: () => void }) {
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [measuring, setMeasuring] = useState(false);
  const next = useRef(onComplete);
  useEffect(() => { next.current = onComplete; }, [onComplete]);
  useEffect(() => {
    if (!state.usable || state.phase !== 'running' || measuring || complete) return;
    const timer = setTimeout(() => {
      if (engine.getSnapshot().usable) setMeasuring(true);
    }, PUSHUP_CONFIG.handsFree.framingMs);
    return () => clearTimeout(timer);
  }, [engine, state.usable, state.phase, measuring, complete]);

  if (complete) return <section className="screen narrow calibration"><h1>Calibrated.</h1><p role="status">Getting your music ready…</p></section>;
  if (measuring && state.phase === 'running') return <Calibration engine={engine} onNext={() => next.current()} />;

  return <section className="screen narrow calibration">
    <p className="chapter-label">Automatic calibration</p><h1>Step into view.</h1>
    <p>{engine.exercise === 'pushup' ? 'Phone on the floor, facing you. Keep your head, shoulders and elbows in view.' : 'Phone upright beside you. Keep your waist, shoulders and head in view from lying to sitting.'}</p>
    <CameraSurface engine={engine} />
    <p role="status">{state.error ?? (state.usable ? 'Hold your position. Measuring starts automatically.' : state.phase === 'requesting' ? 'Allow camera access, then get into position.' : state.phase === 'loading' ? 'Starting movement tracking…' : 'Stay in view. Calibration will guide you automatically.')}</p>
    {['idle', 'error', 'suspended'].includes(state.phase) && <Button onClick={() => { void unlockAudio(); void engine.start(); }}>{state.phase === 'error' ? 'RETRY CAMERA' : 'RESUME CALIBRATION'}</Button>}
  </section>;
}
