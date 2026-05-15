import type { ReactNode } from "react";
import s from "./pill.module.css";

export type PillTone = "ok" | "warn" | "err" | "neutral";
export type DotTone = "ok" | "warn" | "err" | "live" | "neutral";

interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}

export function Pill({ tone = "neutral", children, className }: PillProps) {
  return (
    <span className={className ? `${s.pill} ${className}` : s.pill} data-tone={tone}>
      {children}
    </span>
  );
}

interface DotProps {
  tone?: DotTone;
  className?: string;
}

export function Dot({ tone = "neutral", className }: DotProps) {
  return <span className={className ? `${s.dot} ${className}` : s.dot} data-tone={tone} />;
}
