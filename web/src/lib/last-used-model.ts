import { useEffect, useState } from "react";
import type { ComposerModelSelection } from "@/components/chat/composer-types";

const STORAGE_KEY = "hermes:last-used-model";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const subscribers = new Set<() => void>();

function notifyLastUsedModelChanged() {
  subscribers.forEach((fn) => fn());
}

interface StoredEntry {
  selection: ComposerModelSelection;
  ts: number;
}

function isValidSelection(value: unknown): value is ComposerModelSelection {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.model !== "string" || !v.model) return false;
  if (v.provider !== undefined && typeof v.provider !== "string") return false;
  if (v.providerName !== undefined && typeof v.providerName !== "string") return false;
  if (v.contextWindow !== undefined && typeof v.contextWindow !== "number") return false;
  return true;
}

export function readLastUsedModel(): ComposerModelSelection | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEntry | null;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) return null;
    if (!isValidSelection(parsed.selection)) return null;
    return parsed.selection;
  } catch {
    return null;
  }
}

export function rememberLastUsedModel(selection: ComposerModelSelection) {
  if (!isValidSelection(selection)) return;
  try {
    const entry: StoredEntry = { selection, ts: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    notifyLastUsedModelChanged();
  } catch {}
}

export function forgetLastUsedModel() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    notifyLastUsedModelChanged();
  } catch {}
}

// React hook — re-renders when last-used model changes (in this tab via
// rememberLastUsedModel/forgetLastUsedModel, or in another tab via storage event).
export function useLastUsedModel(): ComposerModelSelection | null {
  const [value, setValue] = useState<ComposerModelSelection | null>(() => readLastUsedModel());

  useEffect(() => {
    const refresh = () => setValue(readLastUsedModel());
    subscribers.add(refresh);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      subscribers.delete(refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return value;
}
