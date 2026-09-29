import { projects } from "@/lib/data";
import ProjectDetail from "./ProjectDetail";

/** Every monitored project gets its own page in the static export. */
export function generateStaticParams() {
  return projects.map((p) => ({ id: p.project_id }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
