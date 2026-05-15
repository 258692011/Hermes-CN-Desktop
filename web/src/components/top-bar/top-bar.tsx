import { type ButtonHTMLAttributes, type ReactNode } from "react";
import s from "./top-bar.module.css";

interface TopBarProps {
  title?: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}

type TopBarActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function TopBar({ title, sub, right }: TopBarProps) {
  return (
    <div className={s.topBar} data-window-drag>
      {title && <span className={s.title}>{title}</span>}
      {sub && <span className={s.sub}>{sub}</span>}
      <span className={s.spacer} />
      {right && <div className={s.actions}>{right}</div>}
    </div>
  );
}

export function TopBarActionButton({
  className,
  type = "button",
  ...props
}: TopBarActionButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={className ? `${s.chip} ${className}` : s.chip}
    />
  );
}

export function TopBarActions() {
  return (
    <>
      <TopBarActionButton>⌘ K · 切换</TopBarActionButton>
      <TopBarActionButton>
        <span className={s.accentDot} />
        <span>提交</span>
        <span>▾</span>
      </TopBarActionButton>
    </>
  );
}
