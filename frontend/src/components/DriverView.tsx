"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/types";
import { getDriverEvidence, type DriverKey, type EvidenceItem } from "@/lib/evidence";
import { EMOTION_COLORS, sentimentBadge, titleCase } from "@/lib/ui";

/* ── Sub-components ── */

function SpeakerChip({ speaker }: { speaker: string | null }) {
  if (!speaker) return <span className="text-xs text-muted">—</span>;
  const cls = /agent/i.test(speaker)
    ? "bg-brand/10 text-brand"
    : /customer|client|caller/i.test(speaker)
      ? "bg-positive/10 text-positive"
      : "bg-neutral/15 text-muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${cls}`}>
      {speaker}
    </span>
  );
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-background px-2 py-0.5 font-mono text-xs text-muted">
          #{item.sentence.index + 1}
        </span>
        <SpeakerChip speaker={item.sentence.speaker} />
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(item.sentence.sentiment)}`}>
          {item.sentence.sentiment}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: `${EMOTION_COLORS[item.sentence.emotion]}22`, color: EMOTION_COLORS[item.sentence.emotion] }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: EMOTION_COLORS[item.sentence.emotion] }} />
          {titleCase(item.sentence.emotion)}
        </span>
        <span className="ml-auto text-xs tabular-nums text-muted">
          score {item.sentence.score >= 0 ? "+" : ""}{item.sentence.score.toFixed(2)}
        </span>
      </div>

      <p className="mb-2 text-sm leading-relaxed">{item.sentence.text}</p>

      <div className="flex flex-wrap gap-1.5">
        {item.cues.map((cue, i) => (
          <span
            key={i}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              cue.tone === "positive" ? "bg-positive/10 text-positive" :
              cue.tone === "negative" ? "bg-negative/10 text-negative" :
              "bg-neutral/15 text-muted"
            }`}
          >
            {cue.tone === "positive" ? "✓ " : cue.tone === "negative" ? "✗ " : "• "}
            {cue.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function DriverView({ driverKey }: { driverKey: DriverKey }) {
  const [result, setResult]     = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw  = sessionStorage.getItem("sa_draft_result");
      const name = sessionStorage.getItem("sa_draft_filename");
      if (raw)  setResult(JSON.parse(raw));
      if (name) setFileName(name);
    } catch {}
  }, []);

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-4xl">🔍</p>
        <p className="text-sm font-medium">No analysis found</p>
        <p className="text-xs text-muted">Analyze a call first, then return here.</p>
        <Link
          href="/dashboard"
          className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          ← Go to Analyzer
        </Link>
      </div>
    );
  }

  const driver = getDriverEvidence(driverKey, result.sentences, result.kpis);

  const verdictColorVar =
    driver.verdictColor === "positive" ? "var(--positive)" :
    driver.verdictColor === "amber"    ? "#f59e0b"          : "var(--negative)";

  /* Display label for the score:
     - Churn uses "risk level" (Low/Medium/High) — the numeric 0-100 isn't meaningful
     - Other drivers use the raw 0-100 score */
  const displayScore =
    driverKey === "churn" ? titleCase(result.kpis.churn_risk) : `${driver.value}`;
  const displayUnit =
    driverKey === "churn" ? "" : "/100";

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">

      {/* ── Header / breadcrumb ── */}
      <div className="shrink-0 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-background"
        >
          ← Back to Analysis
        </Link>
        <span className="text-xs text-muted">
          {fileName ?? "conversation"} · {result.meta.sentence_count} utterances
        </span>
      </div>

      {/* ── Headline metric card ── */}
      <div
        className="shrink-0 rounded-2xl px-5 py-4"
        style={{
          background: `color-mix(in srgb, ${verdictColorVar} 8%, transparent)`,
          border:     `1px solid color-mix(in srgb, ${verdictColorVar} 28%, transparent)`,
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-end gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{ background: `color-mix(in srgb, ${verdictColorVar} 18%, transparent)` }}
            >
              {driver.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {driver.title}
              </p>
              <p className="-mt-0.5 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight" style={{ color: verdictColorVar }}>
                  {displayScore}
                </span>
                {displayUnit && <span className="text-lg text-muted">{displayUnit}</span>}
                <span
                  className="ml-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: `color-mix(in srgb, ${verdictColorVar} 15%, transparent)`, color: verdictColorVar }}
                >
                  {driver.rating}
                </span>
              </p>
            </div>
          </div>
          <p className="max-w-md text-right text-sm text-muted">{driver.oneLine}</p>
        </div>

        {/* progress bar (skip for churn — it's a risk level, not a quality score) */}
        {driverKey !== "churn" && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${driver.value}%`, background: verdictColorVar }}
            />
          </div>
        )}
      </div>

      {/* ── Derivation checklist ── */}
      <div className="shrink-0 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">🧮 How this was calculated</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {driver.checklist.map((c, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3 ${
                c.passed
                  ? "border-positive/30 bg-positive/5"
                  : "border-negative/30 bg-negative/5"
              }`}
            >
              <div className="mb-0.5 flex items-center gap-1.5 text-sm font-semibold">
                <span className={c.passed ? "text-positive" : "text-negative"}>
                  {c.passed ? "✓" : "✗"}
                </span>
                {c.label}
              </div>
              <p className="text-xs text-muted">{c.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Evidence (positive) ── */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            🎯 Driving Evidence
            <span className="ml-2 rounded-full bg-neutral/15 px-2 py-0.5 text-xs font-normal text-muted">
              {driver.evidence.length}
            </span>
          </h2>
          <p className="text-xs text-muted">
            {driverKey === "churn"
              ? "Sentences signaling defection risk"
              : "Sentences that contributed to this score"}
          </p>
        </div>

        {driver.evidence.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/40 py-8 text-center text-sm text-muted">
            No evidence sentences surfaced — score is derived from aggregate signals only.
          </div>
        ) : (
          <div className="space-y-2">
            {driver.evidence.map((item) => (
              <EvidenceCard key={item.sentence.index} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── Counter-evidence ── */}
      {driver.counterEvidence.length > 0 && (
        <div className="rounded-2xl border border-negative/25 bg-negative/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-negative">
              ⚠️ Counter-Evidence
              <span className="ml-2 rounded-full bg-negative/10 px-2 py-0.5 text-xs font-normal text-negative">
                {driver.counterEvidence.length}
              </span>
            </h2>
            <p className="text-xs text-muted">
              {driverKey === "engagement"
                ? "Filler / very short utterances that drag the score down"
                : "Sentences that worked against this score"}
            </p>
          </div>
          <div className="space-y-2">
            {driver.counterEvidence.map((item) => (
              <EvidenceCard key={item.sentence.index} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* ── Cross-link footer ── */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs">
        <span className="text-muted">Explore further:</span>
        <Link href="/dashboard/sentences/sentiment" className="rounded-full border border-border px-3 py-1 font-medium transition hover:border-brand hover:text-brand">
          💬 All sentences
        </Link>
        {driverKey !== "empathy" && (
          <Link href="/dashboard/drivers/empathy" className="rounded-full border border-border px-3 py-1 font-medium transition hover:border-brand hover:text-brand">
            🤝 Empathy
          </Link>
        )}
        {driverKey !== "adherence" && (
          <Link href="/dashboard/drivers/adherence" className="rounded-full border border-border px-3 py-1 font-medium transition hover:border-brand hover:text-brand">
            📋 Adherence
          </Link>
        )}
        {driverKey !== "engagement" && (
          <Link href="/dashboard/drivers/engagement" className="rounded-full border border-border px-3 py-1 font-medium transition hover:border-brand hover:text-brand">
            💎 Engagement
          </Link>
        )}
        {driverKey !== "churn" && (
          <Link href="/dashboard/drivers/churn" className="rounded-full border border-border px-3 py-1 font-medium transition hover:border-brand hover:text-brand">
            🔒 Churn risk
          </Link>
        )}
      </div>
    </div>
  );
}
