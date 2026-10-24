import { describe, expect, it } from "vitest";

import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "./config";

describe("app identity", () => {
  it("exposes the product name", () => {
    expect(APP_NAME).toBe("Move Along");
  });

  it("provides non-empty public copy", () => {
    for (const value of [APP_TAGLINE, APP_DESCRIPTION]) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});
