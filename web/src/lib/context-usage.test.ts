import { describe, expect, it } from "vitest";
import {
  contextUsagePercent,
  contextUsageRisk,
} from "./context-usage";

describe("context usage helpers", () => {
  it("uses explicit percentage when present", () => {
    expect(contextUsagePercent({ used: 50, max: 100, percent: 12 })).toBe(12);
  });

  it("computes percentage from used and max", () => {
    expect(contextUsagePercent({ used: 1_600_000, max: 1_000_000 })).toBe(160);
  });

  it("classifies warning and danger levels", () => {
    expect(contextUsageRisk({ percent: 84 })).toBe("ok");
    expect(contextUsageRisk({ percent: 85 })).toBe("warning");
    expect(contextUsageRisk({ percent: 100 })).toBe("danger");
  });
});
