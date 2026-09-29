import { alerts, departments, meta, projects } from "./data";
import { driverRollup, formatCrore, formatDate, formatDays, summarise } from "./analytics";
import type { Project } from "./types";

/**
 * Deterministic demo assistant.
 *
 * Answers are composed from the monitored project records using rule-based
 * intent matching and templates — there is no language model behind this in the
 * prototype, and every figure quoted below is traceable to /data.
 */

export interface AnswerTable {
  columns: string[];
  rows: (string | number)[][];
}

export interface AssistantAnswer {
  intent: string;
  headline: string;
  paragraphs: string[];
  stats?: { label: string; value: string; tone?: "low" | "medium" | "high" | "critical" }[];
  table?: AnswerTable;
  projectRefs?: string[];
  followUps?: string[];
}

export const SUGGESTED_PROMPTS = [
  "Which projects require immediate attention?",
  "Why is the Gujarat Regional Water Grid delayed?",
  "Which department has the worst cost overrun?",
  "Show me projects with budget overruns above 10%",
  "Compare Railways with Road Transport & Highways",
  "What happens if we accelerate land acquisition on PRJ-003?",
  "How many projects are delayed in Gujarat?",
  "How accurate is the prediction model?",
];

const GENERIC = new Set([
  "project",
  "projects",
  "phase",
  "package",
  "corridor",
  "expansion",
  "modernization",
  "scheme",
  "mission",
  "network",
  "extension",
  "line",
  "rail",
  "metro",
  "road",
  "grid",
  "water",
  "state",
  "status",
  "delay",
  "delayed",
  "why",
  "what",
  "which",
  "show",
  "the",
  "and",
  "for",
  "with",
  "has",
]);

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[–—]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function findProject(question: string): Project | undefined {
  const q = normalise(question);
  const byId = q.match(/prj[\s-]?0*(\d{1,3})/);
  if (byId) {
    const id = `PRJ-${byId[1].padStart(3, "0")}`;
    const hit = projects.find((p) => p.project_id === id);
    if (hit) return hit;
  }
  let best: { project: Project; score: number } | undefined;
  for (const p of projects) {
    const tokens = normalise(p.name)
      .split(" ")
      .filter((t) => t.length > 3 && !GENERIC.has(t));
    let score = tokens.filter((t) => q.includes(t)).length * 2;
    if (q.includes(normalise(p.district))) score += 2;
    if (normalise(p.name).split(" ").filter((t) => t.length > 3).every((t) => q.includes(t)))
      score += 3;
    if (score > 0 && (!best || score > best.score)) best = { project: p, score };
  }
  return best && best.score >= 2 ? best.project : undefined;
}

function findState(question: string) {
  const q = normalise(question);
  return [...new Set(projects.map((p) => p.state))].find((s) => q.includes(normalise(s)));
}

