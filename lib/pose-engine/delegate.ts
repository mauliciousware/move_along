export type Delegate = "GPU" | "CPU";
export interface Detector<Frame, Result> {
  detectForVideo(frame: Frame, time: number): Result;
  close(): void;
}
/** Both initialization and runtime GPU failures get one CPU retry. */
export class FallbackDetector<Frame, Result> {
  delegate: Delegate = "GPU";
  private detector: Detector<Frame, Result> | null = null;
  constructor(private readonly create: (delegate: Delegate) => Promise<Detector<Frame, Result>>) {}
  async init() {
    try { this.detector = await this.create("GPU"); }
    catch { this.delegate = "CPU"; this.detector = await this.create("CPU"); }
  }
  async detect(frame: Frame, time: number) {
    if (!this.detector) throw new Error("Pose detector is not initialized");
    try { return this.detector.detectForVideo(frame, time); }
    catch (error) {
      if (this.delegate === "CPU") throw error;
      try { this.close(); } catch { /* A failed GPU context can also throw on disposal. */ }
      this.delegate = "CPU";
      this.detector = await this.create("CPU");
      return this.detector.detectForVideo(frame, time);
    }
  }
  close() {
    try { this.detector?.close(); } finally { this.detector = null; }
  }
}
