import type { HermesMessageMetadata } from "@hermes/protocol";

const STORAGE_KEY = "hermes:message-stats";
const MAX_SESSIONS = 500;

interface SessionStats {
  metadata: HermesMessageMetadata;
  savedAt: number;
}

type StatsStore = Record<string, SessionStats>;

function readStore(): StatsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: StatsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

function pruneStore(store: StatsStore): StatsStore {
  const entries = Object.entries(store);
  if (entries.length <= MAX_SESSIONS) return store;
  entries.sort(([, a], [, b]) => b.savedAt - a.savedAt);
  return Object.fromEntries(entries.slice(0, MAX_SESSIONS));
}

export function persistMessageStats(
  sessionId: string,
  metadata: HermesMessageMetadata,
): void {
  const store = readStore();
  store[sessionId] = { metadata, savedAt: Date.now() };
  writeStore(pruneStore(store));
}

export function findCachedMetadata(
  sessionId: string,
): HermesMessageMetadata | undefined {
  return readStore()[sessionId]?.metadata;
}
