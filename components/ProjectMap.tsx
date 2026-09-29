"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleMarker, GeoJSON, MapContainer, Popup, Tooltip } from "react-leaflet";
import type { FeatureCollection, Geometry } from "geojson";
import "leaflet/dist/leaflet.css";
import { RISK_META, formatCrore } from "@/lib/analytics";
import type { Project } from "@/lib/types";

/** Marker size carries sanctioned cost, colour carries risk. */
const radiusFor = (budget: number) => 6 + Math.min(12, Math.sqrt(budget) / 12);

interface StateProps {
  state: string;
}

export default function ProjectMap({
  projects,
  height = 560,
}: {
  projects: Project[];
  height?: number;
}) {
  const [boundaries, setBoundaries] = useState<FeatureCollection<Geometry, StateProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Boundaries are served from /public, so the map needs no internet connection.
    fetch("/india-states.json")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setBoundaries(data);
      })
      .catch(() => setBoundaries(null));
    return () => {
      cancelled = true;
    };
  }, []);

  /** Projects per state drive both the choropleth and the hover tooltip. */
  const byState = useMemo(() => {
    const map = new Map<string, { count: number; flagged: number; list: Project[] }>();
    for (const p of projects) {
      const entry = map.get(p.state) ?? { count: 0, flagged: 0, list: [] };
      entry.count += 1;
      if (p.status !== "On Track") entry.flagged += 1;
      entry.list.push(p);
      map.set(p.state, entry);
    }
    for (const entry of map.values()) {
      entry.list.sort((a, b) => a.health_score - b.health_score);
    }
    return map;
  }, [projects]);

  return (
    <MapContainer
      center={[22.8, 82.5]}
      zoom={5}
      minZoom={4}
      maxZoom={9}
      scrollWheelZoom
      style={{ height, width: "100%", borderRadius: "var(--radius)" }}
      attributionControl={false}
    >
      {boundaries && (
        <GeoJSON
          key="india"
          data={boundaries}
          style={(feature) => {
            const name = (feature?.properties as StateProps | undefined)?.state ?? "";
            const stats = byState.get(name);
            const intensity = stats ? Math.min(1, 0.22 + (stats.flagged / stats.count) * 0.55) : 0;
            return {
              color: "#c9c2b8",
              weight: 0.8,
              fillColor: stats ? "#FF8640" : "#EDEAE6",
              fillOpacity: stats ? intensity * 0.32 : 0.55,
            };
          }}
          onEachFeature={(feature, layer) => {
            const name = (feature.properties as StateProps).state;
            const stats = byState.get(name);
            layer.bindTooltip(stateTooltip(name, stats), {
              sticky: true,
              // "auto" flips the tooltip across the cursor near the map edges,
              // which a fixed direction would clip.
              direction: "auto",
              opacity: 1,
            });
          }}
        />
      )}

      {projects.map((p) => {
        const risk = RISK_META[p.risk_level];
        return (
          <CircleMarker
            key={p.project_id}
            center={[p.coordinates.lat, p.coordinates.lng]}
            radius={radiusFor(p.budget_crore)}
            pathOptions={{
              color: risk.color,
              fillColor: risk.color,
              fillOpacity: 0.62,
              weight: p.risk_level === "CRITICAL" ? 3 : 1.6,
              dashArray:
                p.status === "Delayed" ? undefined : p.status === "At Risk" ? "4 3" : "1 3",
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{p.name}</span>
              <br />
              <span style={{ fontSize: 10 }}>
                {risk.glyph} {risk.label} risk · {p.delay_days} d behind
              </span>
            </Tooltip>
            <Popup>
              <div style={{ padding: "12px 14px", fontFamily: "var(--font-body)" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    marginBottom: 6,
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: risk.color,
                    letterSpacing: ".04em",
                  }}
                >
                  <span aria-hidden>{risk.glyph}</span>
                  {risk.label.toUpperCase()} RISK · {p.status.toUpperCase()}
                </div>
                <div
                  style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.35, color: "var(--ink-900)" }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--stone-500)", marginTop: 2 }}>
                  {p.department} · {p.district}, {p.state}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 6,
                    margin: "10px 0",
                    fontSize: 11,
                  }}
                >
                  <Cell label="Progress" value={`${p.actual_progress}% / ${p.planned_progress}%`} />
                  <Cell label="Delay" value={`${p.delay_days} days`} />
                  <Cell label="Sanctioned" value={formatCrore(p.budget_crore)} />
                  <Cell label="Health" value={`${p.health_score}/100`} />
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-700)",
                    paddingTop: 8,
                    borderTop: "1px solid var(--sand-200)",
                  }}
                >
                  Top driver: <b>{p.risk_factors[0].name}</b> ({p.risk_factors[0].impact}%)
                </div>

                <Link
                  href={`/projects/${p.project_id}`}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 10, width: "100%" }}
                >
                  Open project intelligence
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/**
 * Leaflet tooltips take an HTML string, so the state summary is assembled here.
 * It names the projects in the state rather than only counting them.
 */
function stateTooltip(
  state: string,
  stats: { count: number; flagged: number; list: Project[] } | undefined,
) {
  if (!stats) {
    return `<b>${escapeHtml(state)}</b><br/><span style="color:var(--stone-500)">No monitored projects</span>`;
  }

  const MAX_ROWS = 8;
  const shown = stats.list.slice(0, MAX_ROWS);
  const hidden = stats.list.length - shown.length;

  const rows = shown
    .map((p) => {
      const risk = RISK_META[p.risk_level];
      const note = p.delay_days > 0 ? `${p.delay_days} d behind` : "on schedule";
      return `<div style="display:flex;gap:5px;align-items:baseline;margin-top:4px;line-height:1.35">
          <span style="color:${risk.color};font-size:8px;flex:none">${risk.glyph}</span>
          <span style="flex:1;min-width:0">${escapeHtml(p.name)}</span>
          <span style="color:var(--stone-500);font-variant-numeric:tabular-nums;white-space:nowrap;flex:none">${note}</span>
        </div>`;
    })
    .join("");

  const more = hidden
    ? `<div style="color:var(--stone-500);margin-top:4px">+${hidden} more</div>`
    : "";

  // Leaflet clips tooltips to the map container and its default `nowrap` makes
  // the width unpredictable, so this is a fixed-width block that wraps.
  return `<div style="width:232px;white-space:normal">
      <b>${escapeHtml(state)}</b>
      <div style="color:var(--stone-500)">${stats.count} monitored · ${stats.flagged} flagged</div>
      <div style="margin-top:5px;padding-top:5px;border-top:1px solid var(--sand-200)">${rows}${more}</div>
    </div>`;
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "var(--stone-500)", fontSize: 9.5 }}>{label}</div>
      <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{value}</div>
    </div>
  );
}
