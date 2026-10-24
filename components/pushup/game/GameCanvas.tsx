"use client";
import { useEffect, useRef } from "react";
import type { PoseEngine } from "@/lib/pushup/engine";
import type { Calibration } from "@/lib/shared/pushup-types";
import { BodyOverlay } from '@/components/pushup/pose/BodyOverlay';
import type { BodyOverlayMode } from '@/lib/shared/pushup-types';
import { HeadMarker } from "@/components/pushup/pose/HeadMarker";
import { drawPositionGauge } from "@/components/pushup/pose/PositionGauge";
import { GameRenderer } from '@/lib/game-engine/renderer';
import type { GameRuntime } from '@/lib/game-engine/runtime';
import { PUSHUP_CONFIG as CONFIG } from "@/lib/shared/config";

/** One canvas for targets and pose overlays. No per-frame React updates. */
export function GameCanvas({ preview = false, engine, videoRef, calibration, runtime, overlayMode = "on" }: { overlayMode?: BodyOverlayMode; runtime?: GameRuntime; preview?: boolean; engine?: PoseEngine; videoRef?: React.RefObject<HTMLVideoElement | null>; lanes?: boolean; calibration?: Calibration }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(overlayMode);
  useEffect(() => { modeRef.current = overlayMode; }, [overlayMode]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const display = canvas.getContext("2d");
    if (!display) return;
    const fontFamily = getComputedStyle(canvas).fontFamily;
    const marker = new HeadMarker();
    const body = new BodyOverlay(fontFamily);
    const renderer = new GameRenderer(fontFamily);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const dev = new URLSearchParams(location.search).get("dev") === "1";
    let animation = 0, width = 0, height = 0, ratio = 1;
    function draw() {
      if (!canvas) return;
      const { width: w, height: h } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, CONFIG.canvas.maxDpr);
      width = w; height = h; ratio = dpr;
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    function render(now: number) {
      if (!display || !canvas) return;
      display.setTransform(1, 0, 0, 1, 0, 0);
      display.clearRect(0, 0, canvas.width, canvas.height);
      display.setTransform(ratio, 0, 0, ratio, 0, 0);
      runtime?.tick(now);
      const frame = engine?.frame, video = videoRef?.current;
      if (frame?.ok && video?.videoWidth && video.videoHeight && now - frame.tPerfMs < CONFIG.camera.staleMs) {
        const hit = runtime?.game.judgment;
        body.draw(display, frame, video, width, height, now, runtime?.bodyOverlay ?? modeRef.current, !runtime, motion.matches, hit && hit.grade !== 'miss' ? runtime!.songMs-hit.time : Infinity);
        if (runtime) renderer.draw(display, width, height, runtime, now, motion.matches, dev);
        marker.draw(display, frame, video, width, height, motion.matches, dev, runtime?.game.flow ? runtime.game.current?.meter?.ratio : runtime?.game.notes.find(n => n.status === 'pending' && n.meter && runtime.songMs >= n.note.time - CONFIG.hold.entryMs && runtime.songMs <= n.note.time + n.note.duration)?.meter?.ratio);
        if (!runtime) drawPositionGauge(display, frame, calibration, width, height, fontFamily);
      } else { marker.reset(); body.reset(); if (runtime) renderer.draw(display, width, height, runtime, now, motion.matches, dev); }
      engine?.noteDraw();
      if (engine || runtime) animation = requestAnimationFrame(render);
    }
    const observer = new ResizeObserver(() => { draw(); if (!engine && !runtime) render(performance.now()); });
    observer.observe(canvas); draw(); render(performance.now());
    return () => { observer.disconnect(); cancelAnimationFrame(animation); };
  }, [engine, videoRef, calibration, runtime]);
  return <canvas ref={ref} className={`game-canvas ${preview ? "preview-canvas" : ""}`} aria-label={runtime ? (runtime.game.flow ? "Two movement rings: UP on top and DOWN below. The active direction fills as you move; the top ring becomes the plank hold." : "Fixed UP and DOWN targets with movement fill and beat timing") : engine ? "Live head marker and position gauge" : "Movement overlay"} role="img" />;
}
