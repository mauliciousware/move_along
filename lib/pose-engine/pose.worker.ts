/// <reference lib="webworker" />
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { CONFIG } from "@/lib/shared/config";
import { FallbackDetector } from "./delegate";
import { readLandmarks } from "./landmarks";
import type { WorkerReply, WorkerRequest } from "./protocol";

const scope = globalThis as unknown as DedicatedWorkerGlobalScope & { Vision: typeof import("@mediapipe/tasks-vision") };
let detector: FallbackDetector<ImageBitmap, PoseLandmarkerResult> | null = null;
function send(message: WorkerReply) { scope.postMessage(message); }
scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    if (request.type === "init") {
      if (request.origin !== scope.location.origin) throw new Error("Pose assets must use this application's origin");
      scope.importScripts(new URL(CONFIG.pose.libraryPath, request.origin).href);
      const { FilesetResolver, PoseLandmarker } = scope.Vision;
      const wasm = await FilesetResolver.forVisionTasks(new URL(CONFIG.pose.wasmPath, request.origin).href);
      detector = new FallbackDetector(async delegate => PoseLandmarker.createFromOptions(wasm, {
        baseOptions: { modelAssetPath: new URL(CONFIG.pose.modelPath, request.origin).href, delegate },
        canvas: new OffscreenCanvas(CONFIG.camera.width, CONFIG.camera.height),
        runningMode: "VIDEO", numPoses: CONFIG.pose.numPoses,
        minPoseDetectionConfidence: CONFIG.tracking.minConfidence,
        minPosePresenceConfidence: CONFIG.tracking.minConfidence,
        minTrackingConfidence: CONFIG.tracking.minConfidence,
        outputSegmentationMasks: false,
      }));
      await detector.init();
      send({ type: "ready", delegate: detector.delegate, assets: performance.getEntriesByType("resource").map(entry => entry.name) });
    } else {
      if (!detector) throw new Error("Pose detector is not ready");
      const started = performance.now();
      const result = await detector.detect(request.bitmap, request.tPerfMs);
      try {
        send({ type: "frame", frame: readLandmarks(result.landmarks[0] ?? [], request.tPerfMs), requestId: request.requestId, inferenceMs: performance.now() - started, delegate: detector.delegate });
      } finally { result.close(); }
    }
  } catch (error) {
    send({ type: "error", message: error instanceof Error ? error.message : "Local tracking failed" });
  } finally {
    if (request.type === "frame") request.bitmap.close();
  }
};
