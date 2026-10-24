import { describe, expect, it } from "vitest";
import { CONFIG } from "@/lib/shared/config";
import { TrackingMonitor } from "./tracking";
import { FrameGate } from "./frame-gate";
import { OneEuroFilter } from "./filter";

describe("tracking loss and deliberate recovery", () => {
  it("requires a continuous good interval before tracking is ready", () => {
    const monitor = new TrackingMonitor();
    expect(monitor.update(true, 0)).toBe("LOST");
    expect(monitor.update(true, CONFIG.tracking.recoverMs - 1)).toBe("LOST");
    expect(monitor.update(true, CONFIG.tracking.recoverMs)).toBe("TRACKING");
  });
  it("debounces brief loss and identifies sustained loss", () => {
    const monitor = new TrackingMonitor();
    monitor.update(true, 0); monitor.update(true, 1000);
    expect(monitor.update(false, 1100)).toBe("TRACKING");
    expect(monitor.update(false, 1599)).toBe("TRACKING");
    expect(monitor.update(false, 1600)).toBe("LOST");
    expect(monitor.update(false, 6100)).toBe("LOST_LONG");
    expect(monitor.update(true, 6200)).toBe("LOST_LONG");
    expect(monitor.update(false, 6300)).toBe("LOST_LONG");
    expect(monitor.update(true, 6400)).toBe("LOST_LONG");
    expect(monitor.update(true, 7400)).toBe("TRACKING");
  });
});

it("caps inference to 30 requests in every rolling second under jitter", () => {
  const gate = new FrameGate();
  const accepted: number[] = [];
  for (let t = 0; t < 5000; t += 7) if (gate.accept(t)) accepted.push(t);
  for (const time of accepted) expect(accepted.filter(t => t > time - 1000 && t <= time).length).toBeLessThanOrEqual(CONFIG.camera.maxHz);
  expect(accepted.length).toBeGreaterThan(100);
});

it("smooths jitter, keeps bounded values, and resets on a new setup", () => {
  const filter = new OneEuroFilter();
  filter.update(0.5, 0);
  const filtered = filter.update(0.55, 33);
  expect(filtered).toBeGreaterThan(0.5);
  expect(filtered).toBeLessThan(0.55);
  expect(filter.update(0.1, 32)).toBe(filtered);
  filter.reset();
  expect(filter.update(0.8, 1000)).toBe(0.8);
});
