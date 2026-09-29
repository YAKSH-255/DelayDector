"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Panel, PrototypeNote, RiskBadge } from "./ui";
import { RISK_META, formatCrore, formatDate } from "@/lib/analytics";
import type { Project } from "@/lib/types";

/** The explainable early-warning card: risk, forecast, drivers, action. */
export function RiskInsight({
  project,
  showAction = true,
  compact = false,
}: {
  project: Project;
  showAction?: boolean;
  compact?: boolean;
}) {
  const ai = project.ai_prediction;
  const risk = RISK_META[project.risk_level];
  const topAction = project.interventions[0];
  const maxImpact = Math.max(...project.risk_factors.map((f) => f.impact));

  return (
    <Panel
      elevation="glass"
      className="panel"
      style={{ borderTop: `3px solid ${risk.color}` }}
      title={undefined}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          className="badge badge-orange"
          style={{ letterSpacing: ".06em", fontSize: 10, textTransform: "uppercase" }}
        >
          <Sparkles size={11} strokeWidth={2.4} />
          Simulated AI insight
        </span>
        <RiskBadge level={project.risk_level} />
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
        <Figure
          value={`${ai.predicted_delay_days}`}
          unit="days"
          label="Predicted total delay"
          color={risk.color}
          large
        />
        <Figure value={`${Math.round(ai.delay_probability * 100)}%`} label="Slippage probability" />
        <Figure value={`${Math.round(ai.confidence * 100)}%`} label="Model confidence" />
        <Figure
          value={`${ai.additional_slippage_days > 0 ? "+" : ""}${ai.additional_slippage_days}`}
          unit="days"
          label="Beyond reported delay"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0,1fr))",
          gap: 8,
          padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          background: "var(--sand-100)",
          marginBottom: 14,
        }}
      >
        <MiniStat label="Current progress" value={`${project.actual_progress}%`} />
        <MiniStat label="Expected progress" value={`${project.planned_progress}%`} />
        <MiniStat
          label="Variance"
          value={`−${project.progress_gap}%`}
          color={project.progress_gap > 5 ? "var(--risk-high)" : "var(--ink-900)"}
        />
      </div>

      <div className="section-label" style={{ marginBottom: 8 }}>
        Top contributing factors
      </div>
      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {project.risk_factors.map((f) => (
          <div key={f.name}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 12,
                marginBottom: 3,
              }}
            >
              <span>
                {f.name}
                <span
                  className="mono"
                  style={{ fontSize: 9.5, color: "var(--stone-500)", marginLeft: 6 }}
                  title={f.mospi_reason}
                >
                  {f.mospi_code === "UNC" ? "not in CUF" : `MoSPI ${f.mospi_code}`}
                </span>
              </span>
              <b className="num">{f.impact}%</b>
            </div>
            <div className="meter" style={{ height: 6 }}>
              <div
                className="meter-fill"
                style={{
                  width: `${(f.impact / maxImpact) * 100}%`,
                  background: f.in_cuf ? "var(--orange-500)" : "var(--stone-500)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-700)" }}>{ai.summary}</p>
      )}

      {showAction && topAction && (
        <div
          style={{
            marginTop: 13,
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "var(--orange-50)",
            border: "1px solid rgba(232,90,12,.16)",
          }}
        >
          <div className="section-label" style={{ color: "var(--orange-700)" }}>
            Recommended intervention
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{topAction.label}</div>
          <p style={{ fontSize: 11.5, color: "var(--ink-700)", marginTop: 3, lineHeight: 1.5 }}>
            {topAction.detail}
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 8,
              fontSize: 11,
              color: "var(--ink-700)",
            }}
          >
            <span>
              Recovers up to <b>{topAction.max_reduction_days} days</b>
            </span>
            <span>·</span>
            <span>
              Indicative cost <b>{formatCrore(topAction.cost_crore)}</b>
            </span>
            <span>·</span>
            <span>
              Owner <b>{topAction.owner}</b>
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--sand-200)",
          fontSize: 11.5,
        }}
      >
        <span className="muted">
          Prototype forecast completion{" "}
          <b style={{ color: "var(--ink-900)" }}>{formatDate(ai.forecast_completion)}</b>
        </span>
        <span className="muted">
          Department reports <b style={{ color: "var(--ink-900)" }}>{formatDate(project.reported_completion)}</b>
        </span>
      </div>

      <PrototypeNote>
        Prototype prediction produced by deterministic demo logic, not a trained production model.
      </PrototypeNote>

      {compact && (
        <Link
          href={`/projects/${project.project_id}`}
          className="btn btn-glass btn-sm"
          style={{ marginTop: 10, width: "100%" }}
        >
          Open project intelligence
        </Link>
      )}
    </Panel>
  );
}

function Figure({
  value,
  unit,
  label,
  color,
  large,
}: {
  value: string;
  unit?: string;
  label: string;
  color?: string;
  large?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: large ? 32 : 22,
          fontWeight: 600,
          lineHeight: 1,
          color,
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: large ? 13 : 11, fontWeight: 500, marginLeft: 3 }}>{unit}</span>
        )}
      </div>
      <div style={{ fontSize: 10.5, color: "var(--stone-500)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--stone-500)" }}>{label}</div>
      <div className="num" style={{ fontSize: 14, fontWeight: 600, color, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
