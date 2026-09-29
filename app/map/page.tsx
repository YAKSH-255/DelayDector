"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useScope } from "@/components/RoleProvider";
import { Panel, RiskBadge } from "@/components/ui";
import { RISK_META, formatCrore, stateRollup, summarise } from "@/lib/analytics";
import type { ProjectStatus, RiskLevel } from "@/lib/types";

const ProjectMap = dynamic(() => import("@/components/ProjectMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 560,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--sand-100)",
        borderRadius: "var(--radius)",
        color: "var(--stone-500)",
        fontSize: 12.5,
      }}
    >
      Loading project map…
    </div>
  ),
});

export default function MapPage() {
  const { projects, coverageNote } = useScope();
  const [department, setDepartment] = useState("all");
  const [risk, setRisk] = useState("all");
  const [status, setStatus] = useState("all");

  const departmentOptions = useMemo(
    () => [...new Set(projects.map((p) => p.department))].sort(),
    [projects],
  );

  const filtered = projects.filter(
    (p) =>
      (department === "all" || p.department === department) &&
      (risk === "all" || p.risk_level === risk) &&
      (status === "all" || p.status === status),
  );

  const stats = summarise(filtered);
  const byState = stateRollup(filtered).slice(0, 8);

  return (
    <AppShell
      title="GIS Project Map"
      subtitle={`${filtered.length} projects plotted across ${new Set(filtered.map((p) => p.state)).size} states · marker size reflects sanctioned cost`}
    >
      <div className="grid-side">
        <Panel
          title="Geographic monitoring"
          subtitle="Colour and glyph indicate risk level; click a marker for the project summary"
          bodyClassName=""
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                className="input"
                style={{ width: 168, fontSize: 12, padding: "6px 10px" }}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                aria-label="Filter by department"
              >
                <option value="all">All departments</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                className="input"
                style={{ width: 128, fontSize: 12, padding: "6px 10px" }}
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
                aria-label="Filter by risk"
              >
                <option value="all">All risk</option>
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).map((r) => (
                  <option key={r} value={r}>
                    {RISK_META[r].label}
                  </option>
                ))}
              </select>
              <select
                className="input"
                style={{ width: 124, fontSize: 12, padding: "6px 10px" }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {(["On Track", "At Risk", "Delayed"] as ProjectStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          <ProjectMap projects={filtered} />
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
              marginTop: 10,
              fontSize: 11.5,
            }}
          >
            <span className="section-label">Legend</span>
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).map((level) => (
              <span
                key={level}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: RISK_META[level].color,
                    opacity: 0.6,
                    border: `1.5px solid ${RISK_META[level].color}`,
                  }}
                />
                <span aria-hidden style={{ color: RISK_META[level].color, fontSize: 9 }}>
                  {RISK_META[level].glyph}
                </span>
                {RISK_META[level].label} risk
              </span>
            ))}
            <span className="muted" style={{ marginLeft: "auto", fontSize: 10.5 }}>
              Boundaries and markers render locally — the map needs no internet connection. State
              shading reflects the share of flagged projects.
            </span>
          </div>
        </Panel>

        <div className="stack">
          <Panel title="Selection summary" subtitle={coverageNote}>
            {[
              { k: "Projects plotted", v: String(filtered.length) },
              { k: "Delayed", v: String(stats.delayed) },
              { k: "At risk", v: String(stats.atRisk) },
              { k: "Sanctioned cost", v: formatCrore(stats.budget, { compact: true }) },
              { k: "Avg health", v: `${stats.avgHealth}/100` },
            ].map((s) => (
              <div
                key={s.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--sand-200)",
                  fontSize: 12,
                }}
              >
                <span className="muted">{s.k}</span>
                <b>{s.v}</b>
              </div>
            ))}
          </Panel>

          <Panel title="By state" subtitle="Monitored projects in the current selection">
            <div style={{ display: "grid", gap: 7 }}>
              {byState.map((s) => (
                <div key={s.state} style={{ fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{s.state}</span>
                    <span className="num muted">
                      {s.delayed}/{s.count} flagged
                    </span>
                  </div>
                  <div className="meter" style={{ height: 5, marginTop: 4 }}>
                    <div
                      className="meter-fill"
                      style={{
                        width: `${(s.delayed / s.count) * 100}%`,
                        background: "var(--risk-high)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Projects in view"
            subtitle={`Every project plotted on the map, worst health first · ${filtered.length} shown`}
          >
            <div className="scroll-area" style={{ display: "grid", gap: 8, maxHeight: 440 }}>
              {[...filtered]
                .sort((a, b) => a.health_score - b.health_score)
                .map((p) => (
                  <Link
                    key={p.project_id}
                    href={`/projects/${p.project_id}`}
                    className="glass-soft"
                    style={{ padding: "9px 11px", display: "block" }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35 }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, color: "var(--stone-500)", marginTop: 2 }}>
                      {p.department} · {p.district}, {p.state}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 5,
                      }}
                    >
                      <RiskBadge level={p.risk_level} small />
                      <span
                        className="num"
                        style={{
                          fontSize: 11,
                          color: p.delay_days > 0 ? "var(--risk-high)" : "var(--stone-500)",
                        }}
                      >
                        {p.delay_days} d behind
                      </span>
                    </div>
                  </Link>
                ))}
              {filtered.length === 0 && (
                <p style={{ fontSize: 11.5, color: "var(--stone-500)" }}>
                  No projects match the current filters.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
