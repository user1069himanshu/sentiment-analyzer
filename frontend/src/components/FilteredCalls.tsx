"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getHistory, isHighRisk, type StoredAnalysis } from "@/lib/history";
import { riskBadge, sentimentBadge } from "@/lib/ui";

/* ── Constants ── */
const SENTIMENT_OPTIONS = ["Positive", "Neutral", "Negative"] as const;
const RESOLUTION_OPTIONS = [
  { label: "Resolved",   key: "resolved"   },
  { label: "Partial",    key: "partial"     },
  { label: "Unresolved", key: "unresolved"  },
] as const;

/* ── Main component ── */
export default function FilteredCalls() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const kind  = searchParams.get("kind")  as "sentiment" | "resolution" | "topic" | null;
  const value = searchParams.get("value") ?? "";

  const [history, setHistory] = useState<StoredAnalysis[]>([]);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    getHistory().then(setHistory).finally(() => setReady(true));
  }, []);

  /* All unique topics sorted by frequency */
  const allTopics = useMemo(() => {
    const map = new Map<string, number>();
    history.forEach((a) =>
      a.result.kpis.key_topics.forEach((t) => {
        const k = t.toLowerCase().trim();
        map.set(k, (map.get(k) ?? 0) + 1);
      })
    );
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [history]);

  /* Filtered list */
  const filtered = useMemo(() => {
    if (!kind || !value) return history;
    return history.filter((a) => {
      if (kind === "sentiment")  return a.result.overall.sentiment === value;
      if (kind === "resolution") return a.result.kpis.resolution   === value.toLowerCase();
      if (kind === "topic")
        return a.result.kpis.key_topics.map((t) => t.toLowerCase()).includes(value.toLowerCase());
      return true;
    });
  }, [history, kind, value]);

  function go(newKind: string, newValue: string) {
    router.push(
      `/dashboard/insights/calls?kind=${encodeURIComponent(newKind)}&value=${encodeURIComponent(newValue)}`
    );
  }

  /* ── Loading ── */
  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  /* ── Page title ── */
  const title =
    kind === "sentiment"  ? "Calls by Sentiment"  :
    kind === "resolution" ? "Calls by Resolution" :
    kind === "topic"      ? "Calls by Topic"       : "All Calls";

  const subtitle =
    kind === "topic"
      ? value
      : kind === "resolution"
        ? RESOLUTION_OPTIONS.find((r) => r.key === value)?.label ?? value
        : value;

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb header ── */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link
            href="/dashboard/insights"
            className="transition hover:text-foreground"
          >
            ← Insights
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{title}</span>
        </div>
        <h1 className="text-2xl font-semibold capitalize">{subtitle}</h1>
        <p className="mt-0.5 text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "call" : "calls"} match this filter
        </p>
      </div>

      {/* ── Filter chips ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Switch filter
        </p>
        <div className="flex flex-wrap gap-2">
          {kind === "sentiment" &&
            SENTIMENT_OPTIONS.map((v) => (
              <Chip
                key={v}
                label={v}
                active={value === v}
                onClick={() => go("sentiment", v)}
              />
            ))}

          {kind === "resolution" &&
            RESOLUTION_OPTIONS.map((v) => (
              <Chip
                key={v.key}
                label={v.label}
                active={value === v.key}
                onClick={() => go("resolution", v.key)}
              />
            ))}

          {kind === "topic" &&
            allTopics.map((t) => (
              <Chip
                key={t}
                label={t}
                active={value.toLowerCase() === t}
                onClick={() => go("topic", t)}
                capitalize
              />
            ))}
        </div>
      </div>

      {/* ── Call list ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs text-white">
            {filtered.length}
          </span>
          Results
        </h2>

        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm text-muted">No calls match this filter.</p>
            <Link
              href="/dashboard/insights"
              className="mt-4 inline-block text-sm text-brand hover:underline"
            >
              ← Back to Insights
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <CallCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Chip({
  label,
  active,
  onClick,
  capitalize,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  capitalize?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        capitalize ? "capitalize" : ""
      } ${
        active
          ? "border-brand bg-brand text-white shadow-sm"
          : "border-border bg-background hover:border-brand hover:bg-brand/5 hover:text-brand"
      }`}
    >
      {label}
    </button>
  );
}

function CallCard({ a }: { a: StoredAnalysis }) {
  const csatColor =
    a.result.kpis.csat_proxy >= 70
      ? "text-positive"
      : a.result.kpis.csat_proxy >= 40
        ? "text-amber-500"
        : "text-negative";

  const resolutionClass =
    a.result.kpis.resolution === "resolved"
      ? "bg-positive/10 text-positive"
      : a.result.kpis.resolution === "partial"
        ? "bg-amber-100 text-amber-700"
        : "bg-negative/10 text-negative";

  return (
    <div className="rounded-xl border border-border/60 bg-background p-4">
      <div className="flex flex-wrap items-start gap-3">
        {/* File name + summary */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">
            {isHighRisk(a) && (
              <span className="mr-1 text-negative" title="High risk">⚠</span>
            )}
            {a.fileName}
          </p>
          {a.result.summary && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{a.result.summary}</p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sentimentBadge(a.result.overall.sentiment)}`}
          >
            {a.result.overall.sentiment}
          </span>

          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${resolutionClass}`}
          >
            {a.result.kpis.resolution}
          </span>

          <span className={`text-xs font-semibold ${csatColor}`}>
            CSAT {a.result.kpis.csat_proxy}
            <span className="font-normal text-muted">/100</span>
          </span>

          {a.result.kpis.churn_risk === "high" && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskBadge("high")}`}>
              Churn
            </span>
          )}
          {a.result.kpis.escalation_risk === "high" && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskBadge("high")}`}>
              Escalation
            </span>
          )}
        </div>
      </div>

      {/* Key topics */}
      {a.result.kpis.key_topics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {a.result.kpis.key_topics.map((t) => (
            <span
              key={t}
              className="rounded-full bg-brand/8 px-2 py-0.5 text-xs text-brand"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-muted">{formatDate(a.createdAt)}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
