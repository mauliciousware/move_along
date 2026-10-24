import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("retired exercise routes", () => {
  it("redirects squat and march URLs home permanently", async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toEqual(expect.arrayContaining([
      { source: "/squat", destination: "/", permanent: true },
      { source: "/march", destination: "/", permanent: true },
    ]));
  });
});
