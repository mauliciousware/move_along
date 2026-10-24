import { CONFIG } from "@/lib/shared/config";
import type { CameraFacing, ExerciseId, FramingIssue, OverlayMode, PoseFrame, PoseJoint, TrackingStatus } from "@/lib/shared/types";
import { assessFraming, visible } from "./framing";
import { JOINT_NAMES } from "./landmarks";
import { OneEuroFilter } from "./filter";
import { FrameGate } from "./frame-gate";
import { TrackingMonitor } from "./tracking";
import type { Delegate } from "./delegate";
import type { WorkerReply, WorkerRequest } from "./protocol";

export type CameraPhase = "idle" | "requesting" | "loading" | "running" | "suspended" | "error";
export type SuspensionReason = "background" | "orientation" | "manual";
export interface CameraState {
  phase: CameraPhase; tracking: TrackingStatus; usable: boolean; issue: FramingIssue;
  delegate: Delegate | null; error: string | null; facing: CameraFacing; suspendedFor: SuspensionReason | null;
}
export function cameraError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access is blocked. Allow camera access in this site's browser settings, then retry.";
  if (name === "NotFoundError") return "No camera was found. Try another device with a camera.";
  if (name === "NotReadableError" || name === "AbortError") return "The camera is unavailable. Close other camera apps, then retry.";
  return error instanceof Error ? error.message : "The camera could not start. Please retry.";
}

/** Owns only transient local frames. React subscribers receive status changes. */
export class PoseEngine {
  frame: PoseFrame | null = null;
  overlay: OverlayMode = "on";
  setupId = "";
  setOverlay(value: OverlayMode) { this.overlay = value; }
  readonly metrics = { inferenceMs: 0, poseHz: 0, fps: 0, renders: 0, rendersPerSecond: 0, externalRequests: 0 };
  private state: CameraState = { phase: "idle", tracking: "LOST", usable: false, issue: "person", delegate: null, error: null, facing: "user", suspendedFor: null };
  private readonly listeners = new Set<() => void>();
  private readonly frameListeners = new Set<(frame: PoseFrame) => void>();
  private stream: MediaStream | null = null;
  private worker: Worker | null = null;
  private video: HTMLVideoElement | null = null;
  private generation = 0;
  private attachment = 0;
  private requestSerial = 0;
  private inFlightId = 0;
  private cancelInit: (() => void) | null = null;
  private videoCallback = 0;
  private raf = 0;
  private busy = false;
  private sentAt = -Infinity;
  private lastVideoTime = -1;
  private tracker = new TrackingMonitor();
  private gate = new FrameGate();
  private readonly filters = Object.fromEntries(JOINT_NAMES.map(name => [name, { x: new OneEuroFilter(), y: new OneEuroFilter() }])) as Record<PoseJoint, { x: OneEuroFilter; y: OneEuroFilter }>;
  private inferenceTotal = 0;
  private inferenceCount = 0;
  private warned = false;
  private reportAt = 0;
  private poseCount = 0;
  private drawCount = 0;
  private previousRenders = 0;
  private lastInvalidAt = 0;
  private pendingIssue: FramingIssue = "person";
  private issueSince = 0;
  private workerExternalRequests = 0;
  constructor(readonly exercise: ExerciseId) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  onFrame(listener: (frame: PoseFrame) => void) { this.frameListeners.add(listener); return () => { this.frameListeners.delete(listener); }; }
  noteRender() { this.metrics.renders++; }
  noteDraw() { this.drawCount++; }
  private publish(update: Partial<CameraState>) {
    if (Object.entries(update).every(([key, value]) => this.state[key as keyof CameraState] === value)) return;
    this.state = { ...this.state, ...update };
    this.listeners.forEach(listener => listener());
  }

