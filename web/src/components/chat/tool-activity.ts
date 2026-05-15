import type { ChatToolItem } from "./chat-types";

export type ToolActivityStatus = ChatToolItem["status"];

export interface ToolActivitySummary {
  status: ToolActivityStatus;
  label: string;
  meta?: string;
  error?: string;
  elapsedMs?: number;
}

const TERMINAL_TOOL_NAMES = new Set(["bash", "command", "shell", "terminal"]);

function normalizeName(name: string): string {
  const trimmed = name.trim();
  return trimmed || "tool";
}

function displayName(name: string): string {
  return normalizeName(name).replace(/[_-]+/g, " ");
}

function isTerminalTool(name: string): boolean {
  return TERMINAL_TOOL_NAMES.has(normalizeName(name).toLowerCase());
}

function terminalCommandLabel(count: number): string {
  return count === 1 ? "terminal command" : "terminal commands";
}

function pluralToolLabel(count: number): string {
  return count === 1 ? "tool" : "tools";
}

function summarizeCounts(tools: readonly ChatToolItem[]): string | undefined {
  const counts = new Map<string, number>();
  tools.forEach((tool) => {
    const name = normalizeName(tool.name);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  const parts = Array.from(counts.entries())
    .sort(([leftName, leftCount], [rightName, rightCount]) => {
      if (leftCount !== rightCount) return rightCount - leftCount;
      return leftName.localeCompare(rightName);
    })
    .slice(0, 3)
    .map(([name, count]) => `${name} x${count}`);

  if (parts.length === 0) return undefined;
  const remaining = counts.size - parts.length;
  return remaining > 0 ? `${parts.join(", ")} +${remaining}` : parts.join(", ");
}

function activityStatus(tools: readonly ChatToolItem[]): ToolActivityStatus {
  if (tools.some((tool) => tool.status === "error")) return "error";
  if (tools.some((tool) => tool.status === "running")) return "running";
  return "done";
}

function activityElapsedMs(
  tools: readonly ChatToolItem[],
  status: ToolActivityStatus,
  now: number,
): number | undefined {
  const startedAt = tools
    .map((tool) => tool.startedAt)
    .filter((value) => Number.isFinite(value));
  if (startedAt.length === 0) return undefined;

  const firstStart = Math.min(...startedAt);
  const lastEnd = Math.max(
    ...tools.map((tool) => {
      if (status === "running" && tool.status === "running") return now;
      return tool.completedAt ?? tool.startedAt;
    }),
  );

  return Math.max(0, lastEnd - firstStart);
}

function activityLabel(
  tools: readonly ChatToolItem[],
  status: ToolActivityStatus,
  errorCount: number,
): string {
  const count = tools.length;
  const terminalOnly = tools.every((tool) => isTerminalTool(tool.name));

  if (terminalOnly) {
    const commandLabel = terminalCommandLabel(count);
    if (status === "running") return `Running ${commandLabel}`;
    if (status === "error") {
      if (count === 1) return "Terminal command failed";
      return `Ran ${count} ${commandLabel}, ${errorCount} failed`;
    }
    return count === 1 ? "Ran terminal command" : `Ran ${count} ${commandLabel}`;
  }

  if (count === 1) {
    const name = displayName(tools[0]?.name ?? "tool");
    if (status === "running") return `Running ${name}`;
    if (status === "error") return `${name} failed`;
    return `Used ${name}`;
  }

  if (status === "running") return `Using ${count} ${pluralToolLabel(count)}`;
  if (status === "error") {
    return `Used ${count} ${pluralToolLabel(count)}, ${errorCount} failed`;
  }
  return `Used ${count} ${pluralToolLabel(count)}`;
}

export function summarizeToolActivity(
  tools: readonly ChatToolItem[],
  now = Date.now(),
): ToolActivitySummary {
  const status = activityStatus(tools);
  const failedTool = tools.find((tool) => tool.status === "error");
  const errorCount = tools.filter((tool) => tool.status === "error").length;
  const terminalOnly = tools.length > 0 && tools.every((tool) => isTerminalTool(tool.name));
  const singleTool = tools.length === 1 ? tools[0] : undefined;

  return {
    status,
    label: activityLabel(tools, status, errorCount),
    meta: singleTool?.context?.trim() || (terminalOnly ? undefined : summarizeCounts(tools)),
    error: failedTool?.error,
    elapsedMs: activityElapsedMs(tools, status, now),
  };
}
