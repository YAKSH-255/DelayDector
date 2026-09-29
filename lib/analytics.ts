import type { MilestoneStatus, Project, ProjectStatus, RiskLevel, Severity } from "./types";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ----------------------------- formatting ------------------------------ */

const inr = new Intl.NumberFormat("en-IN");

export const formatNumber = (n: number, dp = 0) =>
  inr.format(Number(n.toFixed(dp)));

/** Crore values, switching to lakh-crore once the number stops being readable. */
export function formatCrore(crore: number, opts: { compact?: boolean } = {}) {
  if (opts.compact && crore >= 100000) return `₹${(crore / 100000).toFixed(2)} lakh Cr`;
  if (crore >= 100000) return `₹${formatNumber(crore)} Cr`;
  return `₹${formatNumber(crore)} Cr`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${d.toLocaleString("en-GB", {
    month: "short",
    timeZone: "UTC",
  }).slice(0, 3)} ${d.getUTCFullYear()}`;
}

export function formatDays(days: number) {
  if (Math.abs(days) < 60) return `${days} day${Math.abs(days) === 1 ? "" : "s"}`;
  const months = days / 30.4375;
  return `${months.toFixed(1)} months`;
}

export const formatPct = (value: number, dp = 0) => `${value.toFixed(dp)}%`;

export const signed = (value: number, dp = 0) =>
  `${value > 0 ? "+" : ""}${value.toFixed(dp)}`;

/* ------------------------------- risk ---------------------------------- */

export const RISK_META: Record<
  RiskLevel,
  { label: string; glyph: string; badge: string; color: string; bg: string }
> = {
  LOW: {
    label: "Low",
    glyph: "●",
    badge: "badge-success",
    color: "var(--risk-low)",
    bg: "var(--risk-low-bg)",
  },
  MEDIUM: {
    label: "Medium",
    glyph: "◆",
    badge: "badge-warning",
    color: "var(--risk-medium)",
    bg: "var(--risk-medium-bg)",
  },
  HIGH: {
    label: "High",
    glyph: "▲",
    badge: "badge-danger",
    color: "var(--risk-high)",
    bg: "var(--risk-high-bg)",
  },
  CRITICAL: {
    label: "Critical",
    glyph: "■",
    badge: "badge-critical",
    color: "var(--risk-critical)",
    bg: "var(--risk-critical-bg)",
  },
};

export const STATUS_META: Record<
  ProjectStatus,
  { badge: string; color: string; glyph: string }
> = {
  "On Track": { badge: "badge-success", color: "var(--risk-low)", glyph: "●" },
  "At Risk": { badge: "badge-warning", color: "var(--risk-medium)", glyph: "◆" },
  Delayed: { badge: "badge-danger", color: "var(--risk-high)", glyph: "▲" },
};

export const SEVERITY_META: Record<Severity, { badge: string; color: string; glyph: string }> = {
  Medium: { badge: "badge-warning", color: "var(--risk-medium)", glyph: "◆" },
  High: { badge: "badge-danger", color: "var(--risk-high)", glyph: "▲" },
  Critical: { badge: "badge-critical", color: "var(--risk-critical)", glyph: "■" },
};

export const MILESTONE_META: Record<MilestoneStatus, { badge: string; color: string }> = {
  Completed: { badge: "badge-success", color: "var(--risk-low)" },
  "In Progress": { badge: "badge-info", color: "var(--info)" },
  Delayed: { badge: "badge-danger", color: "var(--risk-high)" },
  Pending: { badge: "badge-neutral", color: "var(--stone-500)" },
};

export function healthBand(score: number) {
  if (score >= 85) return { label: "Healthy", color: "var(--risk-low)" };
  if (score >= 70) return { label: "Watch", color: "var(--risk-medium)" };
  if (score >= 55) return { label: "Strained", color: "var(--risk-high)" };
  return { label: "Distressed", color: "var(--risk-critical)" };
}

/* ---------------------------- aggregations ----------------------------- */

export function summarise(list: Project[]) {
  const n = list.length || 1;
  return {
    count: list.length,
    onTrack: list.filter((p) => p.status === "On Track").length,
    atRisk: list.filter((p) => p.status === "At Risk").length,
    delayed: list.filter((p) => p.status === "Delayed").length,
    critical: list.filter((p) => p.risk_level === "CRITICAL").length,
    budget: list.reduce((s, p) => s + p.budget_crore, 0),
    revised: list.reduce((s, p) => s + p.revised_cost_crore, 0),
    spent: list.reduce((s, p) => s + p.spent_crore, 0),
    avgHealth: Math.round(list.reduce((s, p) => s + p.health_score, 0) / n),
    avgDelay: Math.round(list.reduce((s, p) => s + p.delay_days, 0) / n),
    avgGap: Number((list.reduce((s, p) => s + p.progress_gap, 0) / n).toFixed(1)),
    predictedDelay: Math.round(
      list.reduce((s, p) => s + p.ai_prediction.predicted_delay_days, 0) / n,
    ),
    exposure: list
      .filter((p) => p.status !== "On Track")
      .reduce((s, p) => s + p.revised_cost_crore, 0),
  };
}

/** Portfolio-wide planned vs actual, weighted by sanctioned cost. */
export function weightedProgressSeries(list: Project[]) {
  const totalBudget = list.reduce((s, p) => s + p.budget_crore, 0) || 1;
  const periods = list[0]?.progress_history ?? [];
  return periods.map((_, i) => {
    let planned = 0;
    let actual = 0;
    for (const p of list) {
      const point = p.progress_history[i];
      if (!point) continue;
      planned += point.planned * p.budget_crore;
      actual += point.actual * p.budget_crore;
    }
    const plannedPct = Number((planned / totalBudget).toFixed(1));
    const actualPct = Number((actual / totalBudget).toFixed(1));
    return {
      period: periods[i].period,
      planned: plannedPct,
      actual: actualPct,
      gap: Number((plannedPct - actualPct).toFixed(1)),
      band: [actualPct, plannedPct] as [number, number],
    };
  });
}

/** Attributed delay days per MoSPI reason code, across a set of projects. */
export function driverRollup(list: Project[]) {
  const map = new Map<
    string,
    { name: string; days: number; projects: number; mospi_code: string; in_cuf: boolean }
  >();
  for (const p of list) {
    for (const reason of p.delay_reasons) {
      const factor = p.risk_factors.find((f) => f.name === reason.reason);
      const entry = map.get(reason.reason) ?? {
        name: reason.reason,
        days: 0,
        projects: 0,
        mospi_code: factor?.mospi_code ?? "UNC",
        in_cuf: factor?.in_cuf ?? false,
      };
      entry.days += reason.days;
      entry.projects += 1;
      map.set(reason.reason, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.days - a.days);
}

export function stateRollup(list: Project[]) {
  const map = new Map<string, { state: string; count: number; delayed: number; budget: number }>();
  for (const p of list) {
    const entry = map.get(p.state) ?? { state: p.state, count: 0, delayed: 0, budget: 0 };
    entry.count += 1;
    if (p.status !== "On Track") entry.delayed += 1;
    entry.budget += p.budget_crore;
    map.set(p.state, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Schedule Performance Index — a familiar earned-value style indicator. */
export const spi = (p: Project) =>
  Number((p.actual_progress / Math.max(p.planned_progress, 1)).toFixed(2));

/** Cost Performance Index: work done per rupee spent. */
export const cpi = (p: Project) =>
  Number(
    (
      (p.actual_progress / 100) /
      Math.max(p.spent_crore / p.budget_crore, 0.01)
    ).toFixed(2),
  );
