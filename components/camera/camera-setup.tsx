"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, Camera, Check, FlipHorizontal2, LockKeyhole, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/8bit/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EXERCISES } from "@/data/catalog";
import { CONFIG } from "@/lib/shared/config";
import type { ExerciseId, OverlayMode } from "@/lib/shared/types";
import { PoseEngine } from "@/lib/pose-engine/engine";
import { FRAMING_COPY } from "@/lib/pose-engine/framing";
import { PoseRenderer } from "@/lib/pose-engine/renderer";
import { CameraFeed } from "./camera-feed";
import { FramingGuide } from "./framing-guide";

interface Props { exercise: ExerciseId; paused: boolean; onContinue: () => void }
export default function CameraSetup({ exercise, paused, onContinue }: Props) {
  const [engine] = useState(() => new PoseEngine(exercise));
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [overlay, setOverlay] = useState<OverlayMode>("on");
  const [dev] = useState(() => new URLSearchParams(window.location.search).get(CONFIG.camera.devQuery) === "1");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const diagnosticRef = useRef<HTMLPreElement>(null);
  const busy = state.phase === "requesting" || state.phase === "loading";
  const live = state.phase === "loading" || state.phase === "running";
  const ready = state.phase === "running" && state.usable;
  const copy = FRAMING_COPY[state.issue];

  useEffect(() => { engine.noteRender(); });
  useEffect(() => {
    const video = videoRef.current;
    if (video) void engine.attach(video);
    const hidden = () => { if (document.hidden) engine.suspend("background"); };
    const pageHide = () => engine.suspend("background");
    const rotate = () => engine.suspend("orientation");
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", pageHide);
    window.addEventListener("orientationchange", rotate);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", pageHide);
      window.removeEventListener("orientationchange", rotate);
      engine.stop();
    };
  }, [engine]);
  useEffect(() => { if (paused) engine.suspend("manual"); }, [engine, paused]);
  useEffect(() => {
    if (state.phase !== "running" || !canvasRef.current || !videoRef.current) {
      if (diagnosticRef.current) diagnosticRef.current.textContent = state.phase === "suspended" ? "Camera paused. Resume for live diagnostics." : "Enable the camera to see tracking diagnostics.";
      return;
    }
    const renderer = new PoseRenderer(canvasRef.current, videoRef.current, engine, dev ? diagnosticRef.current : null);
    renderer.start();
    return () => renderer.dispose();
  }, [engine, state.phase, dev]);

  function start() { void engine.start(undefined, videoRef.current); }
  function changeOverlay(value: string) {
    if (!(CONFIG.cameraOverlay.modes as readonly string[]).includes(value)) return;
    engine.setOverlay(value as OverlayMode);
    setOverlay(value as OverlayMode);
  }
  const statusTitle = ready ? "You’re in the frame" : state.phase === "loading" ? "Getting movement tracking ready…" :
    state.phase === "requesting" ? "Allow camera access in Safari" : state.phase === "suspended" ? "Camera paused" :
    state.phase === "error" ? "Let’s reconnect" : state.phase === "running" ? state.tracking === "LOST_LONG" ? "Tracking paused" : copy.title : "Your camera is off";
  const statusDetail = ready ? "Keep your phone here. Your movement stays on this device." : state.phase === "loading" ? "The first start may take a moment." :
    state.phase === "requesting" ? "Your microphone stays off." : state.phase === "suspended" ?
      state.suspendedFor === "orientation" ? "You turned your phone. Resume to check your framing again." : "Tap resume when you’re ready to check your framing again." :
    state.phase === "running" ? state.tracking === "LOST_LONG" ? `${copy.title}. ${copy.detail}` : state.issue === "none" ? "Hold still for a moment while tracking settles." : copy.detail : "";

  return <section className="mobile-camera-setup" aria-label={`${EXERCISES[exercise].name} camera setup`}>
    <p className="camera-placement-copy">{exercise === "pushup" ? "Phone on the floor. Head, shoulders and elbows in view." : "Phone upright. Step back until your head and feet fit."}</p>
    <div className="live-camera-stage" data-live={live}>
      <CameraFeed videoRef={videoRef} facing={state.facing} active={live} />
      <canvas ref={canvasRef} className="pose-canvas" aria-hidden="true" />
      {!live && <div className="camera-off-illustration"><FramingGuide floor={exercise === "pushup"} /><span>{state.phase === "suspended" ? "Ready when you are" : "A little room to move"}</span></div>}
      <div className="camera-stage-top"><span className="local-camera-badge"><LockKeyhole aria-hidden="true" />Only on your device</span>{live && <Button variant="outline" font="normal" size="icon" aria-label="Switch front and rear camera" disabled={busy} onClick={() => void engine.switchCamera(videoRef.current)}><FlipHorizontal2 /></Button>}</div>
      {live && <div className="camera-stage-bottom"><span className="camera-live-indicator" /><span>{state.facing === "user" ? "Front camera · mirrored" : "Rear camera"}</span></div>}
    </div>
    <div className="framing-status" data-ready={ready} role="status" aria-live="polite" aria-atomic="true">
      <span className="framing-status-mark">{ready ? <Check /> : <Camera />}</span>
      <div><h2>{statusTitle}</h2>{statusDetail && <p>{statusDetail}</p>}</div>
    </div>
    {state.error && <Alert variant="destructive"><AlertTitle>Camera needs your attention</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
    {state.phase === "running" && <div className="overlay-controls"><span id="overlay-label">Body markers</span><ToggleGroup type="single" value={overlay} onValueChange={changeOverlay} aria-labelledby="overlay-label" variant="outline" size="sm">{CONFIG.cameraOverlay.modes.map(mode => <ToggleGroupItem key={mode} value={mode}>{mode === "on" ? "On" : mode === "minimal" ? "Minimal" : "Off"}</ToggleGroupItem>)}</ToggleGroup></div>}
    <div className="camera-primary-action">
      {!live ? <Button font="normal" disabled={busy} onClick={start}>{state.phase === "requesting" ? "Waiting for permission…" : state.phase === "error" ? "Retry camera" : state.phase === "suspended" ? "Resume camera" : "Enable camera"}{state.phase === "error" ? <RotateCcw data-icon="inline-end" /> : <Camera data-icon="inline-end" />}</Button> : <Button font="normal" disabled={!ready} onClick={onContinue}>Preview calibration<ArrowRight data-icon="inline-end" /></Button>}
    </div>
    <p className="camera-phase-note">Live framing is ready to try. Calibration and gameplay are still previews.</p>
    <details className="camera-help"><summary>Setup tips & camera help</summary><ul><li>Use Safari at an HTTPS address. A phone’s HTTP network address cannot access the camera.</li><li>Prop your phone securely, with room for your full movement.</li><li>Use a well-lit space and keep the lens clear.</li><li>Turning your phone or leaving Safari pauses the camera.</li><li>No camera images or movement history are saved.</li></ul><Button variant="ghost" font="normal" size="sm" onClick={onContinue}>Explore the screens without tracking</Button></details>
    {dev && <pre ref={diagnosticRef} className="pose-diagnostics" aria-label="Local pose diagnostics">Enable the camera to see tracking diagnostics.</pre>}
  </section>;
}
