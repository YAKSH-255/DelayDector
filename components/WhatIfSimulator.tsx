"use client";

import { useMemo, useState } from "react";
import { RotateCcw, TrendingDown } from "lucide-react";
import { Panel, PrototypeNote } from "./ui";
import { presetScenarios, simulate } from "@/lib/simulation";
import { formatCrore, formatDate } from "@/lib/analytics";
import type { Project } from "@/lib/types";

export function WhatIfSimulator({ project }: { project: Project }) {
  const [intensities, setIntensities] = useState<Record<string, number>>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const presets = useMemo(() => presetScenarios(project), [project]);
  const result = useMemo(() => simulate(project, intensities), [project, intensities]);

  const setLever = (id: string, value: number) => {
    setActivePreset(null);
    setIntensities((prev) => ({ ...prev, [id]: value }));
  };

  const applyPreset = (preset: (typeof presets)[number]) => {
    setActivePreset(preset.id);
    setIntensities(preset.intensities);
  };

  const reset = () => {
    setActivePreset(null);
    setIntensities({});
  };

  const baseline = result.baselineDelayDays;
  const simulated = result.simulatedDelayDays;
  const barMax = Math.max(baseline, 1);

  return (
    <Panel
      title="What-if intervention simulation"
      subtitle="Move a lever to see how the forecast delay responds. Deterministic prototype model."
      actions={
        result.active > 0 ? (
          <button type="button" className="btn btn-glass btn-sm" onClick={reset}>
            <RotateCcw size={13} strokeWidth={2.2} /> Reset
          </button>
        ) : undefined
      }
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`chip${activePreset === preset.id ? " selected" : ""}`}
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid-main">
        {/* Levers */}
        <div style={{ display: "grid", gap: 14 }}>
          {project.interventions.map((lever) => {
            const intensity = intensities[lever.id] ?? 0;
            const days = Math.round(baseline * lever.recovery_share * intensity);
            return (
              <div key={lever.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 10,
                  }}
                >
                  <label htmlFor={lever.id} style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {lever.label}
                  </label>
                  <span
                    className="num"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: days > 0 ? "var(--risk-low)" : "var(--stone-500)",
                    }}
                  >
                    {days > 0 ? `−${days} days` : "no change"}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--stone-500)", margin: "2px 0 6px" }}>
                  {lever.detail}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    id={lever.id}
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round(intensity * 100)}
                    onChange={(e) => setLever(lever.id, Number(e.target.value) / 100)}
                    style={{ flex: 1, accentColor: "var(--orange-600)", cursor: "pointer" }}
                    aria-label={`${lever.label} intensity`}
                  />
                  <span
                    className="num"
                    style={{ width: 38, textAlign: "right", fontSize: 11.5, color: "var(--stone-500)" }}
                  >
                    {Math.round(intensity * 100)}%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 6,
                    fontSize: 10.5,
                    color: "var(--stone-500)",
                    flexWrap: "wrap",
                  }}
                >
                  <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                    {lever.driver}
                  </span>
                  <span>Owner: {lever.owner}</span>
                  <span>·</span>
                  <span>Indicative cost {formatCrore(lever.cost_crore)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Outcome */}
        <div
          className="glass-soft"
          style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div>
            <div className="section-label">Forecast delay</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 8 }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 38,
                    fontWeight: 600,
                    lineHeight: 1,
                    color: simulated < baseline ? "var(--risk-low)" : "var(--risk-critical)",
                  }}
                >
                  {simulated}
                  <span style={{ fontSize: 15, fontWeight: 500, marginLeft: 4 }}>days</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--stone-500)", marginTop: 3 }}>
                  simulated outcome
                </div>
              </div>
              {result.daysSaved > 0 && (
                <span
                  className="badge badge-success"
                  style={{ marginBottom: 18, fontSize: 12, padding: "4px 11px" }}
                >
                  <TrendingDown size={12} strokeWidth={2.4} />
                  {result.daysSaved} days recovered
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 7 }}>
            <BarRow
              label="Baseline forecast"
              value={baseline}
              max={barMax}
              color="var(--risk-critical)"
            />
            <BarRow
              label="After intervention"
              value={simulated}
              max={barMax}
              color="var(--risk-low)"
            />
          </div>

          <div style={{ display: "grid", gap: 0 }}>
            <Row label="Sanctioned completion" value={formatDate(project.planned_completion)} />
            <Row label="Baseline forecast date" value={formatDate(result.baselineCompletion)} />
            <Row
              label="Simulated completion"
              value={formatDate(result.simulatedCompletion)}
              highlight={result.daysSaved > 0}
            />
            <Row
              label="Slippage probability"
              value={`${Math.round(result.baselineProbability * 100)}% → ${Math.round(result.simulatedProbability * 100)}%`}
            />
            <Row
              label="Indicative intervention cost"
              value={result.costCrore > 0 ? formatCrore(result.costCrore) : "—"}
            />
            <Row
              label="Cost per day recovered"
              value={result.costPerDay > 0 ? `₹${result.costPerDay} Cr` : "—"}
            />
          </div>

          <PrototypeNote>
            Simulated prototype output. Levers recover a share of the forecast delay equal to the
            driver&rsquo;s attributed impact weighted by how responsive that driver is to
            intervention; combined levers compound with diminishing returns. Not a real forecast.
          </PrototypeNote>
        </div>
      </div>
    </Panel>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span className="muted">{label}</span>
        <span className="num" style={{ fontWeight: 600 }}>
          {value} d
        </span>
      </div>
      <div className="meter" style={{ height: 9 }}>
        <div
          className="meter-fill"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "6px 0",
        borderBottom: "1px solid var(--sand-200)",
        fontSize: 12,
      }}
    >
      <span className="muted">{label}</span>
      <span
        style={{
          fontWeight: 600,
          color: highlight ? "var(--risk-low)" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
