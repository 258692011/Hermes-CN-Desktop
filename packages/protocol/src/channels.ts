export const CHANNEL_PREFIX = "hermes_desktop";

const ch = (name: string) => `${CHANNEL_PREFIX}:${name}` as const;

export const Channels = {
  apiRequest: ch("api-request"),
  externalRequest: ch("external-request"),
  uploadFile: ch("upload-file"),
  pickFiles: ch("pick-files"),
  pickDirectory: ch("pick-directory"),
  createWorkspaceProject: ch("create-workspace-project"),
  openWorkspacePath: ch("open-workspace-path"),
  refreshGatewayUrl: ch("refresh-gateway-url"),
  runtimeInfo: ch("runtime-info"),
  runtimeCheckUpdate: ch("runtime-check-update"),
  runtimeInstallUpdate: ch("runtime-install-update"),
  runtimeRollback: ch("runtime-rollback"),
  switchProfile: ch("switch-profile"),
  getSessionToken: ch("get-session-token"),
  systemResume: ch("system-resume"),
} as const;

export type ChannelName = (typeof Channels)[keyof typeof Channels];

export interface ApiRequestInput {
  path: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | null;
}

export interface ApiRequestResult {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

export interface FileUploadInput {
  sessionId: string;
  name: string;
  type?: string;
  data: ArrayBuffer;
}

export interface FilePickerResult {
  canceled: boolean;
  paths: string[];
}

export interface WorkspacePathInput {
  path: string;
}

export interface RuntimeInstallRecord {
  version: string;
  platform: string;
  arch: string;
  path: string;
  executablePath: string;
  source: "bundled" | "update" | "dev";
  installedAt: string;
  upstreamRepo?: string;
  upstreamCommit?: string;
  artifactSha256?: string;
  previousVersion?: string;
}

export interface RuntimeInfo {
  mode: "managed" | "dev-command" | "dev-source" | "path-fallback" | "missing";
  packaged: boolean;
  platform: string;
  arch: string;
  current?: RuntimeInstallRecord;
  runtimeRoot: string;
  updateManifestUrl?: string;
  updatesConfigured: boolean;
  lastError?: string;
}

export interface RuntimeUpdateManifest {
  channel: string;
  version: string;
  platform: string;
  arch: string;
  artifactUrl: string;
  sha256: string;
  signature: string;
  upstreamRepo: string;
  upstreamCommit: string;
  minAppVersion?: string;
  createdAt?: string;
}

export interface RuntimeUpdateCheckResult {
  ok: boolean;
  updateAvailable: boolean;
  currentVersion?: string;
  manifest?: RuntimeUpdateManifest;
  error?: string;
}

export interface RuntimeInstallUpdateResult {
  ok: boolean;
  installed?: RuntimeInstallRecord;
  previous?: RuntimeInstallRecord;
  error?: string;
}

export interface SwitchProfileInput {
  name: string;
}

// Result of asking the desktop main process to swap the dashboard subprocess
// over to a different profile. On `ok: true`, the renderer must adopt the new
// `apiBaseUrl / gatewayUrl / sessionToken / hermesHome` (token is fresh; URL
// usually unchanged but may have shifted ports if the previous one was busy)
// and invalidate every profile-aware cache. On `ok: false`, the dashboard may
// have rolled back to the previous profile (`recoveredPreviousProfile: true`)
// or be down entirely (`recoveredPreviousProfile: false`); in the second case
// the user has to fix config and restart the desktop.
export interface SwitchProfileResult {
  ok: boolean;
  profileName?: string;
  apiBaseUrl?: string;
  gatewayUrl?: string;
  sessionToken?: string;
  hermesHome?: string;
  error?: string;
  recoveredPreviousProfile?: boolean;
}
