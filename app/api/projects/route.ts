import { NextResponse } from "next/server";
import { meta, projects } from "@/lib/data";

/**
 * Mock API over the demo dataset, so the UI can be pointed at a real backend
 * later. Emitted as a static document so it also works on the GitHub Pages
 * build, where nothing is served by a running Node process.
 */
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    meta: {
      report_date: meta.report_date,
      disclaimer: meta.disclaimer,
      count: projects.length,
    },
    projects,
  });
}
