'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { normalizePose } from '@/lib/pushup/signals';
import type { GameRuntime } from '@/lib/game-engine/runtime';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import type { PoseEngine } from '@/lib/pushup/engine';
import { CameraFeed } from './CameraFeed';
import { GameCanvas } from '@/components/pushup/game/GameCanvas';
import { StepBackOverlay } from '@/components/pushup/game/StepBackOverlay';
import { OverlayControl } from '@/components/pushup/pose/OverlayControl';
import type { BodyOverlayMode } from '@/lib/shared/pushup-types';
import { Button } from '@/components/pushup/ui/Button';

export default function PoseView({ engine, lanes = false, runtime }: { engine: PoseEngine; lanes?: boolean; runtime?: GameRuntime }) {
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [overlayMode,setOverlayMode] = useState<BodyOverlayMode>(engine.bodyOverlay);
  const video = useRef<HTMLVideoElement | null>(null);
  const debug = useRef<HTMLPreElement>(null);
  useEffect(() => { engine.noteRender(); });
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('dev') || new URLSearchParams(location.search).get('dev') !== '1') return;
    const timer = setInterval(() => {
      if (!debug.current) return;
      const frame = engine.frame, m = engine.metrics;
      const external = performance.getEntriesByType('resource').filter(entry => /^https?:/.test(entry.name) && new URL(entry.name).origin !== location.origin).length + m.externalRequests;
      debug.current.textContent = `FPS ${m.fps.toFixed(0)} · POSE ${m.poseHz.toFixed(1)} Hz\n${engine.getSnapshot().delegate ?? '—'} ${m.inferenceMs.toFixed(1)} ms · React ${m.rendersPerSecond.toFixed(1)}/s\nConfidence ${frame?.confidence.toFixed(2) ?? '—'} · ${engine.getSnapshot().tracking}\n${engine.calibration && frame ? `Height ${normalizePose(frame, engine.calibration).p.toFixed(2)} · calibrated` : 'Calibration pending · height unavailable'}\nExternal asset requests: ${external}`;
    }, CONFIG.camera.metricsWindowMs);
    return () => clearInterval(timer);
  }, [engine]);
  return <div className="pose-view">
    <div className={`camera-stage ${lanes ? 'with-lanes' : ''}`} style={{ "--camera-opacity": runtime ? CONFIG.targets.cameraOpacity : CONFIG.tileVisual.cameraOpacity } as React.CSSProperties}>
      <CameraFeed engine={engine} videoRef={video} />
      <GameCanvas overlayMode={overlayMode} runtime={runtime} engine={engine} videoRef={video} lanes={lanes} calibration={state.calibrated ? engine.calibration ?? undefined : undefined} />
      {state.phase === 'running' && <StepBackOverlay status={state.tracking} />}
      {(state.phase === 'loading' || state.phase === 'requesting') && <div className="step-back" role="status">Starting your camera and local pose model…</div>}
      {state.phase === 'error' && <div className="step-back" role="alert"><span>{state.error}</span><Button onClick={() => void engine.start()}>RETRY CAMERA</Button></div>}
      <pre className="pose-diagnostics" ref={debug} />
    </div>
    {!runtime && <OverlayControl value={overlayMode} onChange={mode=>{engine.setBodyOverlay(mode);setOverlayMode(mode);}}/>}
    {!runtime && state.phase === 'running' && <p className="tracking-caption" role="status"><span className={state.tracking === 'TRACKING' ? 'live-dot' : ''} />{state.tracking === 'TRACKING' ? 'Head tracking active' : 'Looking for your head and shoulders'} · camera stays on this device</p>}
  </div>;
}
