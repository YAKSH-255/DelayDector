export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ProjectStatus = "On Track" | "At Risk" | "Delayed";
export type MilestoneStatus = "Completed" | "In Progress" | "Delayed" | "Pending";
export type Severity = "Medium" | "High" | "Critical";

export interface RiskFactor {
  name: string;
  impact: number;
  category: string;
  responsiveness: number;
  mospi_code: string;
  mospi_reason: string;
  in_cuf: boolean;
}

export interface DelayReason {
  reason: string;
  category: string;
  days: number;
}

export interface Milestone {
  name: string;
  weight: number;
  planned_date: string;
  actual_date: string | null;
  forecast_date: string;
  status: MilestoneStatus;
  progress: number;
}

export interface ProgressPoint {
  period: string;
  date: string;
  planned: number;
  actual: number;
  expenditure_crore: number;
}

export interface ForecastPoint {
  period: string;
  date: string;
  planned: number;
  forecast: number;
  forecast_low: number;
  forecast_high: number;
}

export interface Intervention {
  id: string;
  label: string;
  detail: string;
  driver: string;
  owner: string;
  recovery_share: number;
  max_reduction_days: number;
  cost_crore: number;
}

export interface AiPrediction {
  delay_probability: number;
  predicted_delay_days: number;
  confidence: number;
  forecast_completion: string;
  additional_slippage_days: number;
  summary: string;
}

export interface Project {
  project_id: string;
  name: string;
  department: string;
  department_id: string;
  state: string;
  district: string;
  implementing_agency: string;
  contractor: string;
  scope: string;
  hero: boolean;
  budget_crore: number;
  revised_cost_crore: number;
  spent_crore: number;
  cost_overrun_pct: number;
  start_date: string;
  planned_completion: string;
  reported_completion: string;
  planned_progress: number;
  actual_progress: number;
  progress_gap: number;
  delay_days: number;
  risk_level: RiskLevel;
  status: ProjectStatus;
  health_score: number;
  health_composition: {
    schedule: number;
    cost: number;
    risk: number;
    governance: number;
    weights: { schedule: number; cost: number; risk: number; governance: number };
  };
  coordinates: { lat: number; lng: number };
  monthly_progress_rate: number;
  planned_monthly_rate: number;
  risk_factors: RiskFactor[];
  delay_reasons: DelayReason[];
  milestones: Milestone[];
  progress_history: ProgressPoint[];
  progress_forecast: ForecastPoint[];
  ai_prediction: AiPrediction;
  interventions: Intervention[];
  last_updated: string;
}

export interface Department {
  id: string;
  name: string;
  short: string;
  kind: string;
  total_projects: number;
  on_track: number;
  at_risk: number;
  delayed: number;
  sanctioned_cost_crore: number;
  revised_cost_crore: number;
  expenditure_crore: number;
  avg_health_score: number;
  avg_time_overrun_days: number;
}

export interface Alert {
  alert_id: string;
  project_id: string;
  project_name: string;
  department: string;
  state: string;
  severity: Severity;
  title: string;
  detail: string;
  recommended_action: string;
  predicted_delay_days: number;
  raised_on: string;
  age_days: number;
  trend_points: number;
}

export interface DataGap {
  variable: string;
  why: string;
  source_hint: string;
  modelled_gain_pct: number;
}

export interface Meta {
  product: string;
  report_date: string;
  reporting_period: string;
  disclaimer: string;
  problem_statement: {
    id: string;
    title: string;
    organization: string;
    department: string;
    category: string;
    theme: string;
  };
  data_sources: { name: string; detail: string; role: string }[];
  mospi_reasons: Record<string, string>;
  data_gaps: DataGap[];
  model_card: {
    disclaimer: string;
    target: string;
    validation: string;
    models: {
      name: string;
      family: string;
      accuracy: number;
      recall: number;
      lead_time_days: number;
      note: string;
    }[];
  };
  portfolio: {
    total_projects: number;
    monitored_in_detail: number;
    on_track: number;
    at_risk: number;
    delayed: number;
    risk_distribution: Record<RiskLevel, number>;
    sanctioned_cost_crore: number;
    revised_cost_crore: number;
    expenditure_crore: number;
    cost_overrun_crore: number;
    cost_overrun_pct: number;
    avg_health_score: number;
    avg_time_overrun_days: number;
    states_covered: number;
  };
}

export type Role = "mospi" | "department" | "officer";

export interface RoleDefinition {
  id: Role;
  title: string;
  org: string;
  scope: string;
  initials: string;
  person: string;
  department?: string;
}
