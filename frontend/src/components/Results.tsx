"use client";

import { useState, type ReactNode } from "react";
import type { AnalysisResult } from "@/lib/types";
import { riskBadge, sentimentBadge, titleCase } from "@/lib/ui";
import { EmotionChart, SentimentTimeline } from "@/components/Charts";
import SentenceList from "@/components/SentenceList";
import InfoTip from "@/components/InfoTip";

// Plain-language definition of every metric, surfaced on hover.
const DEFS = {
  overall:
    "The net emotional tone of the whole conversation, with the model's confidence and a short reasoning for the verdict.",
  summary:
    "A 1–2 sentence recap of the call, plus the key topics that were discussed.",
  sentences:
    "Every sentence with its individual sentiment label and detected emotion (the colored dot).",
  timeline:
    "Each point is one sentence's sentiment score (−1 to +1), in order, showing how tone moved through the call.",
  emotions:
    "The share of each detected emotion across all sentences, based on Plutchik's 10-emotion model.",
  csat:
    "Customer Satisfaction (proxy): an estimated 0–100 score of how satisfied the customer felt, inferred from tone and whether their issue was resolved. Stands in for a post-call survey.",
  empathy:
    "How well the agent acknowledged the customer's feelings, apologized, and followed through — scored 0–100.",
  trend:
    "Whether the emotional tone improved, declined, or stayed flat between the first and second half of the call.",
  resolution:
    "Whether the customer's issue ended resolved, partially resolved, or unresolved — a first-call-resolution proxy.",
  churn:
    "Likelihood the customer may leave, based on their sentiment and whether their issue was resolved.",
  escalation:
    "Likelihood the call needs a supervisor, based on negative emotion and lack of resolution.",
  agentSent: "The average sentiment across all of the agent's messages.",
  customerSent: "The average sentiment across all of the customer's messages.",
  nps:
    "Net Promoter Score (proxy): a −100 to +100 loyalty measure. Very positive customer lines count as 'promoters', negative ones as 'detractors': (promoters − detractors) ÷ total.",
  compliance:
    "Script adherence: did the agent greet, empathize, offer a resolution, resolve the issue, and close politely? Each step is worth 20 points.",
  intensity:
    "The magnitude of the most negative single moment in the call (0–100). Higher means a sharper emotional low point.",
  interruption:
    "A proxy for people talking over each other — flags frequent, rapid speaker switching combined with a negative tone.",
  phase:
    "The dominant sentiment in each third of the call — opening, middle, and closing — showing how the mood evolved.",
  talkListen:
    "The share of the conversation spoken by each party, by sentence count. Industry benchmark is roughly 57% agent / 43% customer (Gong).",
  quality:
    "At-a-glance call quality bars. Green ≥70 is healthy, amber 40–69 is mixed, red <40 needs attention.",
  silence:
    "A proxy for substantive conversation vs. dead air or filler. Higher means a more substantive exchange.",
} as const;

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
  const [showAllSentences, setShowAllSentences] = useState(false);
  const PREVIEW = 5;
  const visibleSentences = showAllSentences ? sentences : sentences.slice(0, PREVIEW);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analysis results</h1>
          <p className="text-sm text-muted">
            {fileName ?? "conversation"} · {meta.sentence_count} sentences ·{" "}
            <span className="font-mono">{meta.source}</span> · {meta.model}
          </p>
        </div>
        <button
          onClick={onReset}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-card"
        >
          Analyze another
        </button>
      </div>

      {/* Overall + summary (core required output) */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <SectionLabel help={DEFS.overall}>Overall sentiment</SectionLabel>
          <div className="mt-2 flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-lg font-semibold ${sentimentBadge(overall.sentiment)}`}>
              {overall.sentiment}
            </span>
            <span className="text-sm text-muted">
              score {overall.score.toFixed(2)} · {Math.round(overall.confidence * 100)}% conf.
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {overall.reasoning}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
          <SectionLabel help={DEFS.summary}>Conversation summary</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed">{summary}</p>
          {kpis.key_topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {kpis.key_topics.map((t) => (
                <span key={t} className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sentence-level sentiment — preview first 5, expand for the rest */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center text-sm font-semibold">
          Sentence-level sentiment
          <span className="ml-2 rounded-full bg-neutral/15 px-2 py-0.5 text-xs font-normal text-muted">
            {sentences.length}
          </span>
          <InfoTip text={DEFS.sentences} />
        </h2>
        <div className={showAllSentences ? "max-h-[520px] overflow-y-auto pr-1" : ""}>
          <SentenceList sentences={visibleSentences} />
        </div>
        {sentences.length > PREVIEW && (
          <button
            onClick={() => setShowAllSentences((v) => !v)}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-brand transition hover:opacity-80"
            aria-expanded={showAllSentences}
          >
            {showAllSentences
              ? "Show less"
              : `Show all ${sentences.length} sentences`}
            <svg
              className={`h-4 w-4 transition-transform ${showAllSentences ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Visual overview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <ChartTitle help={DEFS.timeline}>Sentiment over the call</ChartTitle>
          <SentimentTimeline sentences={sentences} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <ChartTitle help={DEFS.emotions}>Emotion distribution</ChartTitle>
          <EmotionChart emotions={emotions} />
        </div>
      </div>

      {/* Core KPIs (the originally-defined / required metrics) */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground/90">Core sentiment KPIs</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi label="CSAT (proxy)" value={`${kpis.csat_proxy}`} suffix="/100" help={DEFS.csat} />
          <Kpi label="Empathy" value={`${kpis.empathy_score}`} suffix="/100" help={DEFS.empathy} />
          <KpiBadge label="Sentiment trend" text={titleCase(kpis.sentiment_trend)} help={DEFS.trend} />
          <KpiBadge label="Resolution" text={titleCase(kpis.resolution)} help={DEFS.resolution} />
          <KpiBadge label="Churn risk" text={titleCase(kpis.churn_risk)} className={riskBadge(kpis.churn_risk)} help={DEFS.churn} />
          <KpiBadge label="Escalation risk" text={titleCase(kpis.escalation_risk)} className={riskBadge(kpis.escalation_risk)} help={DEFS.escalation} />
          <KpiBadge label="Agent sentiment" text={kpis.agent_sentiment ?? "—"} className={kpis.agent_sentiment ? sentimentBadge(kpis.agent_sentiment) : ""} help={DEFS.agentSent} />
          <KpiBadge label="Customer sentiment" text={kpis.customer_sentiment ?? "—"} className={kpis.customer_sentiment ? sentimentBadge(kpis.customer_sentiment) : ""} help={DEFS.customerSent} />
        </div>
      </section>

      {/* Advanced KPIs (the additional metrics we defined) */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          Advanced call analytics
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            extended
          </span>
        </h2>

        {/* 1. NPS + Agent compliance — top business outcomes */}
        <div className="grid grid-cols-2 gap-4">
          <Kpi label="NPS (proxy)" value={`${kpis.nps_proxy > 0 ? "+" : ""}${kpis.nps_proxy}`} suffix="/100" help={DEFS.nps} />
          <Kpi label="Agent compliance" value={`${kpis.agent_compliance}`} suffix="/100" help={DEFS.compliance} />
        </div>

        {/* 2. Call phase sentiment — narrative arc */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <SectionLabel help={DEFS.phase}>Call phase sentiment</SectionLabel>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {(["opening", "middle", "closing"] as const).map((phase) => (
              <div key={phase} className="rounded-xl border border-border p-3 text-center">
                <p className="text-xs text-muted mb-1">{titleCase(phase)}</p>
                <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${sentimentBadge(kpis.call_phase_sentiment[phase])}`}>
                  {kpis.call_phase_sentiment[phase]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Talk/listen ratio + quality bars — coaching signals */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <SectionLabel help={DEFS.talkListen}>Talk / listen ratio</SectionLabel>
            <div className="mt-3 space-y-2">
              {(["agent", "customer"] as const).map((role) => {
                const pct = kpis.talk_listen_ratio[role];
                return (
                  <div key={role}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{titleCase(role)}</span>
                      <span className="text-muted">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: role === "agent" ? "var(--brand)" : "var(--positive)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              Industry benchmark: Agent ~57% / Customer ~43% (Gong)
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <SectionLabel help={DEFS.quality}>Call quality indicators</SectionLabel>
            <div className="mt-3 space-y-3">
              <QualityBar label="Empathy score" value={kpis.empathy_score} help={DEFS.empathy} />
              <QualityBar label="Agent compliance" value={kpis.agent_compliance} help={DEFS.compliance} />
              <QualityBar label="Silence score" value={kpis.silence_score} help={DEFS.silence} />
            </div>
          </div>
        </div>

        {/* 4. Emotion intensity + interruption risk — edge signals, least critical */}
        <div className="grid grid-cols-2 gap-4">
          <Kpi label="Emotion intensity" value={`${kpis.emotion_intensity}`} suffix="/100" help={DEFS.intensity} />
          <KpiBadge label="Interruption risk" text={titleCase(kpis.interruption_risk)} className={riskBadge(kpis.interruption_risk)} help={DEFS.interruption} />
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children, help }: { children: ReactNode; help: string }) {
  return (
    <div className="flex items-center text-xs font-medium uppercase tracking-wide text-muted">
      {children}
      <InfoTip text={help} />
    </div>
  );
}

function ChartTitle({ children, help }: { children: ReactNode; help: string }) {
  return (
    <h2 className="mb-4 flex items-center text-sm font-semibold">
      {children}
      <InfoTip text={help} />
    </h2>
  );
}

function Kpi({
  label,
  value,
  suffix,
  help,
}: {
  label: string;
  value: string;
  suffix?: string;
  help: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center text-xs font-medium text-muted">
        {label}
        <InfoTip text={help} />
      </div>
      <p className="mt-1 text-2xl font-semibold">
        {value}
        {suffix && <span className="text-sm font-normal text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

function KpiBadge({
  label,
  text,
  help,
  className = "bg-neutral/15 text-muted",
}: {
  label: string;
  text: string;
  help: string;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center text-xs font-medium text-muted">
        {label}
        <InfoTip text={help} />
      </div>
      <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-sm font-semibold ${className}`}>
        {text}
      </span>
    </div>
  );
}

function QualityBar({ label, value, help }: { label: string; value: number; help: string }) {
  const color = value >= 70 ? "var(--positive)" : value >= 40 ? "#f59e0b" : "var(--negative)";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center font-medium">
          {label}
          <InfoTip text={help} />
        </span>
        <span className="text-muted">{value}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-border">
        <div className="h-2 rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
