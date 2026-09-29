"use client";

import {
  MILESTONE_META,
  RISK_META,
  SEVERITY_META,
  STATUS_META,
  cn,
  healthBand,
} from "@/lib/analytics";
import type { MilestoneStatus, ProjectStatus, RiskLevel, Severity } from "@/lib/types";

/* ------------------------------- Panel --------------------------------- */

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  elevation = "glass",
  bodyClassName,
  style,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  elevation?: "glass" | "glass-soft" | "glass-strong";
  bodyClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={cn("panel", elevation, "panel-pad", className)} style={style}>
      {(title || actions) && (
        <div className="panel-head">
          <div style={{ minWidth: 0 }}>
            {title && <div className="panel-title">{title}</div>}
            {subtitle && <div className="panel-sub">{subtitle}</div>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8, flex: "none" }}>{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/* ------------------------------- Badges -------------------------------- */

export function RiskBadge({ level, small }: { level: RiskLevel; small?: boolean }) {
  const m = RISK_META[level];
  return (
    <span className={cn("badge", m.badge)} style={small ? { fontSize: 10.5, padding: "3px 8px" } : undefined}>
      <span className="badge-glyph" aria-hidden>
        {m.glyph}
      </span>
      {m.label} risk
    </span>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("badge", m.badge)}>
      <span className="badge-glyph" aria-hidden>
        {m.glyph}
      </span>
      {status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const m = SEVERITY_META[severity];
  return (
    <span className={cn("badge", m.badge)}>
      <span className="badge-glyph" aria-hidden>
        {m.glyph}
      </span>
      {severity}
    </span>
  );
}

export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  return <span className={cn("badge", MILESTONE_META[status].badge)}>{status}</span>;
}

/* -------------------------------- Meter -------------------------------- */

export function Meter({
  value,
  target,
  color,
  height = 7,
}: {
  value: number;
  target?: number;
  color?: string;
  height?: number;
}) {
  return (
    <div
      className="meter"
      style={{ height }}
      role="img"
      aria-label={`${value}% complete${target !== undefined ? ` against ${target}% planned` : ""}`}
    >
      <div
        className="meter-fill"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color ?? "linear-gradient(90deg, var(--orange-400), var(--orange-600))",
        }}
      />
      {target !== undefined && (
        <div className="meter-marker" style={{ left: `calc(${Math.min(100, target)}% - 1px)` }} />
      )}
    </div>
  );
}

/* --------------------------------- KPI --------------------------------- */

export function Kpi({
  label,
  value,
  unit,
  foot,
  accent,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  unit?: string;
  foot?: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneColor =
    tone === "good"
      ? "var(--risk-low)"
      : tone === "warn"
        ? "var(--risk-medium)"
        : tone === "bad"
          ? "var(--risk-high)"
          : undefined;
  return (
    <div className="kpi glass">
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: 3,
          background: accent ?? toneColor ?? "var(--orange-400)",
          opacity: 0.85,
        }}
      />
      <div className="kpi-label">
        {icon}
        {label}
      </div>
      <div className="kpi-value" style={{ color: toneColor }}>
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  );
}

/* ----------------------------- Health ring ----------------------------- */

export function HealthRing({ score, size = 96 }: { score: number; size?: number }) {
  const band = healthBand(score);
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sand-200)" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={band.color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: size / 3.4,
            fontWeight: 600,
            lineHeight: 1,
            color: band.color,
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: 9.5, color: "var(--stone-500)", marginTop: 2 }}>{band.label}</span>
      </div>
    </div>
  );
}

/* ------------------------------ Data rows ------------------------------ */

export function StatRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        padding: "7px 0",
        borderBottom: "1px solid var(--sand-200)",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--stone-500)" }}>
        {label}
        {hint && (
          <span style={{ display: "block", fontSize: 10.5, opacity: 0.8 }}>{hint}</span>
        )}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function PrototypeNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10.5,
        color: "var(--stone-500)",
        marginTop: 10,
        lineHeight: 1.45,
        fontStyle: "italic",
      }}
    >
      {children}
    </p>
  );
}
