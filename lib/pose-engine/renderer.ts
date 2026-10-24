import { CONFIG } from "@/lib/shared/config";
import { JOINT_NAMES } from "./landmarks";
import { projectInto, updateProjection, visible } from "./framing";
import type { PoseEngine } from "./engine";

/** Draws only numeric landmarks. Video frames never enter the drawing canvas. */
export class PoseRenderer {
  private raf = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private reportAt = 0;
  private readonly projection = { offsetX: 0, offsetY: 0, displayWidth: 0, displayHeight: 0, mirrored: true };
  private readonly firstPoint = { x: 0, y: 0 };
  private readonly secondPoint = { x: 0, y: 0 };
  private readonly observer: ResizeObserver;
  private readonly context: CanvasRenderingContext2D | null;
  private readonly colors: { point: string; line: string };
  constructor(private readonly canvas: HTMLCanvasElement, private readonly video: HTMLVideoElement, private readonly engine: PoseEngine, private readonly diagnostics: HTMLElement | null) {
    this.context = canvas.getContext("2d");
    const tokens = getComputedStyle(canvas);
    this.colors = { point: tokens.getPropertyValue("--secondary").trim() || CONFIG.colors.mint, line: tokens.getPropertyValue("--card").trim() || CONFIG.colors.paper };
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(canvas);
    this.resize();
  }
  private resize = () => {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.dpr = Math.min(devicePixelRatio || 1, CONFIG.camera.maxDpr);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
  };
  start() { this.raf = requestAnimationFrame(this.draw); }
  private draw = (now: number) => {
    const ctx = this.context;
    if (!ctx) return;
    this.engine.noteDraw();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    const frame = this.engine.frame;
    const mode = this.engine.overlay;
    const videoWidth = this.video.videoWidth;
    const videoHeight = this.video.videoHeight;
    const mirrored = this.engine.getSnapshot().facing === "user";
    if (frame && mode !== "off" && now - frame.tPerfMs < CONFIG.camera.staleMs && videoWidth && videoHeight) {
      updateProjection(this.projection, videoWidth, videoHeight, this.width, this.height, mirrored);
      if (mode === "on") {
        ctx.strokeStyle = this.colors.line;
        ctx.lineWidth = CONFIG.cameraOverlay.lineWidth;
        ctx.globalAlpha = CONFIG.cameraOverlay.lineOpacity;
        ctx.beginPath();
        for (const [a, b] of CONFIG.pose.connections) {
          const first = frame.joints[a]; const second = frame.joints[b];
          if (!visible(first) || !visible(second)) continue;
          projectInto(this.firstPoint, first.x, first.y, this.projection);
          projectInto(this.secondPoint, second.x, second.y, this.projection);
          ctx.moveTo(this.firstPoint.x, this.firstPoint.y);
          ctx.lineTo(this.secondPoint.x, this.secondPoint.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = CONFIG.cameraOverlay.dotOpacity;
      ctx.fillStyle = this.colors.point;
      for (const name of JOINT_NAMES) {
        if (mode === "minimal" && name !== "nose" && !name.includes("Shoulder") && !name.includes("Hip")) continue;
        const joint = frame.joints[name];
        if (!visible(joint)) continue;
        projectInto(this.firstPoint, joint.x, joint.y, this.projection);
        ctx.beginPath();
        ctx.arc(this.firstPoint.x, this.firstPoint.y, name === "nose" ? CONFIG.cameraOverlay.noseRadius : CONFIG.cameraOverlay.dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (this.diagnostics && now - this.reportAt >= CONFIG.camera.metricsWindowMs) {
      const m = this.engine.metrics;
      const state = this.engine.getSnapshot();
      // Low-frequency direct text write, with no React state or camera pixels.
      this.diagnostics.textContent = `Render ${m.fps.toFixed(0)} fps · Pose ${m.poseHz.toFixed(1)} Hz\nInference ${m.inferenceMs.toFixed(1)} ms · ${state.delegate ?? "—"}\nReact ${m.rendersPerSecond.toFixed(1)}/s · External assets ${m.externalRequests}\n${state.tracking} · ${state.issue}`;
      this.reportAt = now;
    }
    this.raf = requestAnimationFrame(this.draw);
  };
  dispose() {
    cancelAnimationFrame(this.raf); this.raf = 0;
    this.observer.disconnect();
    this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
