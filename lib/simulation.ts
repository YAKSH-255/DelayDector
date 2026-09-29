import type { Intervention, Project } from "./types";

const DAY = 86_400_000;

export interface LeverContribution {
  lever: Intervention;
  intensity: number;
  days: number;
}

export interface SimulationResult {
  baselineDelayDays: number;
  simulatedDelayDays: number;
  daysSaved: number;
  costCrore: number;
  costPerDay: number;
  baselineCompletion: string;
  simulatedCompletion: string;
  baselineProbability: number;
  simulatedProbability: number;
  contributions: LeverContribution[];
  active: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const addDays = (iso: string, days: number) =>
  new Date(new Date(iso).getTime() + days * DAY).toISOString().slice(0, 10);

/**
 * Deterministic what-if model.
 *
 * Each lever can recover `recovery_share` of the forecast delay at full
 * intensity, where the share is the driver's attributed impact multiplied by
 * how responsive that driver is to intervention. Levers combine
 * multiplicatively, so stacking them yields diminishing returns rather than an
 * impossible negative delay.
 */
export function simulate(
  project: Project,
  intensities: Record<string, number>,
): SimulationResult {
  const baseline = project.ai_prediction.predicted_delay_days;
  let retained = 1;
  let costCrore = 0;
  const contributions: LeverContribution[] = [];

  for (const lever of project.interventions) {
    const intensity = clamp01(intensities[lever.id] ?? 0);
    if (intensity <= 0) continue;
    const recovered = lever.recovery_share * intensity;
    retained *= 1 - recovered;
    costCrore += lever.cost_crore * intensity;
    contributions.push({
      lever,
      intensity,
      days: Math.round(baseline * recovered),
    });
  }

  const simulatedDelay = Math.max(0, Math.round(baseline * retained));
  const daysSaved = baseline - simulatedDelay;
  const baselineProbability = project.ai_prediction.delay_probability;

  return {
    baselineDelayDays: baseline,
    simulatedDelayDays: simulatedDelay,
    daysSaved,
    costCrore: Math.round(costCrore),
    costPerDay: daysSaved > 0 ? Number((costCrore / daysSaved).toFixed(2)) : 0,
    baselineCompletion: addDays(project.planned_completion, baseline),
    simulatedCompletion: addDays(project.planned_completion, simulatedDelay),
    baselineProbability,
    simulatedProbability: Number(
      Math.max(0.03, baselineProbability * retained ** 0.55).toFixed(2),
    ),
    contributions,
    active: contributions.length,
  };
}

/** The scenarios offered as one-click presets above the sliders. */
export function presetScenarios(project: Project) {
  const presets = project.interventions.slice(0, 3).map((lever) => ({
    id: lever.id,
    label: lever.label,
    intensities: { [lever.id]: 1 },
  }));
  return [
    ...presets,
    {
      id: "combined",
      label: "Combined intervention package",
      intensities: Object.fromEntries(
        project.interventions.slice(0, 3).map((l) => [l.id, 1]),
      ),
    },
  ];
}
