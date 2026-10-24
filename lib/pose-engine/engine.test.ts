import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONFIG } from "@/lib/shared/config";
import { cameraError, PoseEngine } from "./engine";
import { JOINT_NAMES } from "./landmarks";
import type { WorkerReply, WorkerRequest } from "./protocol";

let clock = 0;
let animation: FrameRequestCallback | undefined;
let frameCallback: ((time: number) => void) | undefined;
let respondToInit = true;
let occluded = false;
const engines: PoseEngine[] = [];
const tracks = () => [{ stop: vi.fn(), onended: null as (() => void) | null, getSettings: () => ({}) }];
function fakeStream() {
  const items = tracks();
  return { getTracks: () => items, getVideoTracks: () => items } as unknown as MediaStream;
}
let stream: MediaStream;
const getUserMedia = vi.fn();
class MockWorker {
  static instances: MockWorker[] = [];
  onmessage: ((event: MessageEvent<WorkerReply>) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();
  constructor() { MockWorker.instances.push(this); }
  send(data: WorkerReply) { this.onmessage?.({ data } as MessageEvent<WorkerReply>); }
  postMessage(message: WorkerRequest) {
    if (message.type === "init") {
      if (respondToInit) queueMicrotask(() => this.send({ type: "ready", delegate: "GPU", assets: ["https://move.test/models/pose_landmarker_lite.task"] }));
    } else {
      message.bitmap.close();
      this.send({ type: "frame", requestId: message.requestId, frame: { tPerfMs: message.tPerfMs, joints: occluded ? {} : Object.fromEntries(JOINT_NAMES.map((name, i) => [name, { x: i % 2 ? 0.4 : 0.6, y: 0.1 + i * 0.05, visibility: 0.9 }])) }, delegate: "GPU", inferenceMs: 8 });
    }
  }
}
function engine() { const instance = new PoseEngine("pushup"); engines.push(instance); return instance; }
function video() {
  return {
    srcObject: null, play: vi.fn(async () => {}), pause: vi.fn(), readyState: 4,
    currentTime: 0, videoWidth: 480, videoHeight: 640,
    requestVideoFrameCallback: vi.fn((callback: (time: number) => void) => { frameCallback = callback; return 1; }),
    cancelVideoFrameCallback: vi.fn(),
  } as unknown as HTMLVideoElement;
}
async function flush() { for (let i = 0; i < 6; i++) await Promise.resolve(); }

beforeEach(() => {
  clock = 0; respondToInit = true; occluded = false; animation = undefined; frameCallback = undefined;
  MockWorker.instances = [];
  stream = fakeStream(); getUserMedia.mockReset().mockResolvedValue(stream);
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  vi.stubGlobal("location", { origin: "https://move.test" });
  vi.stubGlobal("document", { hidden: false });
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("OffscreenCanvas", class {});
  vi.stubGlobal("Worker", MockWorker);
  vi.stubGlobal("HTMLMediaElement", { HAVE_CURRENT_DATA: 2 });
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ close: vi.fn() })));
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { animation = callback; return 1; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => {
  for (const instance of engines.splice(0)) instance.stop();
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("local camera lifecycle", () => {
  it("requests video only and completely releases camera and worker on exit", async () => {
    const instance = engine();
    const element = video();
    await instance.start(undefined, element);
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
    expect(instance.getSnapshot().phase).toBe("running");
    expect(element.srcObject).toBe(stream);
    instance.stop();
    expect(stream.getTracks()[0].stop).toHaveBeenCalled();
    expect(MockWorker.instances[0].terminate).toHaveBeenCalled();
    expect(element.srcObject).toBeNull();
    expect(instance.frame).toBeNull();
  });
  it("disposes a permission result that arrives after the user leaves", async () => {
    let resolve!: (stream: MediaStream) => void;
    getUserMedia.mockReturnValue(new Promise<MediaStream>(r => { resolve = r; }));
    const instance = engine();
    const start = instance.start();
    instance.stop(); resolve(stream); await start;
    expect(stream.getTracks()[0].stop).toHaveBeenCalled();
    expect(MockWorker.instances).toHaveLength(0);
    expect(instance.getSnapshot().phase).toBe("idle");
  });
  it("explains permission denial and permits a retry", async () => {
    const error = new Error("denied"); error.name = "NotAllowedError";
    getUserMedia.mockRejectedValueOnce(error);
    const instance = engine();
    await instance.start();
    expect(instance.getSnapshot().error).toContain("Camera access is blocked");
    await instance.start();
    expect(instance.getSnapshot().phase).toBe("running");
  });
  it("rejects insecure phone access without requesting the camera", async () => {
    vi.stubGlobal("isSecureContext", false);
    const instance = engine(); await instance.start();
    expect(instance.getSnapshot().error).toContain("HTTPS");
    expect(getUserMedia).not.toHaveBeenCalled();
  });
  it("bounds initialization and cleans up when the model stalls", async () => {
    vi.useFakeTimers(); respondToInit = false;
    const instance = engine(); const start = instance.start();
    await flush();
    await vi.advanceTimersByTimeAsync(CONFIG.camera.initTimeoutMs);
    await start;
    expect(instance.getSnapshot().phase).toBe("error");
    expect(stream.getTracks()[0].stop).toHaveBeenCalled();
    expect(MockWorker.instances[0].terminate).toHaveBeenCalled();
  });
  it("releases on backgrounding and resumes only after an explicit start", async () => {
    const instance = engine(); const element = video();
    await instance.start(undefined, element);
    const oldSetup = instance.setupId;
    instance.suspend("background");
    expect(instance.getSnapshot().phase).toBe("suspended");
    expect(stream.getTracks()[0].stop).toHaveBeenCalled();
    expect(instance.getSnapshot().usable).toBe(false);
    await instance.start(undefined, element);
    expect(instance.setupId).not.toBe(oldSetup);
    expect(instance.getSnapshot().phase).toBe("running");
  });
  it("switches facing direction and invalidates the old camera setup", async () => {
    const instance = engine(); const element = video();
    await instance.start(undefined, element);
    const oldSetup = instance.setupId;
    await instance.switchCamera(element);
    expect(instance.getSnapshot().facing).toBe("environment");
    expect(instance.setupId).not.toBe(oldSetup);
    expect(element.srcObject).toBe(stream);
    expect(getUserMedia.mock.calls[1][0].video.facingMode.ideal).toBe("environment");
  });
  it("keeps high-frequency pose data outside React notifications", async () => {
    const instance = engine(); const element = video();
    await instance.start(undefined, element);
    const statusChanged = vi.fn(); const frameChanged = vi.fn();
    instance.subscribe(statusChanged); instance.onFrame(frameChanged);
    for (let i = 1; i <= 60; i++) {
      clock = i * 34;
      Object.defineProperty(element, "currentTime", { value: i / 30, configurable: true });
      frameCallback?.(clock); await flush(); animation?.(clock);
    }
    expect(frameChanged.mock.calls.length).toBeGreaterThan(50);
    expect(statusChanged.mock.calls.length).toBeLessThan(10);
    expect(instance.getSnapshot().usable).toBe(true);
    expect(instance.metrics.externalRequests).toBe(0);
  });
  it("suppresses usable input immediately on loss and waits for stable recovery", async () => {
    const instance = engine(); const element = video();
    await instance.start(undefined, element);
    const advance = async (count: number) => {
      for (let i = 0; i < count; i++) {
        clock += 34;
        Object.defineProperty(element, "currentTime", { value: clock / 1000, configurable: true });
        frameCallback?.(clock); await flush(); animation?.(clock);
      }
    };
    await advance(35);
    expect(instance.getSnapshot().usable).toBe(true);
    occluded = true;
    await advance(1);
    expect(instance.getSnapshot().usable).toBe(false);
    expect(instance.frame?.usable).toBe(false);
    await advance(150);
    expect(instance.getSnapshot().tracking).toBe("LOST_LONG");
    occluded = false;
    await advance(1);
    expect(instance.getSnapshot().usable).toBe(false);
    await advance(35);
    expect(instance.getSnapshot().usable).toBe(true);
  });
  it("ignores a late frame from a detached video attachment", async () => {
    const instance = engine(); const element = video();
    await instance.start(undefined, element);
    instance.detach();
    MockWorker.instances[0].send({ type: "frame", requestId: 1, frame: { tPerfMs: 0, joints: {} }, delegate: "GPU", inferenceMs: 1 });
    expect(instance.frame).toBeNull();
  });
});

it("provides actionable camera errors without leaking internal exception detail", () => {
  const error = new Error("private driver detail"); error.name = "NotReadableError";
  expect(cameraError(error)).toContain("Close other camera apps");
  expect(cameraError(error)).not.toContain("private driver detail");
});
