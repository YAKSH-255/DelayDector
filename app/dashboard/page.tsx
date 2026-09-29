"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeIndianRupee,
  CalendarClock,
  CircleCheck,
  HeartPulse,
  Layers,
  TriangleAlert,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useScope } from "@/components/RoleProvider";
import {
  DepartmentBars,
  PortfolioProgressChart,
  RiskDonut,
  Sparkline,
} from "@/components/charts";
import { HealthRing, Kpi, Meter, Panel, RiskBadge, SeverityBadge, StatusBadge } from "@/components/ui";
import { alerts as allAlerts, departments, meta } from "@/lib/data";
import {
  RISK_META,
  cn,
  formatCrore,
  formatDate,
  formatPct,
  summarise,
  weightedProgressSeries,
} from "@/lib/analytics";
import type { RiskLevel } from "@/lib/types";

export default function DashboardPage() {
  const { projects, portfolio, coverageNote, definition, role } = useScope();
  const detail = summarise(projects);
  const series = weightedProgressSeries(projects);
  const heroes = projects.filter((p) => p.hero);
  // Heroes first, then whatever else carries the most exposure, always up to three.
  const spotlight = [
    ...heroes,
    ...projects.filter((p) => !p.hero).sort((a, b) => a.health_score - b.health_score),
  ].slice(0, 3);

  const scopedAlerts = allAlerts.filter((a) =>
    projects.some((p) => p.project_id === a.project_id),
  );
  const topAlerts = scopedAlerts.slice(0, 5);

  const visibleDepartments = departments.filter((d) =>
    projects.some((p) => p.department === d.name),
  );

  const riskDistribution: Record<RiskLevel, number> =
    role === "mospi"
      ? meta.portfolio.risk_distribution
      : (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).reduce(
          (acc, level) => {
            acc[level] = projects.filter((p) => p.risk_level === level).length;
            return acc;
          },
          {} as Record<RiskLevel, number>,
        );

  const variance = series[series.length - 1]?.gap ?? 0;
  const varianceTrend = series.map((s) => s.gap);

  return (
    <AppShell
      title="Executive Dashboard"
      subtitle={`${definition.title} · ${portfolio.total_projects} projects · ${meta.reporting_period} reporting cycle`}
      actions={
        <Link href="/ai-assistant" className="btn btn-primary btn-sm">
          Ask the assistant
        </Link>
      }
    >
      {/* KPI strip ------------------------------------------------------ */}
      <div className="kpi-grid fade-up">
        <Kpi
          label="Total projects"
          value={portfolio.total_projects}
          icon={<Layers size={13} strokeWidth={2.2} />}
          foot={<span>{portfolio.monitored_in_detail} with full monitoring records</span>}
        />
        <Kpi
          label="On track"
          value={portfolio.on_track}
          tone="good"
          icon={<CircleCheck size={13} strokeWidth={2.2} />}
          foot={
            <span>
              {formatPct((portfolio.on_track / portfolio.total_projects) * 100)} of portfolio
            </span>
          }
        />
        <Kpi
          label="At risk"
          value={portfolio.at_risk}
          tone="warn"
          icon={<TriangleAlert size={13} strokeWidth={2.2} />}
          foot={
            <span>
              {portfolio.at_risk > 0 ? "Variance widening month on month" : "None flagged this cycle"}
            </span>
          }
        />
        <Kpi
          label="Delayed"
          value={portfolio.delayed}
          tone="bad"
          icon={<CalendarClock size={13} strokeWidth={2.2} />}
          foot={<span>Past sanctioned completion date</span>}
        />
        <Kpi
          label="Anticipated cost"
          value={formatCrore(portfolio.revised_cost_crore, { compact: true })}
          icon={<BadgeIndianRupee size={13} strokeWidth={2.2} />}
          foot={
            <span>
              Sanctioned {formatCrore(portfolio.sanctioned_cost_crore, { compact: true })}
            </span>
          }
        />
        <Kpi
          label="Cost variance"
          value={`+${portfolio.cost_overrun_pct}%`}
          tone="warn"
          icon={<BadgeIndianRupee size={13} strokeWidth={2.2} />}
          foot={<span>{formatCrore(portfolio.cost_overrun_crore)} over sanction</span>}
        />
        <Kpi
          label="Avg health score"
          value={portfolio.avg_health_score}
          unit="/100"
          icon={<HeartPulse size={13} strokeWidth={2.2} />}
          foot={<span>Avg overrun {portfolio.avg_time_overrun_days} days</span>}
        />
        <Kpi
          label="Open early warnings"
          value={scopedAlerts.length}
          tone="bad"
          icon={<AlertTriangle size={13} strokeWidth={2.2} />}
          foot={
            <span>
              {scopedAlerts.filter((a) => a.severity === "Critical").length} critical · awaiting
              action
            </span>
          }
        />
      </div>

      {/* Progress + risk ------------------------------------------------ */}
      <div className="grid-wide">
        <Panel
          title="Planned vs actual progress"
          subtitle={`Cost-weighted across ${projects.length} monitored projects · last 12 reporting months`}
          actions={
            <span className="badge badge-danger">
              <span className="badge-glyph" aria-hidden>
                ▲
              </span>
              {variance.toFixed(1)} pt variance
            </span>
          }
        >
          <PortfolioProgressChart data={series} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 8,
              fontSize: 11,
              color: "var(--stone-500)",
            }}
          >
            <Sparkline data={varianceTrend} color="var(--risk-high)" width={110} height={24} />
            <span>
              Variance has moved from {varianceTrend[0].toFixed(1)} to {variance.toFixed(1)} points
              over the period — the gap is widening, not closing.
            </span>
          </div>
        </Panel>

        <Panel title="Risk distribution" subtitle={coverageNote}>
          <RiskDonut distribution={riskDistribution} />
          <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
            {(Object.keys(riskDistribution) as RiskLevel[]).map((level) => (
              <div
                key={level}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}
              >
                <span style={{ color: RISK_META[level].color, fontSize: 9 }} aria-hidden>
                  {RISK_META[level].glyph}
                </span>
                <span style={{ flex: 1 }}>{RISK_META[level].label} risk</span>
                <span className="num" style={{ fontWeight: 600 }}>
                  {riskDistribution[level]}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Spotlight ------------------------------------------------------ */}
      <div>
        <div
          className="section-label"
          style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}
        >
          Projects in focus
          <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
            {role === "mospi"
              ? "— the three records walked through in this demo"
              : "— highest exposure in your scope"}
          </span>
        </div>
        <div className="grid-cards">
          {spotlight.map((p) => (
            <Link key={p.project_id} href={`/projects/${p.project_id}`} className="panel glass panel-pad">
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 7, flexWrap: "wrap" }}>
                    <StatusBadge status={p.status} />
                    <RiskBadge level={p.risk_level} small />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.35 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--stone-500)", marginTop: 2 }}>
                    {p.department} · {p.district}, {p.state}
                  </div>
                </div>
                <HealthRing score={p.health_score} size={68} />
              </div>

              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    marginBottom: 5,
                  }}
                >
                  <span className="muted">
                    Actual <b style={{ color: "var(--ink-900)" }}>{p.actual_progress}%</b> vs planned{" "}
                    {p.planned_progress}%
                  </span>
                  <span style={{ color: "var(--risk-high)", fontWeight: 600 }}>
                    {p.delay_days} d behind
                  </span>
                </div>
                <Meter value={p.actual_progress} target={p.planned_progress} />
              </div>

              <div
                style={{
                  marginTop: 11,
                  paddingTop: 10,
                  borderTop: "1px solid var(--sand-200)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 11.5,
                }}
              >
                <span className="muted">
                  Prototype forecast{" "}
                  <b style={{ color: "var(--ink-900)" }}>
                    {p.ai_prediction.predicted_delay_days} days
                  </b>
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    color: "var(--orange-700)",
                    fontWeight: 600,
                  }}
                >
                  Open <ArrowRight size={12} strokeWidth={2.4} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Alerts + departments ------------------------------------------ */}
      <div className="grid-main">
        <Panel
          title="Critical alerts"
          subtitle="Generated from this month's reported progress"
          actions={
            <Link href="/alerts" className="btn btn-glass btn-sm">
              All alerts
            </Link>
          }
        >
          <div style={{ display: "grid", gap: 8 }}>
            {topAlerts.map((a) => (
              <Link
                key={a.alert_id}
                href={`/projects/${a.project_id}`}
                className="glass-soft"
                style={{ padding: "11px 13px", display: "block" }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.2}
                    style={{
                      marginTop: 2,
                      flex: "none",
                      color:
                        a.severity === "Critical"
                          ? "var(--risk-critical)"
                          : a.severity === "High"
                            ? "var(--risk-high)"
                            : "var(--risk-medium)",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 12.5 }}>{a.title}</span>
                      <SeverityBadge severity={a.severity} />
                    </div>
                    <p style={{ fontSize: 11.5, color: "var(--ink-700)", marginTop: 3 }}>{a.detail}</p>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: "var(--stone-500)",
                        marginTop: 5,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>Raised {formatDate(a.raised_on)}</span>
                      <span>·</span>
                      <span>Recommended: {a.recommended_action}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel
          title="Department summary"
          subtitle={`${visibleDepartments.length} ${visibleDepartments.length === 1 ? "ministry" : "ministries"} in scope`}
        >
          <DepartmentBars
            data={visibleDepartments.map((d) => ({
              name: d.short,
              onTrack: d.on_track,
              atRisk: d.at_risk,
              delayed: d.delayed,
            }))}
            height={190}
          />
          <div className="table-wrap" style={{ marginTop: 6 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Department</th>
                  <th style={{ textAlign: "right" }}>Health</th>
                  <th style={{ textAlign: "right" }}>Overrun</th>
                </tr>
              </thead>
              <tbody>
                {visibleDepartments.map((d) => {
                  const pct =
                    ((d.revised_cost_crore - d.sanctioned_cost_crore) / d.sanctioned_cost_crore) *
                    100;
                  return (
                    <tr key={d.id} style={{ cursor: "default" }}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{d.short}</div>
                        <div style={{ fontSize: 10.5, color: "var(--stone-500)" }}>
                          {d.total_projects} projects ·{" "}
                          {formatCrore(d.sanctioned_cost_crore, { compact: true })}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          className="num"
                          style={{
                            fontWeight: 600,
                            color:
                              d.avg_health_score >= 80
                                ? "var(--risk-low)"
                                : d.avg_health_score >= 68
                                  ? "var(--risk-medium)"
                                  : "var(--risk-high)",
                          }}
                        >
                          {d.avg_health_score}
                        </span>
                      </td>
                      <td className="num" style={{ textAlign: "right" }}>
                        +{pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Quick nav ------------------------------------------------------ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px,1fr))", gap: 12 }}>
        {[
          { href: "/projects", title: "Project monitoring", body: `Search and filter ${projects.length} monitored records` },
          { href: "/map", title: "Geographic view", body: `Risk-coded markers across ${new Set(projects.map((p) => p.state)).size} states` },
          { href: "/alerts", title: "Early warning centre", body: "Risk scoring, drivers and model transparency" },
          { href: "/ai-assistant", title: "AI project assistant", body: "Ask analytical questions of the dataset" },
        ].map((card) => (
          <Link key={card.href} href={card.href} className={cn("panel", "glass-soft", "panel-pad")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{card.title}</span>
              <ArrowRight size={14} strokeWidth={2.4} style={{ color: "var(--orange-600)" }} />
            </div>
            <p style={{ fontSize: 11.5, color: "var(--stone-500)", marginTop: 4 }}>{card.body}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
