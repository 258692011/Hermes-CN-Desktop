export interface ContextUsageLike {
  used?: number;
  max?: number;
  percent?: number;
}

export type ContextRisk = "unknown" | "ok" | "warning" | "danger";

export const CONTEXT_WARNING_PERCENT = 85;
export const CONTEXT_DANGER_PERCENT = 100;

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function contextUsagePercent(usage: ContextUsageLike | null | undefined): number | undefined {
  if (!usage) return undefined;

  const explicit = finiteNumber(usage.percent);
  if (explicit !== undefined) {
    return Math.max(0, explicit);
  }

  const used = finiteNumber(usage.used);
  const max = finiteNumber(usage.max);
  if (used === undefined || max === undefined || max <= 0) return undefined;
  return Math.max(0, (used / max) * 100);
}

export function contextUsageRisk(usage: ContextUsageLike | null | undefined): ContextRisk {
  const percent = contextUsagePercent(usage);
  if (percent === undefined) return "unknown";
  if (percent >= CONTEXT_DANGER_PERCENT) return "danger";
  if (percent >= CONTEXT_WARNING_PERCENT) return "warning";
  return "ok";
}
