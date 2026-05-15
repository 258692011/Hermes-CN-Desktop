import { useStatus } from "@/hooks/use-status";
import { HealthGrid } from "@/components/panel/health-grid";
import { SectionShell } from "./section-shell";

export function HealthRoute() {
  const { data: status, isError } = useStatus();
  const sub = isError
    ? "Dashboard 离线"
    : status
      ? `${status.gateway_state || "unknown"} · v${status.version}`
      : "加载中…";
  return (
    <SectionShell title="健康检查" sub={sub}>
      <HealthGrid />
    </SectionShell>
  );
}
