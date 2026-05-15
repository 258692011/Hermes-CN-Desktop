// Tauri v2 IPC bridge.
//
// Wraps @tauri-apps/api/core::invoke() calls to match the hermesDesktop API
// surface. On initialization, populates window.hermesDesktop so that ALL
// existing call sites (settings.tsx, projects.tsx, goose-composer.tsx, etc.)
// work without any changes.

import type {
  ApiRequestInput,
  ApiRequestResult,
  FilePickerResult,
  FileUploadInput,
  RuntimeInfo,
  RuntimeInstallUpdateResult,
  RuntimeUpdateCheckResult,
  SwitchProfileInput,
  SwitchProfileResult,
} from "@hermes/protocol";

let invoke: typeof import("@tauri-apps/api/core").invoke;

async function ensureInvoke() {
  if (!invoke) {
    const mod = await import("@tauri-apps/api/core");
    invoke = mod.invoke;
  }
  return invoke;
}

const tauriBridge = {
  windowType: "electron" as const,

  async request(input: ApiRequestInput): Promise<ApiRequestResult> {
    const inv = await ensureInvoke();
    return inv("api_request", { input });
  },

  async externalRequest(input: ApiRequestInput): Promise<ApiRequestResult> {
    const inv = await ensureInvoke();
    return inv("external_request", { input });
  },

  async uploadFile(input: FileUploadInput): Promise<ApiRequestResult> {
    const inv = await ensureInvoke();
    const bytes = new Uint8Array(input.data);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return inv("upload_file", {
      input: {
        sessionId: input.sessionId,
        name: input.name,
        type: input.type,
        data: base64,
      },
    });
  },

  async pickFiles(): Promise<FilePickerResult> {
    const inv = await ensureInvoke();
    return inv("pick_files");
  },

  async pickDirectory(): Promise<FilePickerResult> {
    const inv = await ensureInvoke();
    return inv("pick_directory");
  },

  async createWorkspaceProject(): Promise<FilePickerResult> {
    const inv = await ensureInvoke();
    return inv("create_workspace_project");
  },

  async openWorkspacePath(input: { path: string }): Promise<ApiRequestResult> {
    const inv = await ensureInvoke();
    return inv("open_workspace_path", { input });
  },

  getRuntimeConfig() {
    return window.__HERMES_RUNTIME__;
  },

  async refreshGatewayUrl(): Promise<{ gatewayUrl: string; sessionToken?: string }> {
    const inv = await ensureInvoke();
    return inv("refresh_gateway_url");
  },

  async getRuntimeInfo(): Promise<RuntimeInfo> {
    const inv = await ensureInvoke();
    return inv("runtime_info");
  },

  async checkRuntimeUpdate(): Promise<RuntimeUpdateCheckResult> {
    const inv = await ensureInvoke();
    return inv("runtime_check_update");
  },

  async installRuntimeUpdate(): Promise<RuntimeInstallUpdateResult> {
    const inv = await ensureInvoke();
    return inv("runtime_install_update");
  },

  async rollbackRuntime(): Promise<RuntimeInstallUpdateResult> {
    const inv = await ensureInvoke();
    return inv("runtime_rollback");
  },

  async switchProfile(input: SwitchProfileInput): Promise<SwitchProfileResult> {
    const inv = await ensureInvoke();
    return inv("switch_profile", { input });
  },

  onSystemResume(handler: () => void): () => void {
    // Initial build: rely on the JS clock-skew watchdog in gateway-client.ts.
    // The watchdog detects sleep/wake within ~5s, which is acceptable.
    // Native power monitoring can be added later via a Tauri event.
    let unlisten: (() => void) | null = null;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen("system-resume", handler).then((fn) => {
        unlisten = fn;
      });
    });
    return () => {
      unlisten?.();
    };
  },
};

export async function installTauriBridge(): Promise<void> {
  const inv = await ensureInvoke();
  const config = await inv<{
    apiBaseUrl: string;
    gatewayUrl: string;
    sessionToken?: string;
    currentProfile: string;
    transport?: string;
  }>("get_runtime_config");

  const transport = (config.transport === "ws" || config.transport === "sse")
    ? config.transport
    : "sse";

  // Dev mode: WebView loads from Vite dev server (http://localhost:9545).
  // Don't set apiBaseUrl/gatewayUrl — let the browser use relative URLs that
  // go through Vite's proxy, just like web mode. This avoids cross-origin
  // issues with SSE EventSource and WebSocket (browser-native APIs that can't
  // go through the Tauri IPC bridge).
  // Production: WebView loads from bundled assets (tauri:// protocol).
  // Set apiBaseUrl so IPC bridge can proxy requests to the dashboard.
  const isDevMode = window.location.protocol === "http:"
    || window.location.protocol === "https:";

  window.__HERMES_RUNTIME__ = {
    platform: "tauri" as const,
    apiBaseUrl: isDevMode ? undefined : config.apiBaseUrl,
    gatewayUrl: isDevMode ? undefined : config.gatewayUrl,
    sessionToken: isDevMode ? undefined : config.sessionToken,
    currentProfile: config.currentProfile,
    transport,
  };

  (window as any).hermesDesktop = tauriBridge;
}
