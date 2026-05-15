import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import s from "./composer.module.css";

interface ComposerProps {
  onSend?: (text: string) => void;
  placeholder?: string;
  initial?: string;
  autoFocus?: boolean;
  showMeta?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function Composer({
  onSend,
  placeholder = "要求后续变更",
  initial = "",
  autoFocus = false,
  showMeta = true,
  disabled = false,
  loading = false,
}: ComposerProps) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  const send = () => {
    if (!val.trim() || disabled || loading) return;
    onSend?.(val);
    setVal("");
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  };

  const ready = val.trim().length > 0 && !disabled && !loading;

  return (
    <div className={s.wrapper}>
      <div className={s.box} data-disabled={disabled || loading}>
        <textarea
          ref={ref}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={onKey}
          placeholder={loading ? "Agent 响应中…" : placeholder}
          rows={1}
          className={s.textarea}
          disabled={disabled || loading}
        />
        <div className={s.controls}>
          <button className={s.plusBtn} disabled={disabled}>＋</button>
          <span className={s.permBadge}>⚠ 完全访问权限 ▾</span>
          <span className={s.spacer} />
          {loading && <span className={s.streamingDot} />}
          <button
            className={s.sendBtn}
            data-ready={ready}
            onClick={send}
            disabled={!ready}
          >
            {loading ? "■" : "↑"}
          </button>
        </div>
      </div>
      {showMeta && (
        <div className={s.meta}>
          <span>⌐ 本地模式 ▾</span>
          <span>⎇ master ▾</span>
        </div>
      )}
    </div>
  );
}
