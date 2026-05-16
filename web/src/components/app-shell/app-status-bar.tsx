import { useEffect, useState } from "react";
import { useStatus } from "@/hooks/use-status";
import { useModelInfo } from "@/hooks/use-config";
import { useActiveProfileName } from "@/hooks/use-profiles";
import s from "./app-status-bar.module.css";

function useNowMinute() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function formatTime(d: Date) {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function AppStatusBar() {
  const { data: status, isError: statusError } = useStatus();
  const { data: modelInfo } = useModelInfo();
  const profile = useActiveProfileName();
  const now = useNowMinute();

  // 与 sidebar.tsx 同一份判定：v2 transport 不再依赖 PTY daemon，
  // 所以 daemon stopped 也算 ready；只有拉不到 status 才视为 offline。
  const daemonRunning = status?.gateway_state === "running" || status?.gateway_running;
  const gatewayState = statusError
    ? "offline"
    : status
      ? daemonRunning
        ? "running"
        : "ready"
      : "unknown";
  const gatewayLabel = statusError
    ? "离线"
    : status
      ? daemonRunning
        ? "运行中"
        : "就绪"
      : "连接中";
  const modelLabel = modelInfo?.model ?? "—";
  const activeSessions = status?.active_sessions ?? 0;

  return (
    <footer className={s.statusbar} role="status" aria-label="运行状态">
      <span className={s.stat}>
        <span className={s.dot} data-state={gatewayState} />
        <span className={s.lbl}>网关</span>
        <span className={s.val}>{gatewayLabel}</span>
      </span>
      <span className={s.sep} />
      <span className={s.stat}>
        <span className={s.lbl}>模型</span>
        <span className={s.val}>{modelLabel}</span>
      </span>
      <span className={s.sep} />
      <span className={s.stat}>
        <span className={s.lbl}>profile</span>
        <span className={s.val}>{profile}</span>
      </span>
      <div className={s.right}>
        <span className={s.stat}>
          <span className={s.lbl}>活跃</span>
          <span className={s.val}>{activeSessions}</span>
        </span>
        <span className={s.sep} />
        <span className={s.stat}>
          <span className={s.val}>{formatTime(now)}</span>
        </span>
      </div>
    </footer>
  );
}
