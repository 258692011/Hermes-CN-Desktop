const LEGACY_ARCHIVED_SESSIONS_STORAGE_KEY = "hermes-cn-ui.archivedSessions";
const SESSION_TITLE_OVERRIDES_STORAGE_KEY = "hermes-cn-ui.sessionTitleOverrides";
const SESSION_UI_STATE_CHANGED_EVENT = "hermes-cn-ui.sessionUiState.changed";

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function emitSessionUiStateChange(): void {
  try {
    window.dispatchEvent(new Event(SESSION_UI_STATE_CHANGED_EVENT));
  } catch {}
}

function readJSON<T>(key: string, fallback: T): T {
  const store = safeLocalStorage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  const store = safeLocalStorage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
    emitSessionUiStateChange();
  } catch {}
}

export function readLegacyArchivedSessionIds(): string[] {
  const raw = readJSON<unknown>(LEGACY_ARCHIVED_SESSIONS_STORAGE_KEY, []);
  const ids = Array.isArray(raw) ? raw : [];
  return [...new Set(ids.filter((id): id is string =>
    typeof id === "string" && id.trim().length > 0,
  ).map((id) => id.trim()))];
}

export function clearLegacyArchivedSessionIds(): void {
  const store = safeLocalStorage();
  if (!store) return;
  try {
    store.removeItem(LEGACY_ARCHIVED_SESSIONS_STORAGE_KEY);
  } catch {}
}

export function readSessionTitleOverrides(): Record<string, string> {
  const raw = readJSON<unknown>(SESSION_TITLE_OVERRIDES_STORAGE_KEY, {});
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).flatMap(([sessionId, title]) => {
      const cleanSessionId = sessionId.trim();
      const cleanTitle = typeof title === "string" ? title.trim() : "";
      return cleanSessionId && cleanTitle ? [[cleanSessionId, cleanTitle]] : [];
    }),
  );
}

export function rememberSessionTitleOverride(sessionId: string, title: string): void {
  const cleanSessionId = sessionId.trim();
  const cleanTitle = title.trim();
  if (!cleanSessionId || !cleanTitle) return;
  const overrides = readSessionTitleOverrides();
  overrides[cleanSessionId] = cleanTitle;
  writeJSON(SESSION_TITLE_OVERRIDES_STORAGE_KEY, overrides);
}

export function subscribeSessionUiStateChanges(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_TITLE_OVERRIDES_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(SESSION_UI_STATE_CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SESSION_UI_STATE_CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
