import { departments, meta, projects } from "./data";
import { summarise } from "./analytics";
import type { Project, Role } from "./types";

/** Projects a project officer is personally assigned in the demo. */
const OFFICER_PROJECTS = ["PRJ-003", "PRJ-018", "PRJ-006"];

export interface Scope {
  role: Role;
  projects: Project[];
  /** Headline counts for the role's span of control. */
  portfolio: {
    total_projects: number;
    monitored_in_detail: number;
    on_track: number;
    at_risk: number;
    delayed: number;
    sanctioned_cost_crore: number;
    revised_cost_crore: number;
    expenditure_crore: number;
    cost_overrun_crore: number;
    cost_overrun_pct: number;
    avg_health_score: number;
    avg_time_overrun_days: number;
  };
  /** What the KPI strip is counting, shown under the header. */
  label: string;
  /** Explains why the detailed table may hold fewer rows than the KPI count. */
  coverageNote: string;
  canEdit: boolean;
}

export function scopeFor(role: Role): Scope {
  if (role === "department") {
    const dept = departments.find((d) => d.name === "Jal Shakti")!;
    const list = projects.filter((p) => p.department === dept.name);
    const overrun = dept.revised_cost_crore - dept.sanctioned_cost_crore;
    return {
      role,
      projects: list,
      portfolio: {
        total_projects: dept.total_projects,
        monitored_in_detail: list.length,
        on_track: dept.on_track,
        at_risk: dept.at_risk,
        delayed: dept.delayed,
        sanctioned_cost_crore: dept.sanctioned_cost_crore,
        revised_cost_crore: dept.revised_cost_crore,
        expenditure_crore: dept.expenditure_crore,
        cost_overrun_crore: overrun,
        cost_overrun_pct: Number(((overrun / dept.sanctioned_cost_crore) * 100).toFixed(1)),
        avg_health_score: dept.avg_health_score,
        avg_time_overrun_days: dept.avg_time_overrun_days,
      },
      label: `${dept.name} portfolio · ${dept.total_projects} projects`,
      coverageNote: `${list.length} of ${dept.total_projects} Jal Shakti projects carry full monitoring records in this prototype.`,
      canEdit: true,
    };
  }

  if (role === "officer") {
    const list = projects.filter((p) => OFFICER_PROJECTS.includes(p.project_id));
    const s = summarise(list);
    const overrun = s.revised - s.budget;
    return {
      role,
      projects: list,
      portfolio: {
        total_projects: list.length,
        monitored_in_detail: list.length,
        on_track: s.onTrack,
        at_risk: s.atRisk,
        delayed: s.delayed,
        sanctioned_cost_crore: s.budget,
        revised_cost_crore: s.revised,
        expenditure_crore: s.spent,
        cost_overrun_crore: overrun,
        cost_overrun_pct: Number(((overrun / s.budget) * 100).toFixed(1)),
        avg_health_score: s.avgHealth,
        avg_time_overrun_days: s.avgDelay,
      },
      label: `${list.length} assigned projects`,
      coverageNote: "You are seeing only the projects assigned to you as project officer.",
      canEdit: true,
    };
  }

  const p = meta.portfolio;
  return {
    role: "mospi",
    projects,
    portfolio: {
      total_projects: p.total_projects,
      monitored_in_detail: p.monitored_in_detail,
      on_track: p.on_track,
      at_risk: p.at_risk,
      delayed: p.delayed,
      sanctioned_cost_crore: p.sanctioned_cost_crore,
      revised_cost_crore: p.revised_cost_crore,
      expenditure_crore: p.expenditure_crore,
      cost_overrun_crore: p.cost_overrun_crore,
      cost_overrun_pct: p.cost_overrun_pct,
      avg_health_score: p.avg_health_score,
      avg_time_overrun_days: p.avg_time_overrun_days,
    },
    label: `National portfolio · ${p.total_projects} projects across ${departments.length} ministries`,
    coverageNote: `${p.monitored_in_detail} of ${p.total_projects} projects carry full monitoring records in this prototype; the remainder contribute to aggregates only.`,
    canEdit: false,
  };
}
