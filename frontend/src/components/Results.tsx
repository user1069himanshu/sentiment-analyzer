"use client";

import type { AnalysisResult } from "@/lib/types";
import { riskBadge, sentimentBadge, titleCase } from "@/lib/ui";
import { EmotionChart, SentimentTimeline } from "@/components/Charts";
import SentenceList from "@/components/SentenceList";

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

  return (
    <div className="space-y-6">
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

      {/* Headline + summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Overall sentiment
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-lg font-semibold ${sentimentBadge(
                overall.sentiment
              )}`}
            >
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Conversation summary
          </p>
          <p className="mt-2 text-sm leading-relaxed">{summary}</p>
          {kpis.key_topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {kpis.key_topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="CSAT (proxy)" value={`${kpis.csat_proxy}`} suffix="/100" />
        <Kpi label="Empathy" value={`${kpis.empathy_score}`} suffix="/100" />
        <KpiBadge label="Sentiment trend" text={titleCase(kpis.sentiment_trend)} />
        <KpiBadge
          label="Resolution"
          text={titleCase(kpis.resolution)}
        />
        <KpiBadge
          label="Churn risk"
          text={titleCase(kpis.churn_risk)}
          className={riskBadge(kpis.churn_risk)}
        />
        <KpiBadge
          label="Escalation risk"
          text={titleCase(kpis.escalation_risk)}
          className={riskBadge(kpis.escalation_risk)}
        />
        <KpiBadge
          label="Agent sentiment"
          text={kpis.agent_sentiment ?? "—"}
          className={kpis.agent_sentiment ? sentimentBadge(kpis.agent_sentiment) : ""}
        />
        <KpiBadge
          label="Customer sentiment"
          text={kpis.customer_sentiment ?? "—"}
          className={kpis.customer_sentiment ? sentimentBadge(kpis.customer_sentiment) : ""}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Sentiment over the call</h2>
          <SentimentTimeline sentences={sentences} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Emotion distribution</h2>
          <EmotionChart emotions={emotions} />
        </div>
      </div>

      {/* Sentence-level */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Sentence-level sentiment</h2>
        <SentenceList sentences={sentences} />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
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
  className = "bg-neutral/15 text-muted",
}: {
  label: string;
  text: string;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <span
        className={`mt-2 inline-block rounded-full px-2.5 py-1 text-sm font-semibold ${className}`}
      >
        {text}
      </span>
    </div>
  );
}
