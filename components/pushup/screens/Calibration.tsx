'use client';
import { useEffect, useRef, useState } from 'react';
import { CameraSurface } from '@/components/pushup/camera/CameraSurface';
import type { PoseEngine } from '@/lib/pushup/engine';
import { CalibrationSession, CALIBRATION_STEPS } from '@/lib/pushup/calibration';
import type { CalibrationState } from '@/lib/pushup/calibration';
import { calibrationCue, speakLocally, stopSpeech, unlockAudio } from '@/lib/audio-engine/cues';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import { Button } from '@/components/pushup/ui/Button';
import { FRAMING_COPY } from '@/lib/pose-engine/framing';
import { PlacementGuide } from '@/components/pushup/ui/PlacementGuide';

export function Calibration({ onNext, engine, embedded = false }: { onNext: () => void; engine?: PoseEngine; embedded?: boolean }) {
  const steps = CALIBRATION_STEPS[engine?.exercise ?? 'pushup'];
  const [state, setState] = useState<CalibrationState>({step: 0, phase: 'measuring', message: steps[0].instruction, revision: 0, cue: 'move'});
  const [voice, setVoice] = useState(true);
  const voiceRef = useRef(true), nextRef = useRef(onNext);
  const sessionRef = useRef<CalibrationSession | null>(null);
  const progress = useRef<HTMLDivElement>(null);
  const guidance = useRef<HTMLParagraphElement>(null);
  const diagnostics = useRef<HTMLPreElement>(null);
  const postureLabel = useRef<HTMLParagraphElement>(null);
  const progressRegion = useRef<HTMLDivElement>(null);
  useEffect(() => { nextRef.current = onNext; }, [onNext]);
  useEffect(() => {
    if (!engine) return;
    engine.clearCalibration();
    let frameId = 0, readyTimer: ReturnType<typeof setTimeout> | undefined;
    let previousStep = 0, lastDiagnostics = 0;
    const session = new CalibrationSession(engine.exercise, performance.now(), snapshot => {
      setState(snapshot);
      if (voiceRef.current) speakLocally(snapshot.cue === 'hold' && snapshot.phase === 'measuring' ? 'Stay there. Measuring.' : snapshot.message);
      if (snapshot.phase === 'ready' && session.result) {
        engine.setCalibration(session.result); calibrationCue(2);
        readyTimer = setTimeout(() => {
          const current = engine.frame;
          if (engine.getSnapshot().usable && current?.ok && performance.now() - current.tPerfMs <= CONFIG.camera.staleMs) nextRef.current();
          else { engine.clearCalibration(); session.restart(performance.now()); }
        }, CONFIG.calibration.readyMs);
      } else if (snapshot.phase === 'measuring' && snapshot.step > previousStep) calibrationCue(snapshot.step-1);
      previousStep = snapshot.step;
    });
    sessionRef.current = session;
    if (voiceRef.current) speakLocally(steps[0].instruction);
    function tick(now: number) {
      if (!engine) return;
      session.update(engine.getSnapshot().usable ? engine.frame : null, now);
      if (progress.current) progress.current.style.transform = `scaleX(${session.progress})`;
      const snapshot = engine.getSnapshot();
      const message = session.reason === 'missing' && snapshot.issue !== 'none' ? FRAMING_COPY[snapshot.issue].detail : session.guidance;
      if (guidance.current && guidance.current.textContent !== message) guidance.current.textContent = message;
      if (now - lastDiagnostics >= CONFIG.calibrationV2.diagnosticsMs) {
        lastDiagnostics = now;
        if (postureLabel.current) postureLabel.current.textContent = session.posture ? `Position estimate: ${session.posture.label}` : 'Checking your position…';
        progressRegion.current?.setAttribute('aria-valuenow', String(Math.round(session.progress * 100)));
        if (diagnostics.current) diagnostics.current.textContent = `Calibration v3 · ${session.reason}\nPosture ${session.posture?.label ?? "unclear"} · angle ${session.posture?.angle?.toFixed(0) ?? "—"}°\nStep ${session.state.step + 1}/${steps.length} · ${engine.metrics.poseHz.toFixed(1)} pose Hz\nValid samples ${session.diagnostics.acceptedFrames} · rejected ${session.diagnostics.rejectedFrames}\nWindow resets ${session.diagnostics.windowResets} · noise ${session.diagnostics.noise.toFixed(4)}\nObserved step time ${(session.diagnostics.validStepMs / 1000).toFixed(1)}s`;
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frameId); clearTimeout(readyTimer); sessionRef.current = null; stopSpeech(); };
  }, [engine, steps]);
  if (!engine) return <section className="screen narrow"><h1>KEYBOARD<br />MODE</h1><PlacementGuide /><p>No camera calibration is needed. Arrow Down and Arrow Up will use the same movement-event pipeline.</p><Button onClick={onNext}>SKIP (KEYBOARD)</Button></section>;
  return <section className={embedded ? "calibration-measurement" : "screen narrow calibration"}>
    <p className="muted">{steps[state.step].stage === 'verify' ? 'Checking your movement' : 'Learning your movement'} · {state.step + 1} / {steps.length}</p>
    <div className="step-indicator">{steps.map(({title}, i) => <span key={`${title}-${i}`} className={i <= state.step ? 'active' : ''} />)}</div>
    <h1>{state.phase === 'ready' ? 'READY' : state.phase === 'retry' ? 'TRY AGAIN' : state.cue === 'hold' ? 'HOLD' : engine.exercise === 'squat' ? (steps[state.step].kind === 'up' ? 'STAND' : 'SQUAT') : steps[state.step].title}</h1>
    <p className="lead" role="status">{state.message}</p>
    {!embedded && <CameraSurface engine={engine} />}
    <p ref={postureLabel} className="muted">Checking your position…</p>
    <div ref={progressRegion} className="calibration-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} aria-label="Current position measurement"><div ref={progress} /></div>
    {state.phase === 'measuring' && <p ref={guidance} className="calibration-status" role="status">Get into position. We will tell you when to hold.</p>}
    {state.phase === 'retry' && <Button onClick={() => { void unlockAudio(); sessionRef.current?.restart(performance.now()); }}>TRY AGAIN</Button>}
    <div className="calibration-actions">
    <Button variant="secondary" onClick={() => { const enabled = !voice; voiceRef.current = enabled; setVoice(enabled); if (!enabled) stopSpeech(); else speakLocally(state.message); }}>VOICE {voice ? 'ON' : 'OFF'}</Button>
    {state.phase === 'measuring' && <button className="calibration-restart" onClick={() => sessionRef.current?.restart(performance.now())}>Restart setup</button>}
    </div>
    <details className="calibration-details"><summary>Setup details</summary><pre ref={diagnostics} /></details>
  </section>;
}
