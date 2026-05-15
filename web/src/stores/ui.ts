import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const activeSessionIdAtom = atom<string | null>(null);
export const sidebarSearchAtom = atom("");

// Active profile name. Persisted in localStorage so refresh / multi-tab keeps
// the user's choice. "default" is the upstream's reserved name for the root
// HERMES_HOME (~/.hermes), so we use it both as the literal default profile
// label and as the bootstrap value before the backend has been queried.
//
// Web 模式（v2 dev / 公网部署）下 dashboard 仍绑启动时的 HERMES_HOME，切换
// profile 只更新 sticky 默认值——生效需要用户重启 dashboard（direction A）。
// Desktop 模式 (Electron) 下主进程 own dashboard 子进程，切换走 IPC →
// stop + spawn，真正即时生效（direction B）。X-Hermes-Profile header 是给
// 未来 fork 改造支持 per-request 路由用的占位（direction C）。
export const activeProfileAtom = atomWithStorage<string>(
  "hermes.active-profile",
  "default",
);

export const showReasoningAtom = atomWithStorage<boolean>(
  "hermes.show-reasoning",
  false,
);

// Set to true while the desktop main process is restarting the dashboard
// subprocess for a profile switch. The window-level overlay in ProfileSwitcherOverlay
// reads this and blocks UI interaction until the new dashboard is ready.
// Stays false in web mode (sticky-only switch is instant).
export const profileSwitchingAtom = atom<{ active: boolean; targetName?: string }>({
  active: false,
});
