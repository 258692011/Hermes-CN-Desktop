import type { ReactNode } from "react";
import { PageFrame, type PageFrameSize } from "@hermes/shared-ui";
import { TopBar } from "@/components/top-bar/top-bar";
import s from "./section-shell.module.css";

interface SectionShellProps {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  rail?: ReactNode;
  railLabel?: string;
  contentSize?: PageFrameSize;
  children: ReactNode;
}

export function SectionShell({
  title,
  sub,
  right,
  rail,
  railLabel = "页面右侧边栏",
  contentSize,
  children,
}: SectionShellProps) {
  return (
    <main className={s.page}>
      <TopBar title={title} sub={sub} right={right} />
      <div className={s.body} data-with-rail={rail ? "true" : undefined}>
        <div className={s.scroll} data-layout={contentSize ? "frame" : undefined}>
          {contentSize ? <PageFrame size={contentSize}>{children}</PageFrame> : children}
        </div>
        {rail ? (
          <aside className={s.rail} aria-label={railLabel}>
            {rail}
          </aside>
        ) : null}
      </div>
    </main>
  );
}
