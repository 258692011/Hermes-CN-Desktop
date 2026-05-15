import { SectionShell } from "./section-shell";
import { LogsSection } from "./settings";

export function LogsRoute() {
  return (
    <SectionShell title="日志">
      <LogsSection />
    </SectionShell>
  );
}
