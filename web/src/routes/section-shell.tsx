import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar/top-bar";
import s from "./section-shell.module.css";

interface SectionShellProps {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}

export function SectionShell({ title, sub, right, children }: SectionShellProps) {
  return (
    <main className={s.page}>
      <TopBar title={title} sub={sub} right={right} />
      <div className={s.scroll}>{children}</div>
    </main>
  );
}
