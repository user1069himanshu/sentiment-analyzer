"use client";

import { useState, type ReactNode } from "react";
import type { AnalysisResult } from "@/lib/types";
import { riskBadge, sentimentBadge, titleCase } from "@/lib/ui";
import { EmotionChart, SentimentTimeline } from "@/components/Charts";
import SentenceList from "@/components/SentenceList";
import InfoTip from "@/components/InfoTip";

type Tab = "summary" | "analytics" | "transcript";

/* ─────────────────────────── KPI hover definitions ─────────────────────── */
const DEFS = {
  overall:    "The model's chain-of-thought justification for its sentiment verdict — why this call scored Positive, Negative, or Neutral.",
  summary:    "A 1–2 sentence recap of the call, plus the key topics that were discussed.",
  sentences:  "Every utterance with its individual sentiment label and detected emotion.",
  timeline:   "Each point is one sentence's sentiment score (−1 to +1), in order, showing how tone moved through the call.",
  emotions:   "The share of each detected emotion across all sentences, based on Plutchik's 10-emotion model.",
  csat:       "Satisfaction Index: an estimated 0–100 score of how satisfied the customer felt, inferred from tone and resolution.",
  empathy:    "Empathy Quotient: how well the agent acknowledged the customer's feelings, apologized, and followed through — scored 0–100.",
  trend:      "Tone Trajectory: whether the emotional tone improved, declined, or stayed flat between the first and second half of the call.",
  resolution: "FCR Status (First Contact Resolution): whether the customer's issue ended resolved, partially resolved, or unresolved.",
  churn:      "Churn Risk: likelihood the customer may leave, based on their sentiment and whether their issue was resolved.",
  escalation: "Escalation Signal: likelihood the call needs a supervisor, based on negative emotion and lack of resolution.",
  agentSent:  "Agent Pulse: the average sentiment across all of the agent's messages.",
  customerSent: "Customer Pulse: the average sentiment across all of the customer's messages.",
  nps:        "Net Promoter Signal: a −100 to +100 loyalty measure. Positive lines count as 'promoters', negative ones as 'detractors'.",
  compliance: "Protocol Adherence: did the agent greet, empathize, offer a resolution, resolve, and close politely? Each step worth 20 pts.",
  intensity:  "Peak Intensity: the magnitude of the most negative single moment in the call (0–100).",
  interruption: "Overtalk Risk: a proxy for cross-talk — flags frequent, rapid speaker switching combined with negative tone.",
  phase:      "Conversation Arc: the dominant sentiment in each third of the call — opening, middle, and closing.",
  talkListen: "Voice Share: the share of the conversation spoken by each party. Industry benchmark: Agent ~57% / Customer ~43% (Gong).",
  quality:    "Quality Scorecard: at-a-glance bars. Green ≥70 is healthy, amber 40–69 is mixed, red <40 needs attention.",
  silence:    "Engagement Depth: substantive conversation ratio vs. dead air or filler. Higher = more substantive exchange.",
} as const;

