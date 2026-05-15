import { describe, expect, it } from "vitest";
import { normalizeProviderIdForGateway } from "./provider-id";

describe("normalizeProviderIdForGateway", () => {
  it("strips custom prefix from domain-shaped provider ids", () => {
    expect(normalizeProviderIdForGateway("custom:cp.compshare.cn")).toBe("cp.compshare.cn");
  });

  it("keeps regular custom provider slugs intact", () => {
    expect(normalizeProviderIdForGateway("custom:local")).toBe("custom:local");
  });
});
