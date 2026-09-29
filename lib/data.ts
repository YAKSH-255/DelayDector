import alertsJson from "@/data/alerts.json";
import departmentsJson from "@/data/departments.json";
import metaJson from "@/data/meta.json";
import projectsJson from "@/data/projects.json";
import type { Alert, Department, Meta, Project, RoleDefinition } from "./types";

export const meta = metaJson as unknown as Meta;
export const projects = projectsJson as unknown as Project[];
export const departments = departmentsJson as unknown as Department[];
export const alerts = alertsJson as unknown as Alert[];

export const heroProjects = projects.filter((p) => p.hero);

export const states = [...new Set(projects.map((p) => p.state))].sort();
export const departmentNames = departments.map((d) => d.name);

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.project_id.toLowerCase() === id.toLowerCase());
}

export function getDepartment(name: string): Department | undefined {
  return departments.find((d) => d.name === name);
}

export const ROLES: RoleDefinition[] = [
  {
    id: "mospi",
    title: "MoSPI Administrator",
    org: "Infrastructure & Project Monitoring Division",
    scope: "All 57 projects across 5 ministries. Monitor, review and escalate — read only on departmental records.",
    initials: "MA",
    person: "A. Ramesh",
  },
  {
    id: "department",
    title: "Department Administrator",
    org: "Jal Shakti",
    scope: "The 10 Jal Shakti projects. Update progress, respond to alerts and record interventions.",
    initials: "DA",
    person: "S. Kulkarni",
    department: "Jal Shakti",
  },
  {
    id: "officer",
    title: "Project Officer",
    org: "Gujarat Water Infrastructure Ltd",
    scope: "Assigned projects only. Inspect milestones, risks and monthly progress submissions.",
    initials: "PO",
    person: "M. Desai",
    department: "Jal Shakti",
  },
];

export function getRole(id: string | undefined): RoleDefinition {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}
