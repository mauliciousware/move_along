import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";
import { EXERCISE_IDS } from "./data/catalog";

describe("exercise routes", () => {
  it.each(EXERCISE_IDS)("keeps the active %s route reachable", async exercise => {
    const redirects = await nextConfig.redirects!();
    expect(redirects.some(rule => rule.source === `/${exercise}`)).toBe(false);
  });
  it("redirects the retired march URL home", async () => {
    expect(await nextConfig.redirects!()).toContainEqual({ source: "/march", destination: "/", permanent: true });
  });
});
