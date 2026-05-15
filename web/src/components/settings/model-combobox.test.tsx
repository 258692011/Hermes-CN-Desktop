import { describe, expect, it } from "vitest";
import { filterOptions } from "./model-combobox";

describe("filterOptions", () => {
  const all = ["deepseek-v4-flash", "deepseek-v4-pro", "qwen3-coder-plus", "glm-5.1"];

  it("returns all options for an empty query", () => {
    expect(filterOptions(all, "")).toEqual(all);
  });

  it("filters case-insensitively by substring", () => {
    expect(filterOptions(all, "deepseek")).toEqual(["deepseek-v4-flash", "deepseek-v4-pro"]);
    expect(filterOptions(all, "DEEPSEEK")).toEqual(["deepseek-v4-flash", "deepseek-v4-pro"]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterOptions(all, "claude")).toEqual([]);
  });
});
