import { NextResponse } from "next/server";
import { meta, projects } from "@/lib/data";

/** Mock API over the demo dataset, so the UI can be pointed at a real backend later. */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");
  const state = searchParams.get("state");
  const risk = searchParams.get("risk");

  const results = projects.filter(
    (p) =>
      (!department || p.department === department) &&
      (!state || p.state === state) &&
      (!risk || p.risk_level === risk.toUpperCase()),
  );

  return NextResponse.json({
    meta: {
      report_date: meta.report_date,
      disclaimer: meta.disclaimer,
      count: results.length,
    },
    projects: results,
  });
}
