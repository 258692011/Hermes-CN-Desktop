import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  forgetLastUsedModel,
  rememberLastUsedModel,
  readLastUsedModel,
} from "./last-used-model";

describe("last-used-model", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
  });

  it("returns null when nothing stored", () => {
    expect(readLastUsedModel()).toBeNull();
  });

  it("round-trips a selection", () => {
    rememberLastUsedModel({
      model: "gpt-5",
      provider: "openai",
      providerName: "OpenAI",
      contextWindow: 200000,
    });
    expect(readLastUsedModel()).toEqual({
      model: "gpt-5",
      provider: "openai",
      providerName: "OpenAI",
      contextWindow: 200000,
    });
  });

  it("ignores selections without a model", () => {
    rememberLastUsedModel({ model: "" });
    expect(readLastUsedModel()).toBeNull();
  });

  it("expires entries older than 30 days", () => {
    rememberLastUsedModel({ model: "claude-sonnet-4-6" });
    const raw = JSON.parse(window.localStorage.getItem("hermes:last-used-model")!);
    raw.ts = Date.now() - 31 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem("hermes:last-used-model", JSON.stringify(raw));
    expect(readLastUsedModel()).toBeNull();
  });

  it("survives malformed payloads", () => {
    window.localStorage.setItem("hermes:last-used-model", "not json{{{");
    expect(readLastUsedModel()).toBeNull();
    window.localStorage.setItem("hermes:last-used-model", JSON.stringify({ ts: Date.now() }));
    expect(readLastUsedModel()).toBeNull();
    window.localStorage.setItem(
      "hermes:last-used-model",
      JSON.stringify({ ts: Date.now(), selection: { model: 42 } }),
    );
    expect(readLastUsedModel()).toBeNull();
  });

  it("forgets on demand", () => {
    rememberLastUsedModel({ model: "claude-opus-4-7" });
    forgetLastUsedModel();
    expect(readLastUsedModel()).toBeNull();
  });
});
