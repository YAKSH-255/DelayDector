"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useScope } from "@/components/RoleProvider";
import { Panel, PrototypeNote } from "@/components/ui";
import { SUGGESTED_PROMPTS, ask } from "@/lib/mock-ai";
import type { AssistantAnswer } from "@/lib/mock-ai";
import { getProject, meta } from "@/lib/data";
import { RISK_META } from "@/lib/analytics";

interface Turn {
  id: number;
  question: string;
  answer: AssistantAnswer;
}

export default function AssistantPage() {
  const { definition } = useScope();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, thinking]);

  const submit = (question: string) => {
    const q = question.trim();
    if (!q || thinking) return;
    setInput("");
    setThinking(true);
    const answer = ask(q);
    counter.current += 1;
    const id = counter.current;
    window.setTimeout(() => {
      setTurns((prev) => [...prev, { id, question: q, answer }]);
      setThinking(false);
    }, 420);
  };

  return (
    <AppShell
      title="AI Project Assistant"
      subtitle="Ask analytical questions about the monitored portfolio — answers are composed from the project records"
    >
      <div className="grid-side">
        <Panel
          elevation="glass"
          bodyClassName=""
          style={{ display: "flex", flexDirection: "column", minHeight: 620 }}
        >
          <div
            className="scroll-area"
            style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, paddingRight: 6 }}
          >
            {turns.length === 0 && <EmptyState onPick={submit} />}

            {turns.map((turn) => (
              <div key={turn.id} style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <div
                    style={{
                      background: "var(--orange-50)",
                      border: "1px solid rgba(232,90,12,.18)",
                      borderRadius: "14px 14px 4px 14px",
                      padding: "9px 14px",
                      fontSize: 13,
                      maxWidth: "76%",
                    }}
                  >
                    {turn.question}
                  </div>
                  <span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                    {definition.initials}
                  </span>
                </div>
                <AnswerCard answer={turn.answer} onFollowUp={submit} />
              </div>
            ))}

            {thinking && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: "var(--stone-500)" }}>
                <span className="brand-mark" style={{ width: 30, height: 30, borderRadius: 10 }}>
                  <Sparkles size={15} strokeWidth={2.2} />
                </span>
                Resolving against the project dataset…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            style={{
              display: "flex",
              gap: 9,
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid var(--sand-200)",
            }}
          >
            <div className="search-box" style={{ flex: 1 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about risk, delays, cost overruns, departments or a specific project…"
                aria-label="Ask the assistant"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-icon" disabled={!input.trim() || thinking} aria-label="Send">
              <ArrowUp size={16} strokeWidth={2.6} />
            </button>
          </form>
          <PrototypeNote>
            Deterministic demo assistant — responses are generated from the local project dataset
            with rule-based templates, not a live language model.
          </PrototypeNote>
        </Panel>

        <div className="stack">
          <Panel title="Suggested questions" subtitle="Click to ask">
            <div style={{ display: "grid", gap: 7 }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="chip"
                  style={{ textAlign: "left", fontSize: 11.5, lineHeight: 1.4 }}
                  onClick={() => submit(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="What it can reason about">
            {[
              "Portfolio status and counts",
              "Delay root cause for any project",
              "Cost and budget overruns",
              "Department benchmarking",
              "Intervention what-if outcomes",
              "State-wise monitoring",
              "Driver attribution and data gaps",
              "Model evaluation design",
            ].map((c) => (
              <div
                key={c}
                style={{
                  fontSize: 11.5,
                  padding: "5px 0",
                  borderBottom: "1px solid var(--sand-200)",
                  color: "var(--ink-700)",
                }}
              >
                {c}
              </div>
            ))}
            <PrototypeNote>
              Built for {meta.problem_statement.id}, which asks for an LLM-enabled project
              intelligence assistant. This prototype demonstrates the interaction with deterministic
              answers so it runs without external services.
            </PrototypeNote>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div style={{ textAlign: "center", padding: "38px 20px", margin: "auto 0" }}>
      <span
        className="brand-mark"
        style={{ width: 46, height: 46, borderRadius: 15, margin: "0 auto 14px" }}
      >
        <Sparkles size={22} strokeWidth={2.2} />
      </span>
      <h2 style={{ fontSize: 18 }}>Ask about any project in the portfolio</h2>
      <p
        style={{
          fontSize: 12.5,
          color: "var(--stone-500)",
          maxWidth: 440,
          margin: "7px auto 18px",
          lineHeight: 1.6,
        }}
      >
        The assistant reads the same monitoring records the dashboard uses, so every figure it
        quotes can be traced back to a project page.
      </p>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center" }}>
        {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
          <button key={p} type="button" className="chip" onClick={() => onPick(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnswerCard({
  answer,
  onFollowUp,
}: {
  answer: AssistantAnswer;
  onFollowUp: (q: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <span
        className="brand-mark"
        style={{ width: 30, height: 30, borderRadius: 10, flex: "none", marginTop: 2 }}
      >
        <Sparkles size={15} strokeWidth={2.2} />
      </span>
      <div className="glass-soft" style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 600, lineHeight: 1.4 }}>
          {answer.headline}
        </div>

        {answer.paragraphs.map((p) => (
          <p key={p.slice(0, 32)} style={{ fontSize: 12.5, lineHeight: 1.65, color: "var(--ink-700)", marginTop: 8 }}>
            {p}
          </p>
        ))}

        {answer.stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(4, answer.stats.length)}, minmax(0,1fr))`,
              gap: 10,
              marginTop: 12,
              padding: "10px 12px",
              background: "rgba(255,255,255,.7)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {answer.stats.map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 10, color: "var(--stone-500)" }}>{s.label}</div>
                <div
                  className="num"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    marginTop: 2,
                    color: s.tone
                      ? RISK_META[s.tone.toUpperCase() as keyof typeof RISK_META].color
                      : undefined,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {answer.table && (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="data">
              <thead>
                <tr>
                  {answer.table.columns.map((c, i) => (
                    <th key={c} style={{ textAlign: i === 0 ? "left" : undefined }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {answer.table.rows.map((row) => (
                  <tr key={String(row[0])} style={{ cursor: "default" }}>
                    {row.map((cell, i) => (
                      <td
                        key={`${row[0]}-${i}`}
                        style={{
                          fontSize: 11.5,
                          fontWeight: i === 0 ? 600 : 400,
                          fontFamily: typeof cell === "number" ? "var(--font-mono)" : undefined,
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {answer.projectRefs && answer.projectRefs.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {answer.projectRefs.map((id) => {
              const p = getProject(id);
              if (!p) return null;
              return (
                <Link key={id} href={`/projects/${id}`} className="chip" style={{ fontSize: 11 }}>
                  <span aria-hidden style={{ color: RISK_META[p.risk_level].color, fontSize: 8 }}>
                    {RISK_META[p.risk_level].glyph}
                  </span>
                  {p.name}
                </Link>
              );
            })}
          </div>
        )}

        {answer.followUps && answer.followUps.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--sand-200)" }}>
            <div className="section-label" style={{ marginBottom: 6 }}>
              Follow up
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {answer.followUps.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="chip"
                  style={{ fontSize: 11 }}
                  onClick={() => onFollowUp(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
