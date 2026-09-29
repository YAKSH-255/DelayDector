"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Building2, HardHat, Landmark } from "lucide-react";
import { ROLES, alerts, meta } from "@/lib/data";
import { formatCrore, formatDate } from "@/lib/analytics";
import { Logo } from "@/components/Logo";
import { useRole } from "@/components/RoleProvider";
import type { Role } from "@/lib/types";

const ROLE_ICONS: Record<Role, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  mospi: Landmark,
  department: Building2,
  officer: HardHat,
};

export default function RoleSelection() {
  const router = useRouter();
  const { setRole } = useRole();
  const p = meta.portfolio;

  const enter = (role: Role) => {
    setRole(role);
    router.push("/dashboard");
  };

  return (
    <main
      style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1020 }} className="fade-up">
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 26 }}>
          <Logo size={52} />
          <div>
            <b style={{ fontFamily: "var(--font-display)", fontSize: 24, letterSpacing: "-0.02em" }}>
              DelayDector
            </b>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 10.5,
                color: "var(--orange-600)",
                fontWeight: 700,
                letterSpacing: "0.16em",
                marginTop: -2,
              }}
            >
              PROJECT INTELLIGENCE PLATFORM
            </div>
          </div>
          <span className="demo-ribbon" style={{ marginLeft: "auto" }}>
            PROTOTYPE · DEMO DATA ONLY
          </span>
        </div>

        <div className="panel glass-strong" style={{ padding: "30px 32px 26px" }}>
          <h1 style={{ fontSize: 27, maxWidth: 640 }}>
            Move project monitoring from{" "}
            <span style={{ color: "var(--stone-500)" }}>what is happening</span> to why, what next,
            and what to do about it.
          </h1>
          <p style={{ marginTop: 10, maxWidth: 680, color: "var(--ink-700)", fontSize: 13.5 }}>
            An early-warning layer over monthly infrastructure project reporting — explainable risk
            scoring, delay attribution against MoSPI&rsquo;s own reason taxonomy, geographic
            monitoring and intervention simulation.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              margin: "20px 0 24px",
              padding: "14px 18px",
              borderRadius: "var(--radius)",
              background: "var(--orange-50)",
              border: "1px solid rgba(232,90,12,.14)",
            }}
          >
            {[
              { k: "Projects monitored", v: String(p.total_projects) },
              { k: "Anticipated cost", v: formatCrore(p.revised_cost_crore, { compact: true }) },
              { k: "Delayed / at risk", v: `${p.delayed} / ${p.at_risk}` },
              { k: "Open early warnings", v: String(alerts.length) },
              { k: "Avg time overrun", v: `${p.avg_time_overrun_days} days` },
            ].map((s) => (
              <div key={s.k}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 19,
                    fontWeight: 600,
                    color: "var(--orange-700)",
                  }}
                >
                  {s.v}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--stone-500)", letterSpacing: ".04em" }}>
                  {s.k}
                </div>
              </div>
            ))}
          </div>

          <div className="section-label" style={{ marginBottom: 10 }}>
            Select a demo role to continue
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
              gap: 12,
            }}
          >
            {ROLES.map((role) => {
              const Icon = ROLE_ICONS[role.id];
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => enter(role.id)}
                  className="panel glass"
                  style={{
                    textAlign: "left",
                    padding: "16px 17px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                    border: "1px solid var(--sand-200)",
                    transition: "transform .16s ease, box-shadow .2s ease, border-color .2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "var(--orange-300)";
                    e.currentTarget.style.boxShadow = "0 14px 30px rgba(232,90,12,.14)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "var(--sand-200)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 11,
                        background: "var(--orange-50)",
                        color: "var(--orange-600)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(232,90,12,.16)",
                      }}
                    >
                      <Icon size={17} strokeWidth={2} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{role.title}</div>
                      <div style={{ fontSize: 11, color: "var(--stone-500)" }}>{role.org}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--ink-700)", lineHeight: 1.5 }}>
                    {role.scope}
                  </p>
                  <span
                    style={{
                      marginTop: "auto",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--orange-700)",
                    }}
                  >
                    Enter dashboard <ArrowRight size={13} strokeWidth={2.4} />
                  </span>
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: 10.5, color: "var(--stone-500)", marginTop: 18, lineHeight: 1.5 }}>
            Authentication is mocked for this prototype — no credentials are collected. {meta.disclaimer}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "space-between",
            marginTop: 14,
            fontSize: 11,
            color: "var(--stone-500)",
          }}
        >
          <span>
            {meta.problem_statement.id} · {meta.problem_statement.title} ·{" "}
            {meta.problem_statement.organization}
          </span>
          <span>Data as on {formatDate(meta.report_date)}</span>
        </div>
      </div>
    </main>
  );
}
