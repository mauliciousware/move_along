'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { AutoCalibration } from './screens/AutoCalibration';
import { Gameplay } from './screens/Gameplay';
import { Results } from './screens/Results';
import { EXERCISES } from '@/data/catalog';
import { PoseEngine } from '@/lib/pushup/engine';
import { GameRuntime } from '@/lib/game-engine/runtime';
import { analyzeSession } from '@/lib/game-engine/analysis';
import { newStats, type Stats } from '@/lib/game-engine/scoring';
import { sessionFeedback } from '@/lib/game-engine/feedback';
import { songsFor, type PushupSong } from '@/lib/shared/pushup-songs';
import { stopSpeech, unlockAudio } from '@/lib/audio-engine/cues';
import type { ExerciseId } from '@/lib/shared/types';

type Screen = 'ready' | 'calibration' | 'game' | 'results';

export default function Workout({ exercise = 'pushup' }: { exercise?: ExerciseId }) {
  const router = useRouter();
  const [songs] = useState(() => songsFor(exercise));
  const [song, setSong] = useState<PushupSong>(songs[0]);
  const [engine] = useState(() => new PoseEngine(exercise));
  const [runtime, setRuntime] = useState(() => new GameRuntime(songs[0].map, songs[0]));
  const [screen, setScreen] = useState<Screen>('ready');
  const [stats, setStats] = useState<Stats>(newStats);
  const [notice, setNotice] = useState('');
  const [audioError, setAudioError] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const [debug] = useState(() => new URLSearchParams(location.search).get('debug') === '1');
  const run = useRef(0);
  const finished = useRef(false);
  const ready = useRef({ audio: false, calibration: false });
  const movement = EXERCISES[exercise];

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [screen, attempt]);
  useEffect(() => () => { ++run.current; engine.stop(); stopSpeech(); }, [engine]);
  useEffect(() => () => runtime.dispose(), [runtime]);
  useEffect(() => {
    function interrupt() {
      if (!['calibration', 'game'].includes(screen)) return;
      runtime.pause();
      if (keyboard) return;
      engine.stop();
      ready.current.calibration = false;
      setCalibrated(false);
      setAttempt(value => value + 1);
      setNotice('Resume calibration when you’re back in position.');
      setScreen('calibration');
    }
    const hidden = () => { if (document.hidden) interrupt(); };
    const off = engine.subscribe(() => { if (engine.getSnapshot().phase === 'suspended') interrupt(); });
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', interrupt);
    window.addEventListener('orientationchange', interrupt);
    return () => { off(); document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', interrupt); window.removeEventListener('orientationchange', interrupt); };
  }, [engine, runtime, screen, keyboard]);

  function enterGame() {
    if (!finished.current && ready.current.audio && ready.current.calibration) { stopSpeech(); setNotice(''); setScreen('game'); }
  }

  async function loadAudio(target: GameRuntime, id: number, activation: Promise<boolean>) {
    try {
      const [, active] = await Promise.all([target.audio.load(), activation]);
      if (id !== run.current || finished.current) return;
      if (!active) throw new Error('Tap Retry sound to enable music in Safari.');
      ready.current.audio = true;
      setAudioError(false);
      setNotice('');
      enterGame();
    } catch (error) {
      if (id !== run.current || finished.current) return;
      setAudioError(true);
      setNotice(error instanceof Error ? error.message : 'Music could not load. Retry sound or use the practice beat.');
    }
  }

  function play(selected = song, demo = false) {
    const activation = unlockAudio(); // Must happen inside the Play gesture on Safari.
    const id = ++run.current;
    finished.current = false;
    ready.current = { audio: false, calibration: demo };
    engine.stop();
    const next = new GameRuntime(selected.map, selected);
    setRuntime(next); setSong(selected); setKeyboard(demo);
    setCalibrated(demo); setAttempt(value => value + 1);
    setAudioError(false); setNotice(''); setScreen('calibration');
    if (!demo) void engine.start();
    void loadAudio(next, id, activation);
  }

  function calibrationComplete() {
    ready.current.calibration = true;
    setCalibrated(true);
    enterGame();
  }

  function finish(result: Stats) {
    if (finished.current) return;
    finished.current = true; ++run.current;
    engine.stop(); stopSpeech(); setStats(result); setScreen('results');
  }

  function recalibrate() {
    if (keyboard) { runtime.reenter(); return; }
    ready.current.calibration = false;
    setCalibrated(false); setAttempt(value => value + 1); setScreen('calibration');
  }

  return <div className={`pushup-experience ${screen === 'game' ? 'in-game' : ''}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="pushup-header"><Link className="brand" href="/">move along.</Link>{screen !== 'ready' && <span className="workout-name">{keyboard ? 'Keyboard demo' : movement.name}</span>}{screen === 'calibration' && <Button variant="danger" onClick={() => finish(runtime.end(true))}>STOP</Button>}</header>
    <main id="main-content">
      {screen === 'ready' && <section className="screen narrow exercise-ready">
        <Link href="/" className="exercise-back">← All movements</Link>
        <h1>{movement.name}.</h1>
        <p>{exercise === 'march' ? 'Lift the named knee. Return both feet between steps.' : 'Lower for DOWN. Rise for UP. Follow the beat.'}</p>
        <div className="compact-track"><label htmlFor="soundtrack">Soundtrack</label><select id="soundtrack" value={song.id} onChange={event => setSong(songs.find(track => track.id === event.target.value)!)}>{songs.map(track => <option key={track.id} value={track.id}>{track.title} · {track.artist}</option>)}</select><span>{song.description}</span></div>
        <Button onClick={() => play()}>PLAY</Button>
        <p className="ready-hint">Allow the camera, get into position, and follow automatic calibration. The game starts when you’re ready.</p>
        <p className="ready-safety">Rest or stop anytime. Stop if you feel pain or dizziness.</p>
        {debug && <button className="keyboard-link" onClick={() => play(song, true)}>Play keyboard demo</button>}
      </section>}
      {screen === 'calibration' && <>
        {notice && <p className="pushup-notice" role={audioError ? 'alert' : 'status'}>{notice}</p>}
        {audioError && <div className="audio-recovery"><Button onClick={() => { setNotice('Loading music…'); void loadAudio(runtime, run.current, unlockAudio()); }}>RETRY SOUND</Button><Button variant="secondary" onClick={() => play(songs.find(track => track.id === 'dev')!)}>USE PRACTICE BEAT</Button></div>}
        {!keyboard && <AutoCalibration key={attempt} engine={engine} complete={calibrated} onComplete={calibrationComplete} />}
        {keyboard && !audioError && <p role="status">Getting your music ready…</p>}
      </>}
      {screen === 'game' && <Gameplay exercise={exercise} runtime={runtime} engine={keyboard ? undefined : engine} onEnd={finish} onCalibrate={recalibrate} />}
      {screen === 'results' && <Results exercise={exercise} analysis={analyzeSession(runtime.game.notes, stats, runtime.observedFrames, runtime.validFrames, keyboard)} title={song.title} stats={stats} feedback={sessionFeedback(runtime.game.notes, stats, !keyboard, runtime.bodySamples, runtime.bodyVisibleSamples, exercise)} onDone={() => router.push('/')} onReplay={() => play()} />}
    </main>
    {screen !== 'game' && <footer className="pushup-footer">Camera stays on your device. Results aren’t saved.</footer>}
  </div>;
}
