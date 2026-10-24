'use client';
import { useEffect, useRef, useState } from 'react';
import { CameraSurface } from '@/components/pushup/camera/CameraSurface';
import type { PoseEngine } from '@/lib/pushup/engine';
import { CalibrationSession, CALIBRATION_STEPS } from '@/lib/pushup/calibration';
import type { CalibrationState } from '@/lib/pushup/calibration';
import { calibrationCue, speakLocally, stopSpeech, unlockAudio } from '@/lib/audio-engine/cues';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import { Button } from '@/components/pushup/ui/Button';
import { PlacementGuide } from '@/components/pushup/ui/PlacementGuide';

export function Calibration({ onNext, engine }: { onNext: () => void; engine?: PoseEngine }) {
  const [state, setState] = useState<CalibrationState>({step: 0, phase: 'measuring', message: CALIBRATION_STEPS[0].instruction, revision: 0});
  const [voice, setVoice] = useState(true);
  const voiceRef = useRef(true), nextRef = useRef(onNext);
  const sessionRef = useRef<CalibrationSession | null>(null);
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => { nextRef.current = onNext; }, [onNext]);
  useEffect(() => {
    if (!engine) return;
    engine.clearCalibration();
    let frameId = 0, readyTimer: ReturnType<typeof setTimeout> | undefined;
    let previousStep = 0;
    const session = new CalibrationSession(performance.now(), snapshot => {
      setState(snapshot);
      if (voiceRef.current) speakLocally(snapshot.message);
      if (snapshot.phase === 'ready' && session.result) {
        engine.setCalibration(session.result); calibrationCue(2);
        readyTimer = setTimeout(() => nextRef.current(), CONFIG.calibration.readyMs);
      } else if (snapshot.phase === 'measuring' && snapshot.step > previousStep) calibrationCue(snapshot.step-1);
      previousStep = snapshot.step;
    });
    sessionRef.current = session;
    if (voiceRef.current) speakLocally(CALIBRATION_STEPS[0].instruction);
    function tick(now: number) {
      if (!engine) return;
      session.update(engine.getSnapshot().tracking === 'TRACKING' ? engine.frame : null, now);
      if (progress.current) progress.current.style.transform = `scaleX(${session.progress})`;
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frameId); clearTimeout(readyTimer); sessionRef.current = null; stopSpeech(); };
  }, [engine]);
  if (!engine) return <section className="screen narrow"><h1>KEYBOARD<br />MODE</h1><PlacementGuide /><p>No camera calibration is needed. Arrow Down and Arrow Up will use the same movement-event pipeline.</p><Button onClick={onNext}>SKIP (KEYBOARD)</Button></section>;
  return <section className="screen narrow calibration">
    <p className="muted">Calibration · {state.step + 1} / {CALIBRATION_STEPS.length}</p>
    <div className="step-indicator">{CALIBRATION_STEPS.map(({title}, i) => <span key={title} className={i <= state.step ? 'active' : ''} />)}</div>
    <h1>{state.phase === 'ready' ? 'READY' : CALIBRATION_STEPS[state.step].title}</h1>
    <p className="lead" role="status">{state.message}</p>
    <svg className={`calibration-demo demo-${state.step}`} style={{'--demo-duration': `${CONFIG.calibration.demoMs}ms`} as React.CSSProperties} viewBox="0 0 320 100" role="img" aria-label={`Demonstration: ${CALIBRATION_STEPS[state.step].title.toLowerCase()} position`}>
      <path d="M20 85h280" stroke="currentColor" opacity=".2" />
      <g className="demo-body" fill="none" stroke="var(--color-up)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><circle cx="72" cy="28" r="10" /><path d="m89 38 91 16 99 28M99 40 88 80H72" /></g>
    </svg>
    <CameraSurface engine={engine} />
    <div className="calibration-progress" aria-label="Hold steady to complete this step"><div ref={progress} /></div>
    {state.phase === 'measuring' && <p className="muted">Move only when the instruction changes. Each step completes when you hold still.</p>}
    {state.phase === 'retry' && <Button onClick={() => { void unlockAudio(); sessionRef.current?.restart(performance.now()); }}>TRY AGAIN</Button>}
    <Button variant="secondary" onClick={() => { const enabled = !voice; voiceRef.current = enabled; setVoice(enabled); if (!enabled) stopSpeech(); else speakLocally(state.message); }}>VOICE {voice ? 'ON' : 'OFF'}</Button>
  </section>;
}
