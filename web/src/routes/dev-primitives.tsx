import { useState } from "react";
import { Dialog, Popover } from "@hermes/shared-ui";

export function DevPrimitivesRoute() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <div
      style={{
        flex: 1,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        overflow: "auto",
        color: "var(--h-text)",
        fontFamily: "var(--h-font-cn)",
      }}
    >
      <header>
        <h1 style={{ margin: 0, fontSize: 18 }}>/dev/primitives</h1>
        <p style={{ margin: "4px 0 0", color: "var(--h-text-2)", fontSize: 12 }}>
          Manual verification surface for shared-ui Dialog / Popover wrappers (dev only).
        </p>
      </header>

      <section style={section}>
        <h2 style={h2}>Dialog</h2>
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button type="button" style={btn}>
              Open dialog
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content
              aria-describedby={undefined}
              onEscapeKeyDown={() => console.log("[dialog] esc")}
              onPointerDownOutside={() => console.log("[dialog] outside click")}
            >
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <Dialog.Title style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                  Dialog 标题
                </Dialog.Title>
                <p style={{ margin: 0, fontSize: 12, color: "var(--h-text-2)" }}>
                  验证项：ESC 关闭 / 点击 overlay 关闭 / focus trap / 中文 IME 输入。
                </p>
                <input
                  type="text"
                  placeholder="试试拼音输入"
                  style={{
                    padding: "6px 10px",
                    border: "1px solid var(--h-line)",
                    borderRadius: "var(--h-r-md)",
                    background: "var(--h-bg-input)",
                    color: "var(--h-text)",
                    fontSize: 12,
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Dialog.Close asChild>
                    <button type="button" style={btn}>
                      关闭
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </section>

      <section style={section}>
        <h2 style={h2}>Popover</h2>
        <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
          <Popover.Trigger asChild>
            <button type="button" style={btn}>
              Open popover
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="bottom" align="start">
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
                <strong style={{ fontSize: 12 }}>Popover 内容</strong>
                <span style={{ fontSize: 11, color: "var(--h-text-2)" }}>
                  验证项：定位 / 边界翻转 / ESC 关闭 / portal 渲染。
                </span>
                <Popover.Arrow width={10} height={5} />
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </section>
    </div>
  );
}

const section: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 16,
  border: "1px solid var(--h-line)",
  borderRadius: "var(--h-r-md)",
  background: "var(--h-bg-pane)",
  maxWidth: 480,
};

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--h-text)",
};

const btn: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid var(--h-line)",
  borderRadius: "var(--h-r-md)",
  background: "var(--h-bg-input)",
  color: "var(--h-text)",
  fontSize: 12,
  cursor: "pointer",
};
