import { CONFIG } from "../shared/config";
import type { TrackingStatus } from "../shared/types";

export class TrackingMonitor {
  status: TrackingStatus = "LOST";
  private badSince: number | null = null;
  private goodSince: number | null = null;
  update(ok: boolean, now: number): TrackingStatus {
    if (!ok) {
      this.goodSince = null;
      this.badSince ??= now;
      const elapsed = now - this.badSince;
      if (elapsed >= CONFIG.tracking.autoPauseAfterMs) this.status = "LOST_LONG";
      else if (elapsed >= CONFIG.tracking.lostAfterMs) this.status = "LOST";
    } else {
      if (this.status === "TRACKING") {
        this.badSince = null;
        this.goodSince = now;
        return this.status;
      }
      this.goodSince ??= now;
      // A single good frame must not reset the long-loss timer during recovery.
      if (now - this.goodSince >= CONFIG.tracking.recoverMs) {
        this.status = "TRACKING";
        this.badSince = null;
      }
    }
    return this.status;
  }
}
