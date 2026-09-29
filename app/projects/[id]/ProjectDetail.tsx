"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, HardHat, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RiskInsight } from "@/components/RiskInsight";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
import { BudgetChart, DriverBars, ProgressChart } from "@/components/charts";
import {
  HealthRing,
  Meter,
  MilestoneBadge,
  Panel,
  PrototypeNote,
  RiskBadge,
  StatRow,
  StatusBadge,
} from "@/components/ui";
import { getProject } from "@/lib/data";
import { MILESTONE_META, cpi, formatCrore, formatDate, spi } from "@/lib/analytics";
import type { Milestone } from "@/lib/types";

export default function ProjectDetail({ id }: { id: string }) {
  const project = getProject(id);

  if (!project) {
    return (
      <AppShell title="Project not found" subtitle="This project ID is not in the demo dataset">
        <Panel>
          <p style={{ fontSize: 13 }}>
            No monitored project matches <b>{id}</b>.
          </p>
          <Link href="/projects" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
            Back to projects
          </Link>
        </Panel>
      </AppShell>
    );
  }

  const spentPct = (project.spent_crore / project.budget_crore) * 100;

  return (
    <AppShell
      title={project.name}
      subtitle={`${project.project_id} · ${project.department} · ${project.district}, ${project.state}`}
      actions={
        <Link href="/projects" className="btn btn-glass btn-sm">
          <ArrowLeft size={13} strokeWidth={2.2} /> All projects
        </Link>
      }
    >
      {/* Overview ------------------------------------------------------- */}
      <Panel elevation="glass">
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 340px", minWidth: 0 }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
              <StatusBadge status={project.status} />
              <RiskBadge level={project.risk_level} />
              {project.hero && <span className="badge badge-orange">Demo focus project</span>}
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.6 }}>{project.scope}</p>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginTop: 12,
                fontSize: 11.5,
                color: "var(--stone-500)",
              }}
            >
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <Building2 size={13} strokeWidth={2} /> {project.implementing_agency}
              </span>
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <HardHat size={13} strokeWidth={2} /> {project.contractor}
              </span>
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <MapPin size={13} strokeWidth={2} /> {project.district}, {project.state}
              </span>
              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <CalendarDays size={13} strokeWidth={2} /> Started {formatDate(project.start_date)}
              </span>
            </div>

            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  marginBottom: 5,
                }}
              >
                <span className="muted">
                  Physical progress{" "}
                  <b style={{ color: "var(--ink-900)" }}>{project.actual_progress}%</b> against{" "}
                  {project.planned_progress}% planned
                </span>
                <span style={{ color: "var(--risk-high)", fontWeight: 600 }}>
                  −{project.progress_gap} points
                </span>
              </div>
              <Meter value={project.actual_progress} target={project.planned_progress} height={9} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <HealthRing score={project.health_score} size={104} />
            <div style={{ minWidth: 190 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>
                Health composition
              </div>
              {(
                [
                  ["Schedule", project.health_composition.schedule, 0.4],
                  ["Cost", project.health_composition.cost, 0.25],
                  ["Risk exposure", project.health_composition.risk, 0.2],
                  ["Governance", project.health_composition.governance, 0.15],
                ] as const
              ).map(([label, value, weight]) => (
                <div key={label} style={{ marginBottom: 7 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      marginBottom: 3,
                    }}
                  >
                    <span className="muted">
                      {label}{" "}
                      <span style={{ fontSize: 9.5 }}>({Math.round(weight * 100)}%)</span>
                    </span>
                    <b className="num">{Math.round(value)}</b>
                  </div>
                  <Meter
                    value={value}
                    height={5}
                    color={
                      value >= 80
                        ? "var(--risk-low)"
                        : value >= 55
                          ? "var(--risk-medium)"
                          : "var(--risk-high)"
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* Progress + AI -------------------------------------------------- */}
      <div className="grid-main">
        <div className="stack">
          <Panel
            title="Planned vs actual progress"
            subtitle="12 reported months and a 6-month prototype forecast with confidence range"
          >
            <ProgressChart project={project} height={260} />
          </Panel>

          <Panel
            title="Financial progress"
            subtitle="Funds drawn against physical progress — divergence signals cost risk"
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Figure label="Sanctioned cost" value={formatCrore(project.budget_crore)} />
              <Figure
                label="Anticipated cost"
                value={formatCrore(project.revised_cost_crore)}
                hint={`+${project.cost_overrun_pct}% revision`}
                tone="warn"
              />
              <Figure
                label="Expenditure"
                value={formatCrore(project.spent_crore)}
                hint={`${spentPct.toFixed(0)}% of sanction`}
              />
              <Figure
                label="Cost performance"
                value={cpi(project).toFixed(2)}
                hint={cpi(project) < 1 ? "below par" : "on par"}
                tone={cpi(project) < 0.9 ? "bad" : cpi(project) < 1 ? "warn" : "good"}
              />
            </div>
            <BudgetChart project={project} height={190} />
            <PrototypeNote>
              {spentPct.toFixed(0)}% of sanctioned funds drawn against {project.actual_progress}%
              physical progress — a {(spentPct - project.actual_progress).toFixed(0)} point gap.
            </PrototypeNote>
          </Panel>
        </div>

        <div className="stack">
          <RiskInsight project={project} />

          <Panel title="Delay attribution" subtitle={`${project.delay_days} reported days apportioned across drivers`}>
            <DriverBars
              data={project.delay_reasons.map((d, i) => ({
                name: d.reason,
                value: d.days,
                color: i === 0 ? "var(--risk-high)" : "var(--orange-300)",
              }))}
              height={Math.max(150, project.delay_reasons.length * 42)}
            />
            <div style={{ marginTop: 6 }}>
              {project.risk_factors.map((f) => (
                <StatRow
                  key={f.name}
                  label={f.name}
                  hint={f.mospi_code === "UNC" ? "Not captured in the Common Upload Form" : f.mospi_reason}
                  value={
                    <span className="num">
                      {f.impact}%{" "}
                      <span style={{ fontWeight: 400, color: "var(--stone-500)", fontSize: 11 }}>
                        {f.category}
                      </span>
                    </span>
                  }
                />
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* What-if -------------------------------------------------------- */}
      <WhatIfSimulator project={project} />

      {/* Milestones + schedule ------------------------------------------ */}
      <div className="grid-main">
        <Panel title="Milestone timeline" subtitle="Planned against reported completion for each stage">
          <div style={{ display: "grid", gap: 2 }}>
            {project.milestones.map((m, i) => (
              <MilestoneRow
                key={m.name}
                milestone={m}
                last={i === project.milestones.length - 1}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Schedule summary">
          <StatRow label="Start date" value={formatDate(project.start_date)} />
          <StatRow label="Sanctioned completion" value={formatDate(project.planned_completion)} />
          <StatRow
            label="Department forecast"
            value={formatDate(project.reported_completion)}
            hint={`${project.delay_days} days slippage reported`}
          />
          <StatRow
            label="Prototype AI forecast"
            value={
              <span style={{ color: "var(--risk-high)" }}>
                {formatDate(project.ai_prediction.forecast_completion)}
              </span>
            }
            hint={`${project.ai_prediction.predicted_delay_days} days total delay`}
          />
          <StatRow label="Schedule performance index" value={spi(project).toFixed(2)} />
          <StatRow
            label="Recent progress rate"
            value={`${project.monthly_progress_rate}% / month`}
            hint={`Plan requires ${project.planned_monthly_rate}% / month`}
          />
          <StatRow label="Last reported" value={formatDate(project.last_updated)} />
          <PrototypeNote>
            A schedule performance index below 1.00 means physical progress is trailing the
            sanctioned plan at this reporting date.
          </PrototypeNote>
        </Panel>
      </div>
    </AppShell>
  );
}

function MilestoneRow({ milestone: m, last }: { milestone: Milestone; last: boolean }) {
  const meta = MILESTONE_META[m.status];
  const slip =
    m.actual_date !== null
      ? Math.round(
          (new Date(m.actual_date).getTime() - new Date(m.planned_date).getTime()) / 86_400_000,
        )
      : Math.round(
          (new Date(m.forecast_date).getTime() - new Date(m.planned_date).getTime()) / 86_400_000,
        );

  return (
    <div style={{ display: "flex", gap: 13, alignItems: "stretch" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: m.status === "Pending" ? "var(--sand-300)" : meta.color,
            marginTop: 13,
            flex: "none",
            border: "2px solid var(--paper)",
            boxShadow: `0 0 0 2px ${m.status === "Pending" ? "var(--sand-200)" : meta.color}33`,
          }}
        />
        {!last && <span style={{ flex: 1, width: 2, background: "var(--sand-200)" }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: last ? 4 : 14, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 12.5 }}>{m.name}</span>
          <MilestoneBadge status={m.status} />
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 11,
            color: "var(--stone-500)",
            marginTop: 3,
          }}
        >
          <span>Planned {formatDate(m.planned_date)}</span>
          <span>
            {m.actual_date ? `Completed ${formatDate(m.actual_date)}` : `Forecast ${formatDate(m.forecast_date)}`}
          </span>
          {slip > 0 && (
            <span style={{ color: "var(--risk-high)", fontWeight: 600 }}>+{slip} days</span>
          )}
          <span>· {m.weight}% cumulative weight</span>
        </div>
        {m.status === "In Progress" || m.status === "Delayed" ? (
          <div style={{ marginTop: 6, maxWidth: 260 }}>
            <Meter value={m.progress} height={5} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Figure({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "warn" | "bad";
}) {
  const color =
    tone === "good"
      ? "var(--risk-low)"
      : tone === "warn"
        ? "var(--risk-medium)"
        : tone === "bad"
          ? "var(--risk-high)"
          : undefined;
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--stone-500)" }}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 600,
          marginTop: 3,
          color,
        }}
      >
        {value}
      </div>
      {hint && <div style={{ fontSize: 10.5, color: "var(--stone-500)" }}>{hint}</div>}
    </div>
  );
}
