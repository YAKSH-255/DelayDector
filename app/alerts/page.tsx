"use client";

import { useState } from "react";
import { AlertTriangle, Database, FlaskConical } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useScope } from "@/components/RoleProvider";
import { RiskInsight } from "@/components/RiskInsight";
import { DriverBars } from "@/components/charts";
import { Kpi, Panel, PrototypeNote, SeverityBadge } from "@/components/ui";
import { alerts as allAlerts, getProject, meta } from "@/lib/data";
import { cn, driverRollup, formatCrore, formatDate } from "@/lib/analytics";
import type { Severity } from "@/lib/types";

export default function AlertsPage() {
  const { projects } = useScope();
  const scoped = allAlerts.filter((a) => projects.some((p) => p.project_id === a.project_id));

  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [selectedId, setSelectedId] = useState(scoped[0]?.project_id ?? "");

  const visible = scoped.filter((a) => severity === "all" || a.severity === severity);
  const selected = getProject(selectedId) ?? getProject(scoped[0]?.project_id ?? "");

  const drivers = driverRollup(projects).slice(0, 7);
  const uncaptured = drivers.filter((d) => !d.in_cuf);
  const exposure = scoped.reduce((s, a) => {
    const p = projects.find((x) => x.project_id === a.project_id);
    return s + (p?.revised_cost_crore ?? 0);
  }, 0);

  return (
    <AppShell
      title="Early Warning Centre"
      subtitle="Risk scoring, delay attribution and model transparency for the current reporting cycle"
    >
      <div className="kpi-grid">
        <Kpi
          label="Open early warnings"
          value={scoped.length}
          tone="bad"
          icon={<AlertTriangle size={13} strokeWidth={2.2} />}
          foot={<span>{scoped.filter((a) => a.severity === "Critical").length} critical</span>}
        />
        <Kpi
          label="Cost under warning"
          value={formatCrore(exposure, { compact: true })}
          tone="warn"
          foot={<span>Anticipated cost of flagged projects</span>}
        />
        <Kpi
          label="Avg forecast delay"
          value={Math.round(scoped.reduce((s, a) => s + a.predicted_delay_days, 0) / (scoped.length || 1))}
          unit="days"
          foot={<span>Across flagged projects</span>}
        />
        <Kpi
          label="Drivers outside the upload form"
          value={uncaptured.length}
          icon={<Database size={13} strokeWidth={2.2} />}
          foot={<span>Signals the CUF does not yet collect</span>}
        />
      </div>

      <div className="grid-main">
        <Panel
          title="Alert feed"
          subtitle={`${visible.length} alerts generated from this month's reported progress`}
          actions={
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "Critical", "High", "Medium"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cn("chip", severity === s && "selected")}
                  style={{ fontSize: 11, padding: "4px 10px" }}
                  onClick={() => setSeverity(s)}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          }
        >
          <div className="scroll-area" style={{ display: "grid", gap: 8, maxHeight: 560 }}>
            {visible.map((a) => {
              const active = a.project_id === selectedId;
              return (
                <button
                  key={a.alert_id}
                  type="button"
                  onClick={() => setSelectedId(a.project_id)}
                  className={active ? "glass-strong" : "glass-soft"}
                  style={{
                    padding: "11px 13px",
                    textAlign: "left",
                    cursor: "pointer",
                    border: active ? "1px solid var(--orange-300)" : "1px solid transparent",
                    borderLeft: `3px solid ${
                      a.severity === "Critical"
                        ? "var(--risk-critical)"
                        : a.severity === "High"
                          ? "var(--risk-high)"
                          : "var(--risk-medium)"
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>{a.title}</span>
                    <SeverityBadge severity={a.severity} />
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--ink-700)", marginTop: 4, lineHeight: 1.5 }}>
                    {a.detail}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 6,
                      fontSize: 10.5,
                      color: "var(--stone-500)",
                    }}
                  >
                    <span className="mono">{a.alert_id}</span>
                    <span>·</span>
                    <span>{a.department}</span>
                    <span>·</span>
                    <span>Raised {formatDate(a.raised_on)} ({a.age_days} d open)</span>
                    <span>·</span>
                    <span>Forecast {a.predicted_delay_days} d</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="stack">
          {selected && (
            <>
              <div>
                <div className="section-label" style={{ marginBottom: 7 }}>
                  Selected · {selected.name}
                </div>
                <RiskInsight project={selected} compact />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid-2">
        <Panel
          title="Delay drivers across the portfolio"
          subtitle="Attributed delay days aggregated from every monitored project"
        >
          <DriverBars
            data={drivers.map((d) => ({
              name: d.name,
              value: d.days,
              color: d.in_cuf ? "var(--orange-500)" : "var(--stone-500)",
            }))}
            height={240}
          />
          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 8,
              fontSize: 11,
              color: "var(--stone-500)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, background: "var(--orange-500)", borderRadius: 3 }} />
              Derived from Common Upload Form fields
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, background: "var(--stone-500)", borderRadius: 3 }} />
              Requires data not currently collected
            </span>
          </div>
          <PrototypeNote>
            Driver labels follow MoSPI&rsquo;s published reason-for-delay taxonomy so attribution can
            be reconciled against existing reporting.
          </PrototypeNote>
        </Panel>

        <Panel
          title="Data the model would need next"
          subtitle="What is not captured today, and what collecting it would be worth"
        >
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Where it could come from</th>
                  <th style={{ textAlign: "right" }}>Modelled gain</th>
                </tr>
              </thead>
              <tbody>
                {meta.data_gaps.map((gap) => (
                  <tr key={gap.variable} style={{ cursor: "default" }}>
                    <td style={{ maxWidth: 190 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{gap.variable}</div>
                      <div style={{ fontSize: 10.5, color: "var(--stone-500)", lineHeight: 1.45 }}>
                        {gap.why}
                      </div>
                    </td>
                    <td style={{ fontSize: 11.5, color: "var(--ink-700)" }}>{gap.source_hint}</td>
                    <td className="num" style={{ textAlign: "right", color: "var(--risk-low)" }}>
                      +{gap.modelled_gain_pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PrototypeNote>
            Illustrative prototype estimates of accuracy attributable to variables outside the
            current Common Upload Form.
          </PrototypeNote>
        </Panel>
      </div>

      <Panel
        title="Model transparency"
        subtitle={`Target: ${meta.model_card.target} · ${meta.model_card.validation}`}
        actions={
          <span className="badge badge-orange">
            <FlaskConical size={11} strokeWidth={2.4} />
            Evaluation design
          </span>
        }
        bodyClassName="table-wrap"
      >
        <table className="data">
          <thead>
            <tr>
              <th>Approach</th>
              <th>Family</th>
              <th style={{ textAlign: "right" }}>Accuracy</th>
              <th style={{ textAlign: "right" }}>Recall</th>
              <th style={{ textAlign: "right" }}>Lead time</th>
              <th>Why it is in the comparison</th>
            </tr>
          </thead>
          <tbody>
            {meta.model_card.models.map((m) => (
              <tr key={m.name} style={{ cursor: "default" }}>
                <td style={{ fontWeight: 600, fontSize: 12 }}>{m.name}</td>
                <td style={{ fontSize: 11.5 }}>{m.family}</td>
                <td className="num" style={{ textAlign: "right" }}>
                  {Math.round(m.accuracy * 100)}%
                </td>
                <td className="num" style={{ textAlign: "right" }}>
                  {Math.round(m.recall * 100)}%
                </td>
                <td className="num" style={{ textAlign: "right" }}>
                  {m.lead_time_days} d
                </td>
                <td style={{ fontSize: 11.5, color: "var(--ink-700)", maxWidth: 320 }}>{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <PrototypeNote>{meta.model_card.disclaimer}</PrototypeNote>
      </Panel>

      <Panel title="Where the data would come from" subtitle="Sources this platform is designed to sit on top of">
        <div className="grid-cards">
          {meta.data_sources.map((s) => (
            <div key={s.name} className="glass-soft" style={{ padding: "12px 14px" }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>{s.name}</div>
              <p style={{ fontSize: 11, color: "var(--ink-700)", marginTop: 4, lineHeight: 1.5 }}>
                {s.detail}
              </p>
              <div style={{ fontSize: 10.5, color: "var(--orange-700)", marginTop: 6, fontWeight: 600 }}>
                {s.role}
              </div>
            </div>
          ))}
        </div>
        <PrototypeNote>
          This prototype is not connected to any of these systems — every record shown is generated
          demonstration data.
        </PrototypeNote>
      </Panel>
    </AppShell>
  );
}
