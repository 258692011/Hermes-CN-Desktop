import { SectionShell } from "./section-shell";
import { CronSection } from "./settings";

export function CronRoute() {
  return (
    <SectionShell title="定时任务">
      <CronSection />
    </SectionShell>
  );
}
