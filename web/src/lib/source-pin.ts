const PINNED_SOURCES_KEY = "hermes-cn-ui.pinnedSources";
const PINNED_CHANGED_EVENT = "hermes-cn-ui.pinnedSources.changed";

const DEFAULT_PINNED: ReadonlySet<string> = new Set(["web", "cli"]);

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function emitChange(): void {
  try {
    window.dispatchEvent(new Event(PINNED_CHANGED_EVENT));
  } catch {}
}

export function readPinnedSources(): Set<string> {
  const store = safeLocalStorage();
  if (!store) return new Set(DEFAULT_PINNED);
  try {
    const raw = store.getItem(PINNED_SOURCES_KEY);
    if (raw === null) return new Set(DEFAULT_PINNED);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0));
  } catch {
    return new Set(DEFAULT_PINNED);
  }
}

export function writePinnedSources(ids: Set<string>): void {
  const store = safeLocalStorage();
  if (!store) return;
  try {
    store.setItem(PINNED_SOURCES_KEY, JSON.stringify(Array.from(ids)));
    emitChange();
  } catch {}
}

export function togglePinnedSource(key: string): Set<string> {
  const ids = readPinnedSources();
  if (ids.has(key)) ids.delete(key);
  else ids.add(key);
  writePinnedSources(ids);
  return ids;
}

export function subscribePinnedSourcesChange(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === PINNED_SOURCES_KEY) listener();
  };
  window.addEventListener(PINNED_CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PINNED_CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
