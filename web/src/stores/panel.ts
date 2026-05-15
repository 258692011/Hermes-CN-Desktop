import { atom } from "jotai";

/**
 * Quick-start recipe → PanelComposer prefill bridge.
 * QuickStart writes; PanelComposer listens (effect on `nonce`) and pushes the
 * text into GooseComposer via its `initial` prop. `nonce` lets the same recipe
 * re-trigger a prefill if the user edits and clicks again.
 */
export const composerPrefillAtom = atom<{ text: string; nonce: number } | null>(null);
