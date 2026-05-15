import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Reload the factory module each test so the singleton cache resets.
async function loadFactory() {
  vi.resetModules();
  return await import("./gateway-client");
}

interface FakeWindow {
  location: { search: string; href: string };
  localStorage: {
    _data: Record<string, string>;
    getItem(k: string): string | null;
    setItem(k: string, v: string): void;
    removeItem(k: string): void;
  };
  __HERMES_RUNTIME__?: { transport?: "ws" | "sse" };
}

let fakeWindow: FakeWindow;

function setQuery(search: string): void {
  fakeWindow.location.search = search ? `?${search}` : "";
  fakeWindow.location.href = `http://test/${fakeWindow.location.search}`;
}

beforeEach(() => {
  fakeWindow = {
    location: { search: "", href: "http://test/" },
    localStorage: {
      _data: {},
      getItem(k) {
        return this._data[k] ?? null;
      },
      setItem(k, v) {
        this._data[k] = v;
      },
      removeItem(k) {
        delete this._data[k];
      },
    },
  };
  (globalThis as any).window = fakeWindow;
  // Stub EventSource so any module init that touches it doesn't crash.
  (globalThis as any).EventSource = class FakeES {
    static OPEN = 1;
    static CLOSED = 2;
    readyState = 0;
    addEventListener() {}
    close() {}
    onmessage: any = null;
    onerror: any = null;
    constructor(public url: string) {}
  };
});

afterEach(() => {
  delete (globalThis as any).window;
});

describe("getGatewayClient transport selection", () => {
  it("defaults to WebSocket transport when no flag is set", async () => {
    const mod = await loadFactory();
    const client = mod.getGatewayClient();
    expect(mod.getActiveTransport()).toBe("ws");
    expect(client.constructor.name).toBe("GatewayClient");
  });

  it("picks SSE transport when ?transport=sse is in URL", async () => {
    setQuery("transport=sse");
    const mod = await loadFactory();
    const client = mod.getGatewayClient();
    expect(mod.getActiveTransport()).toBe("sse");
    expect(client.constructor.name).toBe("GatewaySseClient");
  });

  it("picks SSE transport when localStorage HERMES_TRANSPORT=sse", async () => {
    fakeWindow.localStorage.setItem("HERMES_TRANSPORT", "sse");
    const mod = await loadFactory();
    const client = mod.getGatewayClient();
    expect(mod.getActiveTransport()).toBe("sse");
    expect(client.constructor.name).toBe("GatewaySseClient");
  });

  it("URL query takes precedence over localStorage", async () => {
    fakeWindow.localStorage.setItem("HERMES_TRANSPORT", "sse");
    setQuery("transport=ws");
    const mod = await loadFactory();
    const client = mod.getGatewayClient();
    expect(mod.getActiveTransport()).toBe("ws");
    expect(client.constructor.name).toBe("GatewayClient");
  });

  it("returns the same instance on repeat calls (singleton)", async () => {
    const mod = await loadFactory();
    expect(mod.getGatewayClient()).toBe(mod.getGatewayClient());
  });

  it("honors __HERMES_RUNTIME__.transport injected by Electron preload", async () => {
    fakeWindow.__HERMES_RUNTIME__ = { transport: "sse" };
    const mod = await loadFactory();
    const client = mod.getGatewayClient();
    expect(mod.getActiveTransport()).toBe("sse");
    expect(client.constructor.name).toBe("GatewaySseClient");
  });

  it("URL query and localStorage trump __HERMES_RUNTIME__.transport", async () => {
    fakeWindow.__HERMES_RUNTIME__ = { transport: "sse" };
    fakeWindow.localStorage.setItem("HERMES_TRANSPORT", "ws");
    const mod = await loadFactory();
    const client = mod.getGatewayClient();
    expect(mod.getActiveTransport()).toBe("ws");
    expect(client.constructor.name).toBe("GatewayClient");
  });
});
