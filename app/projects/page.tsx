"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, RotateCcw, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useScope } from "@/components/RoleProvider";
import { Meter, Panel, RiskBadge } from "@/components/ui";
import { cn, formatCrore, healthBand, summarise } from "@/lib/analytics";
import type { Project, ProjectStatus, RiskLevel } from "@/lib/types";

type SortKey =
  | "project_id"
  | "name"
  | "department"
  | "state"
  | "planned_progress"
  | "actual_progress"
  | "delay_days"
  | "health_score"
  | "risk_level";

const RISK_ORDER: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

const COLUMNS: { key: SortKey; label: string; align?: "right" | "center"; width?: number }[] = [
  { key: "project_id", label: "ID", width: 86 },
  { key: "name", label: "Project" },
  { key: "department", label: "Department" },
  { key: "state", label: "State" },
  { key: "planned_progress", label: "Planned %", align: "right" },
  { key: "actual_progress", label: "Actual %", align: "right" },
  { key: "delay_days", label: "Delay", align: "right" },
  { key: "health_score", label: "Health", align: "right" },
  { key: "risk_level", label: "Risk" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, coverageNote } = useScope();

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [state, setState] = useState("all");
  const [risk, setRisk] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "health_score",
    dir: "asc",
  });

  const departmentOptions = useMemo(
    () => [...new Set(projects.map((p) => p.department))].sort(),
    [projects],
  );
  const stateOptions = useMemo(
    () => [...new Set(projects.map((p) => p.state))].sort(),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = projects.filter((p) => {
      if (department !== "all" && p.department !== department) return false;
      if (state !== "all" && p.state !== state) return false;
      if (risk !== "all" && p.risk_level !== risk) return false;
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.project_id.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.implementing_agency.toLowerCase().includes(q) ||
        p.contractor.toLowerCase().includes(q)
      );
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort.key === "risk_level") return (RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]) * dir;
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [projects, query, department, state, risk, status, sort]);

  const stats = summarise(filtered);
  const activeFilters =
    (department !== "all" ? 1 : 0) +
    (state !== "all" ? 1 : 0) +
    (risk !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (query ? 1 : 0);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
    );

  const reset = () => {
    setQuery("");
    setDepartment("all");
    setState("all");
    setRisk("all");
    setStatus("all");
  };

  return (
    <AppShell
      title="Project Monitoring"
      subtitle={coverageNote}
      actions={
        <div className="search-box" style={{ width: 250 }}>
          <Search size={14} strokeWidth={2.2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ID, district, agency"
            aria-label="Search projects"
          />
        </div>
      }
    >
      <Panel
        title="Filters"
        subtitle={`${filtered.length} of ${projects.length} monitored projects${activeFilters ? ` · ${activeFilters} filter${activeFilters > 1 ? "s" : ""} applied` : ""}`}
        actions={
          activeFilters > 0 ? (
            <button type="button" className="btn btn-glass btn-sm" onClick={reset}>
              <RotateCcw size={13} strokeWidth={2.2} /> Reset
            </button>
          ) : undefined
        }
      >
        <div
          className="form-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}
        >
          <div className="field">
            <label htmlFor="f-dept">Department</label>
            <select id="f-dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="all">All departments</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-state">State</label>
            <select id="f-state" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="all">All states</option>
              {stateOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-risk">Risk level</label>
            <select id="f-risk" value={risk} onChange={(e) => setRisk(e.target.value)}>
              <option value="all">All risk levels</option>
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-status">Status</label>
            <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {(["On Track", "At Risk", "Delayed"] as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--sand-200)",
            fontSize: 11.5,
          }}
        >
          {[
            { k: "Selected", v: `${filtered.length} projects` },
            { k: "Sanctioned cost", v: formatCrore(stats.budget, { compact: true }) },
            { k: "Avg health", v: `${stats.avgHealth}/100` },
            { k: "Avg delay", v: `${stats.avgDelay} days` },
            { k: "Delayed / at risk", v: `${stats.delayed} / ${stats.atRisk}` },
          ].map((s) => (
            <span key={s.k} className="muted">
              {s.k}: <b style={{ color: "var(--ink-900)" }}>{s.v}</b>
            </span>
          ))}
        </div>
      </Panel>

      <Panel
        title="Monitored projects"
        subtitle="Click any row to open the project intelligence view"
        bodyClassName="table-wrap"
      >
        <table className="data wide">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="sortable"
                  style={{ textAlign: col.align, width: col.width }}
                  onClick={() => toggleSort(col.key)}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: sort.key === col.key ? "var(--orange-700)" : undefined,
                    }}
                  >
                    {col.label}
                    {sort.key === col.key &&
                      (sort.dir === "asc" ? (
                        <ArrowUp size={11} strokeWidth={2.6} />
                      ) : (
                        <ArrowDown size={11} strokeWidth={2.6} />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <ProjectRow key={p.project_id} project={p} onOpen={() => router.push(`/projects/${p.project_id}`)} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 28, color: "var(--stone-500)" }}>
                  No projects match these filters.{" "}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
                    Reset filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}

function ProjectRow({ project: p, onOpen }: { project: Project; onOpen: () => void }) {
  const band = healthBand(p.health_score);
  return (
    <tr onClick={onOpen}>
      <td className="num" style={{ color: "var(--stone-500)" }}>
        {p.project_id}
      </td>
      <td style={{ minWidth: 230 }}>
        <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.35 }}>{p.name}</div>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--stone-500)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 260,
          }}
        >
          {p.implementing_agency} · {formatCrore(p.budget_crore)}
        </div>
      </td>
      <td style={{ fontSize: 12, minWidth: 120 }}>{p.department}</td>
      <td style={{ fontSize: 12 }} className="cell-nowrap">
        {p.state}
        <div style={{ fontSize: 10.5, color: "var(--stone-500)" }}>{p.district}</div>
      </td>
      <td className="num" style={{ textAlign: "right" }}>
        {p.planned_progress}%
      </td>
      <td style={{ textAlign: "right", minWidth: 112 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <Meter value={p.actual_progress} target={p.planned_progress} height={6} />
          <span className="num" style={{ fontWeight: 600 }}>
            {p.actual_progress}%
          </span>
        </div>
      </td>
      <td
        className="num"
        style={{
          textAlign: "right",
          color: p.delay_days > 30 ? "var(--risk-high)" : undefined,
          fontWeight: p.delay_days > 30 ? 600 : undefined,
        }}
      >
        {p.delay_days} d
      </td>
      <td style={{ textAlign: "right" }}>
        <span
          className={cn("badge")}
          style={{
            background: "transparent",
            color: band.color,
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            padding: "2px 0",
          }}
          title={band.label}
        >
          {p.health_score}
        </span>
      </td>
      <td className="cell-nowrap">
        <RiskBadge level={p.risk_level} small />
        <div style={{ fontSize: 10, color: "var(--stone-500)", marginTop: 3 }}>{p.status}</div>
      </td>
    </tr>
  );
}
