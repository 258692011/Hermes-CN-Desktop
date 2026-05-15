import { describe, expect, it } from "vitest";
import { sessionLogToMessages } from "./session-log";

describe("session log fallback", () => {
  it("converts raw session log messages into API-shaped messages", () => {
    const messages = sessionLogToMessages("20260426_064757_86bcfb", {
      session_start: "2026-04-26T06:47:57.000000",
      messages: [
        { role: "user", content: "检查 Tavily" },
        {
          role: "assistant",
          content: "",
          finish_reason: "tool_calls",
          reasoning_content: "Need to inspect config.",
          tool_calls: [
            {
              id: "call_1",
              function: { name: "read_file", arguments: "{\"path\":\"~/.hermes/config.yaml\"}" },
            },
          ],
        },
        {
          role: "tool",
          content: { content: "configured" },
          tool_call_id: "call_1",
        },
      ],
    });

    expect(messages).toHaveLength(3);
    expect(messages[0]).toMatchObject({
      id: 1,
      session_id: "20260426_064757_86bcfb",
      role: "user",
      content: "检查 Tavily",
    });
    expect(messages[1]?.tool_calls).toHaveLength(1);
    expect(messages[1]?.reasoning_content).toBe("Need to inspect config.");
    expect(messages[2]).toMatchObject({
      role: "tool",
      tool_call_id: "call_1",
      content: "{\"content\":\"configured\"}",
    });
    expect(messages[2]?.timestamp).toBeGreaterThan(messages[0]!.timestamp);
  });

  it("drops malformed entries instead of poisoning the timeline", () => {
    const messages = sessionLogToMessages("session", {
      messages: [
        null,
        { role: "unknown", content: "bad" },
        { role: "assistant", content: "ok" },
      ],
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe("ok");
  });
});
