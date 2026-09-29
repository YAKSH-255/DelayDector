"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  LayoutDashboard,
  Map,
  MessagesSquare,
  Repeat,
  Table2,
} from "lucide-react";
import { alerts, meta } from "@/lib/data";
import { Logo } from "./Logo";
import { cn, formatDate } from "@/lib/analytics";
import { useScope } from "./RoleProvider";

const NAV = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Executive Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Monitoring",
    items: [
      { href: "/projects", label: "Projects", icon: Table2 },
      { href: "/map", label: "Project Map", icon: Map },
      { href: "/alerts", label: "Early Warning", icon: BellRing, badge: true },
    ],
  },
  {
    title: "Intelligence",
    items: [{ href: "/ai-assistant", label: "AI Assistant", icon: MessagesSquare }],
  },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { definition, projects: scoped, label } = useScope();

  const scopedAlerts = alerts.filter((a) =>
    scoped.some((p) => p.project_id === a.project_id),
  );

  return (
    <div className="shell">
      <aside className="sidebar glass">
        <div className="brand">
          <Logo size={38} />
          <div className="brand-text">
            <b>DelayDector</b>
            <span>PROJECT INTELLIGENCE</span>
          </div>
        </div>

        {NAV.map((section) => (
          <div className="nav-section" key={section.title}>
            <div className="nav-title">{section.title.toUpperCase()}</div>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("nav-item", active && "active")}
                  title={item.label}
                >
                  <Icon size={17} strokeWidth={2} />
                  <span className="nav-label">{item.label}</span>
                  {item.badge && scopedAlerts.length > 0 && (
                    <span className="nav-count">{scopedAlerts.length}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="nav-footer">
          <Link href="/" className="nav-item" title="Switch demo role">
            <Repeat size={17} strokeWidth={2} />
            <span className="nav-label">Switch role</span>
          </Link>
          <div
            className="nav-label"
            style={{ padding: "8px 12px 0", fontSize: 10.5, color: "var(--stone-500)" }}
          >
            Signed in as <b style={{ color: "var(--ink-700)" }}>{definition.person}</b>
            <br />
            {definition.title}
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar glass">
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title">{title}</h1>
            <p className="page-sub">{subtitle ?? label}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {actions}
            <span className="demo-ribbon" title={meta.disclaimer}>
              DEMO DATA · {formatDate(meta.report_date)}
            </span>
            <Link href="/alerts" className="icon-btn" title={`${scopedAlerts.length} open alerts`}>
              <BellRing size={16} strokeWidth={2} />
              {scopedAlerts.length > 0 && <span className="dot" />}
            </Link>
            <div className="avatar" title={`${definition.person} · ${definition.title}`}>
              {definition.initials}
            </div>
          </div>
        </header>

        {children}

        <footer
          style={{
            marginTop: "auto",
            paddingTop: 10,
            fontSize: 10.5,
            color: "var(--stone-500)",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span>{meta.disclaimer}</span>
          <span>
            Built for {meta.problem_statement.id} · {meta.problem_statement.organization}
          </span>
        </footer>
      </main>
    </div>
  );
}
