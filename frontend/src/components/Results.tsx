"use client";

import { type ReactNode } from "react";
import type { AnalysisResult } from "@/lib/types";
import { riskBadge, sentimentBadge, titleCase } from "@/lib/ui";
import { EmotionChart, SentimentTimeline } from "@/components/Charts";
import SentenceList from "@/components/SentenceList";
import InfoTip from "@/components/InfoTip";

/* ─────────────────────────── Definitions ─────────────────────────── */
const DEFS = {
  overall:      "The model's chain-of-thought justification for its sentiment verdict.",
  summary:      "A concise recap of the call plus the key topics discussed.",
  sentences:    "Every utterance with its individual sentiment label and detected emotion.",
  timeline:     "Sentiment score (−1 to +1) per utterance, in order — shows how tone evolved.",
  emotions:     "Share of each detected emotion across all utterances (Plutchik 10-emotion model).",
  csat:         "Satisfaction Index: 0–100 estimate of customer satisfaction from tone + resolution.",
  empathy:      "Empathy Quotient: agent acknowledgement, apology, and follow-through — 0–100.",
  trend:        "Tone Trajectory: did sentiment improve, decline, or stay flat overall?",
  resolution:   "FCR Status: First Contact Resolution — resolved, partial, or unresolved.",
  churn:        "Churn Risk: likelihood of customer defection based on sentiment and resolution.",
  escalation:   "Escalation Signal: probability the call needed a supervisor.",
  agentSent:    "Agent Pulse: net emotional tone across all agent utterances.",
  customerSent: "Customer Pulse: net emotional tone across all customer utterances.",
  nps:          "Net Promoter Signal: −100 to +100 loyalty measure from promoter/detractor ratio.",
  compliance:   "Protocol Adherence: greet + empathize + resolve + close — each step worth 20 pts.",
  intensity:    "Peak Intensity: magnitude of the most negative single moment (0–100).",
  interruption: "Overtalk Risk: rapid speaker switching combined with negative tone.",
  phase:        "Conversation Arc: dominant sentiment in each third — opening, middle, closing.",
  talkListen:   "Voice Share: speaking balance per party. Benchmark: Agent ~57% / Customer ~43% (Gong).",
  quality:      "Quality Scorecard: visual bars — green ≥70, amber 40–69, red <40.",
  silence:      "Engagement Depth: substantive exchange ratio vs. dead air or filler.",
} as const;

