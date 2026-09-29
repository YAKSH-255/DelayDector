"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RISK_META } from "@/lib/analytics";
import type { Project, RiskLevel } from "@/lib/types";

const AXIS = {
  stroke: "var(--sand-300)",
  tick: { fill: "var(--stone-500)", fontSize: 10.5 },
  tickLine: false,
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(255,255,255,.96)",
    border: "1px solid var(--sand-300)",
    borderRadius: 12,
    boxShadow: "0 12px 30px rgba(43,39,35,.12)",
    fontSize: 12,
    fontFamily: "var(--font-body)",
    padding: "8px 12px",
  },
  labelStyle: { fontWeight: 600, marginBottom: 4, color: "var(--ink-900)" },
  itemStyle: { padding: "1px 0" },
};

const LEGEND_STYLE = { fontSize: 11, paddingTop: 6 };

/* ---------------------- Planned vs actual + forecast -------------------- */

export function ProgressChart({
  project,
  height = 250,
  showForecast = true,
}: {
  project: Project;
  height?: number;
  showForecast?: boolean;
}) {
  const history = project.progress_history.map((p) => ({
    period: p.period,
    planned: p.planned,
    actual: p.actual,
  }));
  const forecast = showForecast
    ? project.progress_forecast.map((p) => ({
        period: p.period,
        planned: p.planned,
        forecast: p.forecast,
        band: [p.forecast_low, p.forecast_high] as [number, number],
      }))
    : [];

  const last = history[history.length - 1];
  const data = [
    ...history.map((h, i) =>
      i === history.length - 1
        ? { ...h, forecast: h.actual, band: [h.actual, h.actual] as [number, number] }
        : h,
    ),
    ...forecast,
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="plannedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--info)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--orange-500)" stopOpacity={0.26} />
            <stop offset="100%" stopColor="var(--orange-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--sand-200)" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="period" {...AXIS} interval="preserveStartEnd" minTickGap={12} />
        <YAxis domain={[0, 100]} unit="%" {...AXIS} width={46} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v: unknown, name) => [`${v}%`, name]} />
        <Legend wrapperStyle={LEGEND_STYLE} iconType="plainline" iconSize={14} />
        {showForecast && (
          <Area
            dataKey="band"
            name="Forecast range"
            stroke="none"
            fill="var(--orange-300)"
            fillOpacity={0.18}
            isAnimationActive={false}
            legendType="none"
            connectNulls
          />
        )}
        <Area
          type="monotone"
          dataKey="planned"
          name="Planned"
          stroke="var(--info)"
          strokeWidth={2}
          fill="url(#plannedFill)"
          dot={false}
          activeDot={{ r: 3.5 }}
        />
        <Area
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="var(--orange-600)"
          strokeWidth={2.4}
          fill="url(#actualFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        {showForecast && (
          <Line
            type="monotone"
            dataKey="forecast"
            name="Prototype forecast"
            stroke="var(--orange-600)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
          />
        )}
        {showForecast && last && (
          <ReferenceLine
            x={last.period}
            stroke="var(--stone-500)"
            strokeDasharray="2 3"
            label={{
              value: "today",
              position: "insideTopRight",
              fill: "var(--stone-500)",
              fontSize: 9.5,
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* --------------------- Portfolio planned vs actual ---------------------- */

export function PortfolioProgressChart({
  data,
  height = 220,
}: {
  data: {
    period: string;
    planned: number;
    actual: number;
    gap: number;
    band: [number, number];
  }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--sand-200)" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="period" {...AXIS} minTickGap={10} />
        <YAxis domain={[0, 100]} unit="%" {...AXIS} width={46} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value: unknown, name) =>
            name === "Shortfall against plan"
              ? [`${(value as [number, number])[1] - (value as [number, number])[0]} points`, name]
              : [`${value}%`, name]
          }
        />
        <Legend wrapperStyle={LEGEND_STYLE} iconType="plainline" iconSize={14} />
        {/* The wedge between planned and actual is the story; shade it. */}
        <Area
          dataKey="band"
          name="Shortfall against plan"
          stroke="none"
          fill="var(--risk-high)"
          fillOpacity={0.26}
          isAnimationActive={false}
          legendType="rect"
        />
        <Area
          type="monotone"
          dataKey="planned"
          name="Planned"
          stroke="var(--info)"
          strokeWidth={2}
          fill="none"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="var(--orange-600)"
          strokeWidth={2.4}
          fill="none"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------ Risk donut ------------------------------ */

export function RiskDonut({
  distribution,
  height = 200,
}: {
  distribution: Record<RiskLevel, number>;
  height?: number;
}) {
  const data = (Object.keys(distribution) as RiskLevel[]).map((level) => ({
    name: `${RISK_META[level].label} risk`,
    level,
    value: distribution[level],
  }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((d) => (
              <Cell key={d.level} fill={RISK_META[d.level].color} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: unknown, n) => [`${v} projects`, n]} />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {total}
        </span>
        <span style={{ fontSize: 10, color: "var(--stone-500)" }}>projects</span>
      </div>
    </div>
  );
}

/* --------------------------- Horizontal bars ---------------------------- */

export function DriverBars({
  data,
  height = 220,
  unit = " days",
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        layout="vertical"
        margin={{ top: 2, right: 16, bottom: 2, left: 8 }}
        barCategoryGap={8}
      >
        <CartesianGrid stroke="var(--sand-200)" strokeDasharray="3 4" horizontal={false} />
        <XAxis type="number" {...AXIS} />
        <YAxis
          type="category"
          dataKey="name"
          width={148}
          tick={{ fill: "var(--ink-700)", fontSize: 11 }}
          tickLine={false}
          stroke="var(--sand-300)"
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v: unknown) => [`${v}${unit}`, "Attributed"]} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={d.color ?? (i === 0 ? "var(--orange-600)" : "var(--orange-300)")} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* --------------------------- Department bars ---------------------------- */

export function DepartmentBars({
  data,
  height = 240,
}: {
  data: { name: string; onTrack: number; atRisk: number; delayed: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
        <CartesianGrid stroke="var(--sand-200)" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="name" {...AXIS} interval={0} tick={{ fill: "var(--stone-500)", fontSize: 10 }} />
        <YAxis {...AXIS} width={44} allowDecimals={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
        <Bar dataKey="onTrack" name="On track" stackId="s" fill="var(--risk-low)" radius={[0, 0, 0, 0]} barSize={30} />
        <Bar dataKey="atRisk" name="At risk" stackId="s" fill="var(--risk-medium)" barSize={30} />
        <Bar dataKey="delayed" name="Delayed" stackId="s" fill="var(--risk-high)" radius={[5, 5, 0, 0]} barSize={30} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* -------------------------- Budget vs progress -------------------------- */

export function BudgetChart({ project, height = 220 }: { project: Project; height?: number }) {
  const data = project.progress_history.map((p) => ({
    period: p.period,
    expenditure: Math.round((p.expenditure_crore / project.budget_crore) * 100),
    progress: p.actual,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--sand-200)" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="period" {...AXIS} minTickGap={10} />
        <YAxis domain={[0, 100]} unit="%" {...AXIS} width={46} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v: unknown, name) => [`${v}%`, name]} />
        <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
        <Bar
          dataKey="expenditure"
          name="Funds drawn (% of sanction)"
          fill="var(--orange-300)"
          radius={[4, 4, 0, 0]}
          barSize={16}
        />
        <Line
          type="monotone"
          dataKey="progress"
          name="Physical progress"
          stroke="var(--ink-700)"
          strokeWidth={2.2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------ Sparkline ------------------------------- */

export function Sparkline({
  data,
  color = "var(--orange-600)",
  width = 96,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - 2) + 1;
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}