/* ─────────────────────────── Main component ─────────────────────────── */
export default function Results({
  result,
  fileName,
  onReset,
}: {
  result: AnalysisResult;
  fileName: string | null;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<Tab>("summary");
  const { overall, kpis, emotions, sentences, summary, meta } = result;

  const accentColor =
    overall.sentiment === "Positive" ? "var(--positive)" :
    overall.sentiment === "Negative" ? "var(--negative)" : "var(--neutral)";

  const sentimentEmoji =
    overall.sentiment === "Positive" ? "😊" :
    overall.sentiment === "Negative" ? "😠" : "😐";

  return (
    <div className="flex flex-col gap-3">

      {/* ── Compact banner ── */}
      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}
            >
              {sentimentEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold">{overall.sentiment} call</h1>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                    color: accentColor,
                  }}
                >
                  {Math.round(overall.confidence * 100)}% confidence
                </span>
              </div>
              <p className="text-xs text-muted">
                Score <strong>{overall.score.toFixed(2)}</strong> &nbsp;·&nbsp;
                {fileName ?? "conversation"} &nbsp;·&nbsp;
                {meta.sentence_count} utterances &nbsp;·&nbsp;
                <span className="font-mono">{meta.model}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="rounded-lg border border-border bg-card/80 px-3 py-1.5 text-xs font-medium transition hover:bg-card"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex rounded-xl border border-border bg-card p-1 gap-1">
        {(["summary", "analytics", "transcript"] as Tab[]).map((t, i) => {
          const labels = ["📋 Summary", "📊 Analytics", "💬 Transcript"];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                tab === t
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {labels[i]}
            </button>
          );
        })}
      </div>

      {/* ══════════════ TAB: SUMMARY ══════════════ */}
      {tab === "summary" && (
        <div className="grid gap-3">
          {/* Verdict Rationale + Call Summary */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <SectionLabel help={DEFS.overall}>
                <span className="mr-1.5">🧠</span> Verdict Rationale
              </SectionLabel>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {overall.reasoning}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 md:col-span-2">
              <SectionLabel help={DEFS.summary}>
                <span className="mr-1.5">📋</span> Call Summary
              </SectionLabel>
              <p className="mt-2 text-sm leading-relaxed">{summary}</p>
              {kpis.key_topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {kpis.key_topics.map((t) => (
                    <span key={t} className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand capitalize">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 8 Core KPIs in 2 rows of 4 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi      icon="⭐" label="Satisfaction Index"  value={`${kpis.csat_proxy}`}                              suffix="/100" help={DEFS.csat} />
            <Kpi      icon="📣" label="Net Promoter Signal" value={`${kpis.nps_proxy > 0 ? "+" : ""}${kpis.nps_proxy}`} suffix="/100" help={DEFS.nps} />
            <KpiBadge icon="🔒" label="Churn Risk"          text={titleCase(kpis.churn_risk)}       className={riskBadge(kpis.churn_risk)}      help={DEFS.churn} />
            <KpiBadge icon="✅" label="FCR Status"          text={titleCase(kpis.resolution)}                                                    help={DEFS.resolution} />
            <Kpi      icon="🤝" label="Empathy Quotient"    value={`${kpis.empathy_score}`}                            suffix="/100" help={DEFS.empathy} />
            <Kpi      icon="📋" label="Protocol Adherence"  value={`${kpis.agent_compliance}`}                         suffix="/100" help={DEFS.compliance} />
            <KpiBadge icon="🎙️" label="Agent Pulse"         text={kpis.agent_sentiment ?? "—"}   className={kpis.agent_sentiment ? sentimentBadge(kpis.agent_sentiment) : ""}    help={DEFS.agentSent} />
            <KpiBadge icon="💬" label="Customer Pulse"      text={kpis.customer_sentiment ?? "—"} className={kpis.customer_sentiment ? sentimentBadge(kpis.customer_sentiment) : ""} help={DEFS.customerSent} />
          </div>
        </div>
      )}

      {/* ══════════════ TAB: ANALYTICS ══════════════ */}
      {tab === "analytics" && (
        <div className="grid gap-3">
          {/* Charts */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <ChartTitle help={DEFS.timeline}><span className="mr-1.5">📈</span> Emotional Journey</ChartTitle>
              <SentimentTimeline sentences={sentences} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <ChartTitle help={DEFS.emotions}><span className="mr-1.5">🎭</span> Emotion Fingerprint</ChartTitle>
              <EmotionChart emotions={emotions} />
            </div>
          </div>

          {/* Conversation Arc */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <SectionLabel help={DEFS.phase}>
              <span className="mr-1.5">🌊</span> Conversation Arc
            </SectionLabel>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {(["opening", "middle", "closing"] as const).map((phase, i) => {
                const icons = ["🌅", "⚙️", "🏁"];
                return (
                  <div key={phase} className="rounded-xl border border-border p-3 text-center">
                    <p className="text-xs text-muted mb-1">{icons[i]} {titleCase(phase)}</p>
                    <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${sentimentBadge(kpis.call_phase_sentiment[phase])}`}>
                      {kpis.call_phase_sentiment[phase]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Share + Quality Scorecard */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <SectionLabel help={DEFS.talkListen}>
                <span className="mr-1.5">⚖️</span> Voice Share
              </SectionLabel>
              <div className="mt-3 space-y-2">
                {(["agent", "customer"] as const).map((role) => {
                  const pct = kpis.talk_listen_ratio[role];
                  return (
                    <div key={role}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium capitalize">{role}</span>
                        <span className="font-semibold text-muted">{pct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: role === "agent" ? "var(--brand)" : "var(--positive)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted">Benchmark: Agent ~57% / Customer ~43% (Gong)</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <SectionLabel help={DEFS.quality}>
                <span className="mr-1.5">🏆</span> Quality Scorecard
              </SectionLabel>
              <div className="mt-3 space-y-3">
                <QualityBar icon="🤝" label="Empathy Quotient"   value={kpis.empathy_score}   help={DEFS.empathy} />
                <QualityBar icon="📋" label="Protocol Adherence" value={kpis.agent_compliance} help={DEFS.compliance} />
                <QualityBar icon="💎" label="Engagement Depth"   value={kpis.silence_score}   help={DEFS.silence} />
              </div>
            </div>
          </div>

          {/* Edge signals */}
          <div className="grid grid-cols-3 gap-3">
            <Kpi      icon="⚡" label="Peak Intensity"  value={`${kpis.emotion_intensity}`}            suffix="/100" help={DEFS.intensity} />
            <KpiBadge icon="🔄" label="Overtalk Risk"   text={titleCase(kpis.interruption_risk)} className={riskBadge(kpis.interruption_risk)} help={DEFS.interruption} />
            <KpiBadge icon="📈" label="Tone Trajectory" text={titleCase(kpis.sentiment_trend)}                                                   help={DEFS.trend} />
          </div>
        </div>
      )}

      {/* ══════════════ TAB: TRANSCRIPT ══════════════ */}
      {tab === "transcript" && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <span>💬</span> Utterance Analysis
            <span className="rounded-full bg-neutral/15 px-2 py-0.5 text-xs font-normal text-muted">
              {sentences.length}
            </span>
          </h2>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <SentenceList sentences={sentences} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function SectionLabel({ children, help }: { children: ReactNode; help: string }) {
  return (
    <div className="flex items-center text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
      <InfoTip text={help} />
    </div>
  );
}

function ChartTitle({ children, help }: { children: ReactNode; help: string }) {
  return (
    <h2 className="mb-3 flex items-center text-sm font-semibold">
      {children}
      <InfoTip text={help} />
    </h2>
  );
}

function Kpi({ icon, label, value, suffix, help }: {
  icon: string; label: string; value: string; suffix?: string; help: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1 text-xs font-medium text-muted">
        <span className="text-base leading-none">{icon}</span>
        {label}
        <InfoTip text={help} />
      </div>
      <p className="mt-1.5 text-2xl font-bold">
        {value}
        {suffix && <span className="ml-0.5 text-sm font-normal text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

function KpiBadge({ icon, label, text, help, className = "bg-neutral/15 text-muted" }: {
  icon: string; label: string; text: string; help: string; className?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1 text-xs font-medium text-muted">
        <span className="text-base leading-none">{icon}</span>
        {label}
        <InfoTip text={help} />
      </div>
      <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-sm font-semibold ${className}`}>
        {text}
      </span>
    </div>
  );
}

function QualityBar({ icon, label, value, help }: {
  icon: string; label: string; value: number; help: string;
}) {
  const color = value >= 70 ? "var(--positive)" : value >= 40 ? "#f59e0b" : "var(--negative)";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 font-medium">
          <span className="text-sm leading-none">{icon}</span>
          {label}
          <InfoTip text={help} />
        </span>
        <span className="font-semibold">
          {value}<span className="ml-0.5 font-normal text-muted">/100</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-border">
        <div className="h-2 rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
