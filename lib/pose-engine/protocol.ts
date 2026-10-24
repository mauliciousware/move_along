import type { RawPoseFrame } from "@/lib/shared/types";
import type { Delegate } from "./delegate";
export type WorkerRequest = { type: "init"; origin: string } | { type: "frame"; bitmap: ImageBitmap; tPerfMs: number; requestId: number };
export type WorkerReply = { type: "ready"; delegate: Delegate; assets: string[] } |
  { type: "frame"; frame: RawPoseFrame; inferenceMs: number; delegate: Delegate; requestId: number } |
  { type: "error"; message: string };
