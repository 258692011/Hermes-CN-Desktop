const STORAGE_KEY = "hermes:gateway-session-map";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;

interface SessionEntry {
  persistentId: string;
  ts: number;
}

type SessionMap = Record<string, SessionEntry>;

function readMap(): SessionMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    if (typeof Object.values(parsed)[0] === "string") {
      const migrated: SessionMap = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") {
          migrated[key] = { persistentId: value, ts: Date.now() };
        }
      }
      writeMap(migrated);
      return migrated;
    }

    return parsed as SessionMap;
  } catch {
    return {};
  }
}

function writeMap(map: SessionMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function pruneExpired(map: SessionMap): SessionMap {
  const now = Date.now();
  const entries = Object.entries(map).filter(
    ([, entry]) => now - entry.ts < MAX_AGE_MS,
  );

  if (entries.length <= MAX_ENTRIES) {
    return Object.fromEntries(entries);
  }

  entries.sort((a, b) => b[1].ts - a[1].ts);
  return Object.fromEntries(entries.slice(0, MAX_ENTRIES));
}

export function rememberSessionMapping(gatewaySessionId: string, persistentSessionId: string) {
  if (!gatewaySessionId || !persistentSessionId) return;
  if (gatewaySessionId === persistentSessionId) return;
  const map = pruneExpired(readMap());
  map[gatewaySessionId] = { persistentId: persistentSessionId, ts: Date.now() };
  writeMap(map);
}

export function resolvePersistentSessionId(sessionId: string | undefined): string | undefined {
  if (!sessionId) return undefined;
  const entry = readMap()[sessionId];
  if (!entry) return sessionId;
  if (Date.now() - entry.ts > MAX_AGE_MS) return sessionId;
  return entry.persistentId;
}

export function resolveGatewaySessionId(sessionId: string | undefined): string | undefined {
  if (!sessionId) return undefined;
  const map = readMap();
  const now = Date.now();
  for (const [gatewayId, entry] of Object.entries(map)) {
    if (entry.persistentId === sessionId && now - entry.ts < MAX_AGE_MS) {
      return gatewayId;
    }
  }
  return undefined;
}
