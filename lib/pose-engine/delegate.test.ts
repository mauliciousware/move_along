import { describe, expect, it, vi } from "vitest";
import { FallbackDetector } from "./delegate";

describe("GPU to CPU fallback", () => {
  it("retries initialization on CPU when GPU is unavailable", async () => {
    const create = vi.fn(async (delegate: string) => {
      if (delegate === "GPU") throw new Error("GPU unavailable");
      return { detectForVideo: () => "pose", close: vi.fn() };
    });
    const detector = new FallbackDetector(create);
    await detector.init();
    expect(detector.delegate).toBe("CPU");
    expect(await detector.detect({}, 0)).toBe("pose");
    expect(create.mock.calls.map(call => call[0])).toEqual(["GPU", "CPU"]);
  });
  it("retries a failed runtime frame once on CPU and disposes the GPU", async () => {
    const close = vi.fn();
    const create = vi.fn(async (delegate: string) => ({
      detectForVideo: () => { if (delegate === "GPU") throw new Error("lost GPU context"); return "pose"; }, close,
    }));
    const detector = new FallbackDetector(create);
    await detector.init();
    expect(await detector.detect({}, 50)).toBe("pose");
    expect(close).toHaveBeenCalledTimes(1);
    expect(detector.delegate).toBe("CPU");
    await detector.detect({}, 100);
    expect(create).toHaveBeenCalledTimes(2);
  });
  it("propagates CPU failure instead of retrying indefinitely", async () => {
    const create = vi.fn(async () => ({ detectForVideo: () => { throw new Error("inference failed"); }, close: vi.fn() }));
    const detector = new FallbackDetector(create);
    await detector.init();
    await expect(detector.detect({}, 0)).rejects.toThrow("inference failed");
    expect(create).toHaveBeenCalledTimes(2);
  });
});
