'use client';
import { unlockAudio } from '@/lib/audio-engine/cues';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/pushup/ui/Button';
import { PlacementGuide } from '@/components/pushup/ui/PlacementGuide';
import { CameraSurface } from '@/components/pushup/camera/CameraSurface';
import type { PoseEngine } from '@/lib/pushup/engine';

export function CameraPermission({ engine, debug, onNext, onKeyboard }: { engine: PoseEngine; debug: boolean; onNext: () => void; onKeyboard: () => void }) {
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  return <section className="screen narrow"><h1>Your camera helps us detect your movements.</h1>
    {state.phase === 'idle' ? <PlacementGuide /> : <CameraSurface engine={engine} />}
    <p>Phone on the floor. Head and shoulders in frame. Leave yourself room to move.</p>
    <p className="muted">Video processing happens locally on your device. Nothing is recorded or uploaded.</p>
    {state.phase === 'idle' && <Button onClick={() => { void unlockAudio(); void engine.start(); }}>ENABLE CAMERA</Button>}
    {state.phase === 'running' && <Button disabled={!state.usable} onClick={() => { void unlockAudio(); onNext(); }}>CONTINUE TO CALIBRATION</Button>}
    {(state.phase === 'loading' || state.phase === 'requesting') && <Button variant="secondary" onClick={() => engine.stop()}>CANCEL</Button>}
    {debug && <button className="keyboard-link" onClick={() => { void unlockAudio(); onKeyboard(); }}>Use keyboard instead</button>}
    <small className="muted">Calibrate your range, then move to the selected song.</small>
  </section>;
}
