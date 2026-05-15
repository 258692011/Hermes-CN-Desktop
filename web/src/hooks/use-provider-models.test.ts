import { describe, expect, it } from "vitest";
import { ProviderModelsResponse } from "@hermes/protocol";
import { buildModelsUrl } from "./use-provider-models";

describe("buildModelsUrl", () => {
  it("appends /models to the base URL", () => {
    expect(buildModelsUrl("https://api.modelverse.cn/v1")).toBe(
      "https://api.modelverse.cn/v1/models",
    );
  });

  it("normalises trailing slashes", () => {
    expect(buildModelsUrl("https://api.modelverse.cn/v1/")).toBe(
      "https://api.modelverse.cn/v1/models",
    );
    expect(buildModelsUrl("https://api.modelverse.cn/v1///")).toBe(
      "https://api.modelverse.cn/v1/models",
    );
  });
});

describe("ProviderModelsResponse parsing", () => {
  it("parses canonical OpenAI shape", () => {
    const result = ProviderModelsResponse.parse({
      object: "list",
      data: [
        { id: "gpt-4", object: "model", owned_by: "openai", created: 1 },
        { id: "gpt-3.5-turbo", object: "model", owned_by: "openai" },
      ],
    });
    expect(result.data.map((m) => m.id)).toEqual(["gpt-4", "gpt-3.5-turbo"]);
  });

  it("tolerates missing optional fields", () => {
    const result = ProviderModelsResponse.parse({ data: [{ id: "deepseek-v4-flash" }] });
    expect(result.data[0]?.id).toBe("deepseek-v4-flash");
  });

  it("defaults data to empty when omitted", () => {
    const result = ProviderModelsResponse.parse({});
    expect(result.data).toEqual([]);
  });
});