  async start(facing: CameraFacing = this.state.facing, targetVideo: HTMLVideoElement | null = this.video) {
    if (this.state.phase === "loading" || this.state.phase === "requesting" || this.state.phase === "running") return;
    this.release();
    this.video = targetVideo;
    const generation = this.generation;
    this.setupId = `${facing}-${generation}`;
    this.publish({ phase: "requesting", facing, error: null, suspendedFor: null, usable: false, tracking: "LOST", issue: "person" });
    try {
      if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error("Camera access needs HTTPS. Open the secure version of this site on your iPhone, then retry.");
      if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") throw new Error("This browser cannot run local movement tracking. Try an updated Safari or Chrome browser.");
      let stream: MediaStream;
      const portrait = CONFIG.camera.portrait;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
          facingMode: { ideal: facing }, width: { ideal: portrait.width }, height: { ideal: portrait.height },
          aspectRatio: { ideal: portrait.aspectRatio }, frameRate: { ideal: CONFIG.camera.maxHz, max: CONFIG.camera.maxHz },
        } });
      } catch (error) {
        // Older iOS versions reject size hints but still accept an aspect ratio.
        if (!(error instanceof Error) || error.name !== "OverconstrainedError") throw error;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing }, aspectRatio: { ideal: portrait.aspectRatio } } });
        } catch (retry) {
          if (!(retry instanceof Error) || retry.name !== "OverconstrainedError") throw retry;
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing } } });
        }
      }
      if (generation !== this.generation) { stream.getTracks().forEach(track => track.stop()); return; }
      this.stream = stream;
      const actualFacing = stream.getVideoTracks()[0]?.getSettings().facingMode;
      if (actualFacing === "user" || actualFacing === "environment") {
        this.setupId = `${actualFacing}-${generation}`;
        this.publish({ facing: actualFacing });
      }
      for (const track of stream.getTracks()) {
        track.onended = () => { if (generation === this.generation) this.fail("The camera disconnected. Tap retry to reconnect."); };
        track.onmute = () => { if (generation === this.generation && this.state.phase === "running") this.suspend("manual"); };
      }
      this.publish({ phase: "loading" });
      if (this.video) await this.playVideo(this.video);
      if (generation !== this.generation) return;
      const worker = new Worker(new URL("./pose.worker.ts", import.meta.url));
      this.worker = worker;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => finish(new Error("Movement tracking took too long to load. Check your connection and retry.")), CONFIG.camera.initTimeoutMs);
        let settled = false;
        const finish = (error?: Error) => {
          if (settled) return;
          settled = true; clearTimeout(timer); this.cancelInit = null;
          if (error) reject(error); else resolve();
        };
        this.cancelInit = () => finish(new Error("Camera initialization cancelled"));
        worker.onerror = () => finish(new Error("Local movement tracking could not load. Please retry."));
        worker.onmessage = (event: MessageEvent<WorkerReply>) => {
          if (generation !== this.generation) return;
          const message = event.data;
          if (message.type === "error") finish(new Error("Movement tracking could not start. Please retry."));
          else if (message.type === "ready") {
            this.workerExternalRequests = message.assets.filter(url => new URL(url, location.origin).origin !== location.origin).length;
            this.auditResources();
            this.publish({ delegate: message.delegate }); finish();
          }
        };
        worker.postMessage({ type: "init", origin: location.origin } satisfies WorkerRequest);
      });
      if (generation !== this.generation) return;
      worker.onmessage = (event: MessageEvent<WorkerReply>) => { if (generation === this.generation) this.receive(event.data); };
      worker.onerror = () => { if (generation === this.generation) this.fail("Movement tracking stopped. Tap retry to restart it."); };
      this.reportAt = performance.now();
      this.publish({ phase: "running" });
      if (this.video) await this.attach(this.video);
    } catch (error) {
      if (generation === this.generation) this.fail(cameraError(error));
    }
  }

  private async playVideo(video: HTMLVideoElement) {
    const generation = this.generation;
    const attachment = this.attachment;
    video.srcObject = this.stream;
    try { await video.play(); }
    catch {
      if (generation === this.generation && attachment === this.attachment) throw new Error("Camera preview could not play. Tap retry to restart it.");
    }
  }
  async attach(video: HTMLVideoElement) {
    this.detach();
    this.video = video;
    const attachment = this.attachment;
    const generation = this.generation;
    if (!this.stream) return;
    try { await this.playVideo(video); }
    catch (error) { if (generation === this.generation) this.fail(cameraError(error)); return; }
    if (generation !== this.generation || attachment !== this.attachment || this.video !== video || this.state.phase !== "running") return;
    this.lastVideoTime = -1;
    this.scheduleVideo();
    this.raf = requestAnimationFrame(this.tick);
  }
  detach() {
    this.attachment++;
    if (this.videoCallback && this.video?.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this.videoCallback);
    cancelAnimationFrame(this.raf); this.raf = 0; this.videoCallback = 0;
    if (this.video) { this.video.pause(); this.video.srcObject = null; }
    this.video = null;
    this.busy = false; this.inFlightId = 0;
  }
  private scheduleVideo() {
    if (this.video?.requestVideoFrameCallback) {
      this.videoCallback = this.video.requestVideoFrameCallback(now => { this.capture(now); this.scheduleVideo(); });
    }
  }
  private tick = (now: number) => {
    if (!this.video || this.state.phase !== "running") return;
    if (!this.video.requestVideoFrameCallback) this.capture(now);
    const fresh = !!this.frame?.usable && now - this.frame.tPerfMs < CONFIG.camera.staleMs;
    const tracking = this.tracker.update(fresh, now);
    if (!fresh) this.lastInvalidAt = now;
    const currentIssue = !this.frame || now - this.frame.tPerfMs >= CONFIG.camera.staleMs ? "person" : this.frame.issue;
    this.updateIssue(currentIssue, now);
    this.publish({ tracking, usable: fresh && tracking === "TRACKING" && now - this.lastInvalidAt >= CONFIG.tracking.recoverMs });
    if (this.busy && now - this.sentAt > CONFIG.camera.frameTimeoutMs) { this.fail("Movement tracking stopped responding. Tap retry."); return; }
    if (now - this.reportAt >= CONFIG.camera.metricsWindowMs) {
      const elapsed = (now - this.reportAt) / 1000;
      this.auditResources();
      this.metrics.poseHz = this.poseCount / elapsed;
      this.metrics.fps = this.drawCount / elapsed;
      this.metrics.rendersPerSecond = (this.metrics.renders - this.previousRenders) / elapsed;
      this.previousRenders = this.metrics.renders;
      this.poseCount = this.drawCount = 0; this.reportAt = now;
    }
    this.raf = requestAnimationFrame(this.tick);
  };
  private capture(now: number) {
    const video = this.video;
    if (!video || !this.worker || this.busy || document.hidden || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      video.currentTime === this.lastVideoTime || !this.gate.accept(now)) return;
    this.busy = true; this.sentAt = now; this.lastVideoTime = video.currentTime;
    const requestId = ++this.requestSerial;
    this.inFlightId = requestId;
    const generation = this.generation;
    const attachment = this.attachment;
    // Transient local inference input: never encoded, uploaded, logged or saved.
    void createImageBitmap(video).then(bitmap => {
      if (generation !== this.generation || attachment !== this.attachment || !this.worker) { bitmap.close(); return; }
      try {
        this.worker.postMessage({ type: "frame", bitmap, tPerfMs: now, requestId } satisfies WorkerRequest, [bitmap]);
      } catch (error) { bitmap.close(); throw error; }
    }).catch(() => { if (generation === this.generation && attachment === this.attachment) this.fail("Could not read the camera preview. Tap retry."); });
  }
  private receive(message: WorkerReply) {
    if (message.type === "error") { this.fail("Local movement tracking stopped. Tap retry to restart it."); return; }
    if (message.type !== "frame" || message.requestId !== this.inFlightId) return;
    this.busy = false; this.inFlightId = 0; this.poseCount++;
    const raw = message.frame;
    const quality = assessFraming(raw, this.exercise);
    const previous = this.frame;
    for (const name of JOINT_NAMES) {
      const point = raw.joints[name];
      const filter = this.filters[name];
      if (!visible(point)) { filter.x.reset(); filter.y.reset(); continue; }
      if (!visible(previous?.joints[name]) || !previous || raw.tPerfMs - previous.tPerfMs >= CONFIG.camera.staleMs) { filter.x.reset(); filter.y.reset(); }
      point.x = filter.x.update(point.x, raw.tPerfMs);
      point.y = filter.y.update(point.y, raw.tPerfMs);
    }
    this.frame = { ...raw, ...quality, setupId: this.setupId };
    this.frameListeners.forEach(listener => listener(this.frame!));
    this.inferenceTotal += message.inferenceMs; this.inferenceCount++;
    this.metrics.inferenceMs = this.inferenceTotal / this.inferenceCount;
    if (this.inferenceCount >= CONFIG.camera.metricSamples) {
      if (process.env.NODE_ENV !== "production" && this.metrics.inferenceMs > CONFIG.camera.warnInferenceMs && !this.warned) {
        console.warn(`Move Along: pose inference averages ${this.metrics.inferenceMs.toFixed(1)}ms; target ≤ ${CONFIG.camera.warnInferenceMs}ms.`);
        this.warned = true;
      }
      this.inferenceTotal = this.inferenceCount = 0;
    }
    if (!quality.usable) this.lastInvalidAt = performance.now();
    this.updateIssue(quality.issue, performance.now());
    this.publish({ delegate: message.delegate, ...(!quality.usable ? { usable: false } : {}) });
  }
  private auditResources() {
    const pageExternal = performance.getEntriesByType("resource").filter(entry => new URL(entry.name, location.origin).origin !== location.origin).length;
    this.metrics.externalRequests = this.workerExternalRequests + pageExternal;
  }
  private updateIssue(issue: FramingIssue, now: number) {
    if (issue !== this.pendingIssue) { this.pendingIssue = issue; this.issueSince = now; }
    if (now - this.issueSince >= CONFIG.tracking.issueSettleMs) this.publish({ issue });
  }
  switchCamera(video: HTMLVideoElement | null = this.video) {
    const facing = this.state.facing === "user" ? "environment" : "user";
    this.stop();
    return this.start(facing, video);
  }
  suspend(reason: SuspensionReason) {
    if (!["requesting", "loading", "running"].includes(this.state.phase)) return;
    this.release();
    this.publish({ phase: "suspended", tracking: "LOST", usable: false, delegate: null, error: null, suspendedFor: reason });
  }
  private fail(message: string) {
    this.release();
    this.publish({ phase: "error", error: message, tracking: "LOST", usable: false, delegate: null });
  }
  private release() {
    this.generation++;
    this.cancelInit?.(); this.cancelInit = null;
    this.detach();
    this.worker?.terminate(); this.worker = null;
    this.stream?.getTracks().forEach(track => { track.onended = null; track.onmute = null; track.stop(); }); this.stream = null;
    this.frame = null; this.sentAt = -Infinity;
    this.tracker = new TrackingMonitor(); this.gate = new FrameGate();
    for (const filter of Object.values(this.filters)) { filter.x.reset(); filter.y.reset(); }
    this.inferenceCount = this.inferenceTotal = this.poseCount = this.drawCount = 0;
    this.previousRenders = this.metrics.renders; this.warned = false;
    this.workerExternalRequests = 0;
    this.lastInvalidAt = performance.now(); this.pendingIssue = "person"; this.issueSince = this.lastInvalidAt;
    Object.assign(this.metrics, { inferenceMs: 0, poseHz: 0, fps: 0, rendersPerSecond: 0, externalRequests: 0 });
  }
  stop() {
    this.release();
    this.publish({ phase: "idle", tracking: "LOST", usable: false, issue: "person", delegate: null, error: null, suspendedFor: null });
  }
}