function findDepartments(question: string) {
  const q = normalise(question);
  return departments.filter((d) => {
    const name = normalise(d.name);
    return (
      q.includes(name) ||
      q.includes(normalise(d.short)) ||
      (d.name === "Road Transport & Highways" && (q.includes("highway") || q.includes("road"))) ||
      (d.name === "Housing & Urban Affairs" && (q.includes("urban") || q.includes("housing")))
    );
  });
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

const SOURCE_NOTE =
  "Answer composed from the monitored project records using deterministic rules. Prototype demo data.";

/* ------------------------------------------------------------------ */

export function ask(question: string): AssistantAnswer {
  const q = normalise(question);
  const project = findProject(question);
  const state = findState(question);
  const depts = findDepartments(question);
  const portfolio = meta.portfolio;

  /* 1. What needs attention now */
  if (has(q, "immediate attention", "attention", "urgent", "priority", "escalate", "worst projects", "act on")) {
    const focus = [...projects]
      .filter((p) => p.status !== "On Track")
      .sort(
        (a, b) =>
          b.ai_prediction.predicted_delay_days - a.ai_prediction.predicted_delay_days,
      )
      .slice(0, 5);
    return {
      intent: "attention",
      headline: `${focus.length} projects need intervention this month`,
      paragraphs: [
        `Across the ${portfolio.total_projects}-project portfolio, ${portfolio.delayed} projects are behind their sanctioned completion date and ${portfolio.at_risk} are showing a widening variance. Ranked by prototype forecast delay, these five carry the largest exposure.`,
        `Together they account for ${formatCrore(focus.reduce((s, p) => s + p.revised_cost_crore, 0))} of anticipated cost.`,
      ],
      table: {
        columns: ["Project", "Risk", "Delay", "Forecast", "Top driver"],
        rows: focus.map((p) => [
          p.name,
          p.risk_level,
          `${p.delay_days} d`,
          `${p.ai_prediction.predicted_delay_days} d`,
          p.risk_factors[0].name,
        ]),
      },
      projectRefs: focus.map((p) => p.project_id),
      followUps: [
        `Why is the ${focus[0].name} delayed?`,
        "Which department has the worst cost overrun?",
      ],
    };
  }

  /* 2. Root cause for a specific project */
  if (project && has(q, "why", "reason", "root cause", "driver", "causing", "behind")) {
    const drivers = project.delay_reasons;
    const gap = project.progress_gap;
    return {
      intent: "root-cause",
      headline: `${project.name}: ${project.delay_days} days behind, ${gap} points below plan`,
      paragraphs: [
        project.ai_prediction.summary,
        `Attributed delay adds up to the ${project.delay_days} reported days. The prototype forecast extends this to ${project.ai_prediction.predicted_delay_days} days by ${formatDate(project.ai_prediction.forecast_completion)}, with ${Math.round(project.ai_prediction.delay_probability * 100)}% modelled probability of further slippage.`,
      ],
      stats: [
        { label: "Planned progress", value: `${project.planned_progress}%` },
        { label: "Actual progress", value: `${project.actual_progress}%` },
        { label: "Health score", value: `${project.health_score}/100` },
        {
          label: "Risk level",
          value: project.risk_level,
          tone: project.risk_level.toLowerCase() as "low" | "medium" | "high" | "critical",
        },
      ],
      table: {
        columns: ["Driver", "MoSPI reason", "Days attributed"],
        rows: drivers.map((d) => [
          d.reason,
          project.risk_factors.find((f) => f.name === d.reason)?.mospi_code ?? "—",
          d.days,
        ]),
      },
      projectRefs: [project.project_id],
      followUps: [
        `What happens if we accelerate land acquisition on ${project.project_id}?`,
        "Which projects require immediate attention?",
      ],
    };
  }

  /* 3. Cost / budget overrun */
  if (has(q, "overrun", "budget", "cost", "expenditure", "money", "spend")) {
    const threshold = Number(q.match(/above (\d+)/)?.[1] ?? q.match(/over (\d+)/)?.[1] ?? 10);
    const worst = [...projects]
      .filter((p) => p.cost_overrun_pct >= threshold)
      .sort((a, b) => b.cost_overrun_pct - a.cost_overrun_pct)
      .slice(0, 6);
    const worstDept = [...departments].sort(
      (a, b) =>
        (b.revised_cost_crore / b.sanctioned_cost_crore) -
        (a.revised_cost_crore / a.sanctioned_cost_crore),
    )[0];
    const worstDeptPct =
      ((worstDept.revised_cost_crore - worstDept.sanctioned_cost_crore) /
        worstDept.sanctioned_cost_crore) *
      100;
    return {
      intent: "cost",
      headline: `Portfolio cost overrun is ${formatCrore(portfolio.cost_overrun_crore)} (${portfolio.cost_overrun_pct}%)`,
      paragraphs: [
        `Sanctioned cost across the portfolio is ${formatCrore(portfolio.sanctioned_cost_crore, { compact: true })} against an anticipated ${formatCrore(portfolio.revised_cost_crore, { compact: true })}. ${worstDept.name} carries the steepest escalation at ${worstDeptPct.toFixed(1)}%.`,
        `${worst.length} monitored projects report a cost revision of ${threshold}% or more.`,
      ],
      table: {
        columns: ["Project", "Department", "Sanctioned", "Anticipated", "Overrun"],
        rows: worst.map((p) => [
          p.name,
          p.department,
          formatCrore(p.budget_crore),
          formatCrore(p.revised_cost_crore),
          `${p.cost_overrun_pct}%`,
        ]),
      },
      projectRefs: worst.slice(0, 4).map((p) => p.project_id),
      followUps: ["Compare Railways with Road Transport & Highways", "Which projects require immediate attention?"],
    };
  }

  /* 4. Department comparison */
  if (depts.length >= 2 || has(q, "compare", "comparison", "department", "ministry", "benchmark")) {
    const list = depts.length >= 2 ? depts : departments;
    return {
      intent: "benchmark",
      headline:
        depts.length >= 2
          ? `${list.map((d) => d.short).join(" vs ")} — side by side`
          : "Departmental benchmark across the portfolio",
      paragraphs: [
        `Ranked on average health score, ${[...list].sort((a, b) => b.avg_health_score - a.avg_health_score)[0].name} leads and ${[...list].sort((a, b) => a.avg_health_score - b.avg_health_score)[0].name} trails.`,
        `Average time overrun across the portfolio is ${portfolio.avg_time_overrun_days} days.`,
      ],
      table: {
        columns: ["Department", "Projects", "Delayed", "Avg health", "Avg overrun", "Cost revision"],
        rows: list.map((d) => [
          d.name,
          d.total_projects,
          d.delayed,
          d.avg_health_score,
          `${d.avg_time_overrun_days} d`,
          `${(((d.revised_cost_crore - d.sanctioned_cost_crore) / d.sanctioned_cost_crore) * 100).toFixed(1)}%`,
        ]),
      },
      followUps: ["Which projects require immediate attention?", "Which department has the worst cost overrun?"],
    };
  }

  /* 5. What-if / intervention */
  if (project && has(q, "what if", "what happens", "accelerate", "simulate", "intervention", "if we", "fix")) {
    const lever =
      project.interventions.find((l) => q.includes(normalise(l.driver).split(" ")[0])) ??
      project.interventions[0];
    const after = project.ai_prediction.predicted_delay_days - lever.max_reduction_days;
    return {
      intent: "what-if",
      headline: `${lever.label} → ${after} days instead of ${project.ai_prediction.predicted_delay_days}`,
      paragraphs: [
        `${lever.detail} At full intensity the prototype model recovers ${lever.max_reduction_days} days of the forecast delay on ${project.name}, at an indicative cost of ${formatCrore(lever.cost_crore)} (${(lever.cost_crore / lever.max_reduction_days).toFixed(2)} Cr per day saved).`,
        `Owner for this intervention is the ${lever.owner}. Open the project's simulation panel to combine levers.`,
      ],
      stats: [
        { label: "Baseline forecast", value: `${project.ai_prediction.predicted_delay_days} days` },
        { label: "Simulated forecast", value: `${after} days` },
        { label: "Days recovered", value: `${lever.max_reduction_days}` },
        { label: "Indicative cost", value: formatCrore(lever.cost_crore) },
      ],
      projectRefs: [project.project_id],
      followUps: [`Why is the ${project.name} delayed?`, "Which projects require immediate attention?"],
    };
  }

  /* 6. State view */
  if (state) {
    const inState = projects.filter((p) => p.state === state);
    const s = summarise(inState);
    return {
      intent: "state",
      headline: `${state}: ${s.delayed} delayed, ${s.atRisk} at risk of ${s.count} monitored projects`,
      paragraphs: [
        `${state} accounts for ${formatCrore(s.budget)} of sanctioned cost in the monitored set, with an average health score of ${s.avgHealth} and an average slippage of ${formatDays(s.avgDelay)}.`,
      ],
      table: {
        columns: ["Project", "Department", "Status", "Progress", "Delay"],
        rows: inState.map((p) => [
          p.name,
          p.department,
          p.status,
          `${p.actual_progress}% / ${p.planned_progress}%`,
          `${p.delay_days} d`,
        ]),
      },
      projectRefs: inState.slice(0, 5).map((p) => p.project_id),
      followUps: ["Which projects require immediate attention?"],
    };
  }

  /* 7. Model transparency */
  if (has(q, "accurate", "accuracy", "model", "how does", "trained", "algorithm", "confidence", "data gap", "missing data")) {
    const card = meta.model_card;
    return {
      intent: "model",
      headline: "How the prototype's risk layer is meant to work",
      paragraphs: [
        `This prototype does not train a model — risk values are deterministic and pre-authored. The evaluation design it demonstrates targets "${card.target}", validated by ${card.validation.toLowerCase()}.`,
        `The problem statement asks whether machine learning beats conventional statistics, so a logistic-regression baseline is quoted alongside. ${card.disclaimer}`,
      ],
      table: {
        columns: ["Model", "Family", "Accuracy", "Recall", "Lead time"],
        rows: card.models.map((m) => [
          m.name,
          m.family,
          `${Math.round(m.accuracy * 100)}%`,
          `${Math.round(m.recall * 100)}%`,
          `${m.lead_time_days} d`,
        ]),
      },
      followUps: ["Which projects require immediate attention?", "Which department has the worst cost overrun?"],
    };
  }

  /* 8. Specific project status */
  if (project) {
    return {
      intent: "status",
      headline: `${project.name} — ${project.status.toLowerCase()}, health ${project.health_score}/100`,
      paragraphs: [
        `${project.scope}. Implemented by ${project.implementing_agency} in ${project.district}, ${project.state}, with ${project.contractor} as contractor.`,
        `Physical progress is ${project.actual_progress}% against a planned ${project.planned_progress}%. Sanctioned completion is ${formatDate(project.planned_completion)}; the department reports ${formatDate(project.reported_completion)} and the prototype forecast is ${formatDate(project.ai_prediction.forecast_completion)}.`,
      ],
      stats: [
        { label: "Sanctioned cost", value: formatCrore(project.budget_crore) },
        { label: "Expenditure", value: formatCrore(project.spent_crore) },
        { label: "Delay", value: `${project.delay_days} days` },
        {
          label: "Risk",
          value: project.risk_level,
          tone: project.risk_level.toLowerCase() as "low" | "medium" | "high" | "critical",
        },
      ],
      projectRefs: [project.project_id],
      followUps: [`Why is the ${project.name} delayed?`, `What happens if we intervene on ${project.project_id}?`],
    };
  }

  /* 9. Driver-level question */
  const drivers = driverRollup(projects);
  const namedDriver = drivers.find((d) => q.includes(normalise(d.name)));
  if (namedDriver || has(q, "cause", "drivers", "reasons", "why are")) {
    const top = drivers.slice(0, 6);
    const focus = namedDriver ?? top[0];
    return {
      intent: "drivers",
      headline: `${focus.name} accounts for ${focus.days} attributed delay days across ${focus.projects} projects`,
      paragraphs: [
        `Aggregating the attributed delay of every monitored project, ${top[0].name} is the largest single driver. Each driver is mapped to MoSPI's published reason-for-delay taxonomy; ${drivers.filter((d) => !d.in_cuf).length} of the drivers in use are not derivable from the Common Upload Form as it stands today.`,
      ],
      table: {
        columns: ["Driver", "MoSPI code", "Projects", "Delay days", "In upload form"],
        rows: top.map((d) => [d.name, d.mospi_code, d.projects, d.days, d.in_cuf ? "Yes" : "No"]),
      },
      followUps: ["Which projects require immediate attention?", "How accurate is the prediction model?"],
    };
  }

  /* 10. Portfolio overview */
  if (has(q, "how many", "overview", "summary", "portfolio", "total", "overall", "status of the portfolio")) {
    return {
      intent: "portfolio",
      headline: `${portfolio.total_projects} projects, ${formatCrore(portfolio.revised_cost_crore, { compact: true })} anticipated cost`,
      paragraphs: [
        `${portfolio.on_track} projects are on track, ${portfolio.at_risk} are at risk and ${portfolio.delayed} are delayed. The average health score is ${portfolio.avg_health_score} and the average time overrun is ${portfolio.avg_time_overrun_days} days.`,
        `${portfolio.monitored_in_detail} of these carry full monitoring records in this prototype, spanning ${portfolio.states_covered} states and ${departments.length} ministries.`,
      ],
      stats: [
        { label: "On track", value: String(portfolio.on_track), tone: "low" },
        { label: "At risk", value: String(portfolio.at_risk), tone: "medium" },
        { label: "Delayed", value: String(portfolio.delayed), tone: "high" },
        { label: "Open alerts", value: String(alerts.length) },
      ],
      followUps: SUGGESTED_PROMPTS.slice(0, 3),
    };
  }

  /* Fallback */
  return {
    intent: "fallback",
    headline: "I can answer that from the monitored project records",
    paragraphs: [
      "This demo assistant resolves questions against the project dataset using deterministic rules, so it answers analytical questions about status, delay drivers, cost overruns, departmental comparison and intervention scenarios.",
      SOURCE_NOTE,
    ],
    followUps: SUGGESTED_PROMPTS.slice(0, 5),
  };
}