/* ─────────────────────────── Main ─────────────────────────── */
export default function Results({
  result,
  fileName,
  onReset,
}: {
  result: AnalysisResult;
  fileName: string | null;
  onReset: () => void;
}) {
  const { overall, kpis, emotions, sentences, summary, meta } = result;

  const accentColor =
    overall.sentiment === "Positive" ? "var(--positive)" :
    overall.sentiment === "Negative" ? "var(--negative)" : "var(--neutral)";

  const sentimentEmoji =
    overall.sentiment === "Positive" ? "😊" :
    overall.sentiment === "Negative" ? "😠" : "😐";

  return (
    <div className="flex h-full flex-col gap-3">

      {/* ── Compact banner ── */}
      <div
        className="shrink-0 rounded-2xl px-4 py-2.5"
        style={{
          background: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}
            >
              {sentimentEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{overall.sentiment} call</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor }}
                >
                  {Math.round(overall.confidence * 100)}% confidence
                </span>
                <span className="text-xs text-muted">
                  Score <strong>{overall.score.toFixed(2)}</strong>
                  &nbsp;·&nbsp;{fileName ?? "conversation"}
                  &nbsp;·&nbsp;{meta.sentence_count} utterances
                  &nbsp;·&nbsp;<span className="font-mono">{meta.model}</span>
                </span>
              </div>
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

      {/* ── Two-column body ── */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">

        {/* ═══════ LEFT: Summary + KPIs + Transcript ═══════ */}
        <div className="flex flex-col gap-3 overflow-y-auto">

          {/* Verdict Rationale + Call Summary */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-3.5">
              <SectionLabel help={DEFS.overall}>🧠 Verdict Rationale</SectionLabel>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">{overall.reasoning}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3.5">
              <SectionLabel help={DEFS.summary}>📋 Call Summary</SectionLabel>
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

          {/* ── KPI Grid — 3 tiers of importance ── */}
          <div className="grid grid-cols-4 gap-2.5">

            {/* TIER 1 — Headline metrics (col-span-2, large numbers) */}
            <div className="col-span-2 rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-1 text-xs font-medium text-muted">
                <span className="text-sm">⭐</span> Satisfaction Index <InfoTip text={DEFS.csat} />
              </div>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {kpis.csat_proxy}
                <span className="ml-1 text-base font-normal text-muted">/100</span>
              </p>
            </div>

            <div className="col-span-2 rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-1 text-xs font-medium text-muted">
                <span className="text-sm">📣</span> Net Promoter Signal <InfoTip text={DEFS.nps} />
              </div>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {kpis.nps_proxy > 0 ? "+" : ""}{kpis.nps_proxy}
                <span className="ml-1 text-base font-normal text-muted">/100</span>
              </p>
            </div>

            {/* TIER 2 — Operational KPIs (col-span-1, normal) */}
            <KpiBadge icon="🔒" label="Churn Risk"      text={titleCase(kpis.churn_risk)}       className={riskBadge(kpis.churn_risk)}      help={DEFS.churn} />
            <KpiBadge icon="✅" label="FCR Status"      text={titleCase(kpis.resolution)}                                                    help={DEFS.resolution} />
            <Kpi      icon="🤝" label="Empathy"         value={`${kpis.empathy_score}`}         suffix="/100" help={DEFS.empathy} />
            <Kpi      icon="📋" label="Adherence"       value={`${kpis.agent_compliance}`}      suffix="/100" help={DEFS.compliance} />

            {/* TIER 3 — Directional signals (col-span-2, horizontal badge layout) */}
            <KpiHorizontal icon="🎙️" label="Agent Pulse"    text={kpis.agent_sentiment ?? "—"}   className={kpis.agent_sentiment   ? sentimentBadge(kpis.agent_sentiment)   : "bg-neutral/15 text-muted"} help={DEFS.agentSent} />
            <KpiHorizontal icon="💬" label="Customer Pulse" text={kpis.customer_sentiment ?? "—"} className={kpis.customer_sentiment ? sentimentBadge(kpis.customer_sentiment) : "bg-neutral/15 text-muted"} help={DEFS.customerSent} />
          </div>

          {/* Transcript — fills remaining height */}
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card p-3.5">
            <h2 className="mb-2 flex shrink-0 items-center gap-1.5 text-sm font-semibold">
              💬 Utterance Analysis
              <span className="rounded-full bg-neutral/15 px-2 py-0.5 text-xs font-normal text-muted">
                {sentences.length}
              </span>
              <InfoTip text={DEFS.sentences} />
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SentenceList sentences={sentences} />
            </div>
          </div>
        </div>

        {/* ═══════ RIGHT: Analytics ═══════ */}
        <div className="flex flex-col gap-3 overflow-y-auto">

          {/* Charts */}
          <div className="rounded-2xl border border-border bg-card p-3.5">
            <ChartTitle help={DEFS.timeline}>📈 Emotional Journey</ChartTitle>
            <SentimentTimeline sentences={sentences} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-3.5">
            <ChartTitle help={DEFS.emotions}>🎭 Emotion Fingerprint</ChartTitle>
            <EmotionChart emotions={emotions} />
          </div>

          {/* Conversation Arc */}
          <div className="rounded-2xl border border-border bg-card p-3.5">
            <SectionLabel help={DEFS.phase}>🌊 Conversation Arc</SectionLabel>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {(["opening", "middle", "closing"] as const).map((phase, i) => (
                <div key={phase} className="rounded-xl border border-border p-2.5 text-center">
                  <p className="text-xs text-muted mb-1">{["🌅","⚙️","🏁"][i]} {titleCase(phase)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(kpis.call_phase_sentiment[phase])}`}>
                    {kpis.call_phase_sentiment[phase]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Share + Quality Scorecard */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-3.5">
              <SectionLabel help={DEFS.talkListen}>⚖️ Voice Share</SectionLabel>
              <div className="mt-2.5 space-y-2">
                {(["agent", "customer"] as const).map((role) => {
                  const pct = kpis.talk_listen_ratio[role];
                  return (
                    <div key={role}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium capitalize">{role}</span>
                        <span className="font-semibold text-muted">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: role === "agent" ? "var(--brand)" : "var(--positive)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted">~57/43 benchmark (Gong)</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5">
              <SectionLabel help={DEFS.quality}>🏆 Quality Scorecard</SectionLabel>
              <div className="mt-2.5 space-y-2.5">
                <QualityBar icon="🤝" label="Empathy"    value={kpis.empathy_score}   help={DEFS.empathy} />
                <QualityBar icon="📋" label="Adherence"  value={kpis.agent_compliance} help={DEFS.compliance} />
                <QualityBar icon="💎" label="Engagement" value={kpis.silence_score}   help={DEFS.silence} />
              </div>
            </div>
          </div>

          {/* Edge signals */}
          <div className="grid grid-cols-3 gap-2.5">
            <Kpi      icon="⚡" label="Peak Intensity" value={`${kpis.emotion_intensity}`}           suffix="/100" help={DEFS.intensity} />
            <KpiBadge icon="🔄" label="Overtalk Risk"  text={titleCase(kpis.interruption_risk)} className={riskBadge(kpis.interruption_risk)} help={DEFS.interruption} />
            <KpiBadge icon="📈" label="Tone Trajectory" text={titleCase(kpis.sentiment_trend)}                                                  help={DEFS.trend} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function SectionLabel({ children, help }: { children: ReactNode; help: string }) {
  return (
    <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
      <InfoTip text={help} />
    </div>
  );
}

function ChartTitle({ children, help }: { children: ReactNode; help: string }) {
  return (
    <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold">
      {children}
      <InfoTip text={help} />
    </h2>
  );
}

/** Medium KPI — numeric value */
function Kpi({ icon, label, value, suffix, help }: {
  icon: string; label: string; value: string; suffix?: string; help: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-0.5 text-xs font-medium text-muted">
        <span className="text-sm leading-none">{icon}</span>
        <span className="truncate">{label}</span>
        <InfoTip text={help} />
      </div>
      <p className="mt-1 text-xl font-bold">
        {value}
        {suffix && <span className="ml-0.5 text-xs font-normal text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

/** Medium KPI — badge value */
function KpiBadge({ icon, label, text, help, className = "bg-neutral/15 text-muted" }: {
  icon: string; label: string; text: string; help: string; className?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-0.5 text-xs font-medium text-muted">
        <span className="text-sm leading-none">{icon}</span>
        <span className="truncate">{label}</span>
        <InfoTip text={help} />
      </div>
      <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
        {text}
      </span>
    </div>
  );
}

/** Tier-3 KPI — horizontal: label on left, badge on right (col-span-2) */
function KpiHorizontal({ icon, label, text, help, className = "bg-neutral/15 text-muted" }: {
  icon: string; label: string; text: string; help: string; className?: string;
}) {
  return (
    <div className="col-span-2 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-2.5">
      <div className="flex items-center gap-1 text-xs font-medium text-muted">
        <span className="text-sm leading-none">{icon}</span>
        {label}
        <InfoTip text={help} />
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
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
          <span className="leading-none">{icon}</span>{label}<InfoTip text={help} />
        </span>
        <span className="font-semibold tabular-nums">{value}<span className="font-normal text-muted">/100</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
