import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { debugBus } from "./debug-bus";
import { fetchExternalJSON, fetchJSON } from "./transport";

type PushArg = Parameters<typeof debugBus.push>[0];

function restPushesFrom(spy: MockInstance<typeof debugBus.push>): PushArg[] {
  return spy.mock.calls
    .map((call) => call[0])
    .filter((entry): entry is PushArg => entry.type === "rest");
}

// runtime.ts reads `window.__HERMES_RUNTIME__` lazily; vitest's default node
// pool has no `window`. Stub a minimal one so the platform getter resolves
// to "web" and fetchJSON falls into the native fetch branch.
let windowStubbed = false;
beforeAll(() => {
  if (typeof (globalThis as { window?: unknown }).window === "undefined") {
    (globalThis as { window?: unknown }).window = {};
    windowStubbed = true;
  }
});
afterAll(() => {
  if (windowStubbed) {
    delete (globalThis as { window?: unknown }).window;
  }
});

describe("transport · debug-bus integration", () => {
  let pushSpy: MockInstance<typeof debugBus.push>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    debugBus.clear();
    pushSpy = vi.spyOn(debugBus, "push");
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    pushSpy.mockRestore();
    globalThis.fetch = originalFetch;
  });

  function stubFetch(impl: () => Response | Promise<Response>) {
    globalThis.fetch = vi.fn(async () => impl()) as unknown as typeof globalThis.fetch;
  }

  function makeResponse(status: number, body: string): Response {
    return new Response(body, {
      status,
      headers: { "Content-Type": "text/plain" },
    });
  }

  it("fetchJSON pushes a REST entry on non-ok response", async () => {
    stubFetch(() => makeResponse(401, "unauthorized"));

    await expect(fetchJSON("/api/protected")).rejects.toThrow(/HTTP 401/);

    const restPushes = restPushesFrom(pushSpy);
    expect(restPushes.length).toBeGreaterThan(0);
    const last = restPushes[restPushes.length - 1];
    expect(last.level).toBe("error");
    expect(last.summary).toContain("401");
    expect(last.summary).toContain("/api/protected");
    expect(last.payload).toMatchObject({ status: 401, url: "/api/protected" });
  });

  it("fetchJSON does not push when the response is ok", async () => {
    stubFetch(() => makeResponse(200, '{"ok":true}'));

    const out = await fetchJSON<{ ok: boolean }>("/api/x");
    expect(out).toEqual({ ok: true });

    const restPushes = restPushesFrom(pushSpy);
    expect(restPushes.length).toBe(0);
  });

  it("fetchExternalJSON pushes a REST entry on non-ok response", async () => {
    stubFetch(() => makeResponse(404, "not found"));

    await expect(
      fetchExternalJSON("https://provider.example/v1/models"),
    ).rejects.toThrow(/HTTP 404/);

    const restPushes = restPushesFrom(pushSpy);
    expect(restPushes.length).toBeGreaterThan(0);
    const last = restPushes[restPushes.length - 1];
    expect(last.summary).toContain("404");
    expect(last.summary).toContain("provider.example");
  });

  it("fetchExternalJSON pushes a REST entry on network/timeout failure", async () => {
    // Simulate timeout / network error — fetch rejects.
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("network failed");
    }) as unknown as typeof globalThis.fetch;

    await expect(
      fetchExternalJSON("https://provider.example/v1/models"),
    ).rejects.toThrow();

    const restPushes = restPushesFrom(pushSpy);
    expect(restPushes.length).toBeGreaterThan(0);
  });
});
