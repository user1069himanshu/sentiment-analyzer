"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  aggregate,
  clearHistory,
  getHistory,
  isHighRisk,
  type StoredAnalysis,
} from "@/lib/history";
import { riskBadge, sentimentBadge } from "@/lib/ui";

export default function Insights() {
  const [history, setHistory] = useState<StoredAnalysis[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setReady(true);
  }, []);

  const agg = useMemo(() => aggregate(history), [history]);

  function onClear() {
    if (confirm("Delete all stored call history? This cannot be undone.")) {
      clearHistory();
      setHistory([]);
    }
  }

  if (!ready) return null;

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mb-3 text-4xl">📊</div>
        <h1 className="text-xl font-semibold">No calls analyzed yet</h1>
        <p className="mt-2 text-sm text-muted">
          Analyze a conversation and it will be saved here automatically, building
          an aggregate view across all your calls.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Analyze a call
        </Link>
      </div>
    );
  }

  const maxTopic = agg.topTopics[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Call insights</h1>
          <p className="text-sm text-muted">
            Aggregated across {agg.totalCalls} analyzed{" "}
            {agg.totalCalls === 1 ? "call" : "calls"}
          </p>
        </div>
        <button
          onClick={onClear}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-negative transition hover:bg-negative/5"
        >
          Clear history
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total calls" value={`${agg.totalCalls}`} />
        <Stat label="Avg CSAT" value={`${agg.avgCsat}`} suffix="/100" />
        <Stat label="Avg NPS" value={`${agg.avgNps > 0 ? "+" : ""}${agg.avgNps}`} suffix="/100" />
        <Stat
          label="High-risk calls"
          value={`${agg.highRisk.length}`}
          accent={agg.highRisk.length > 0 ? "text-negative" : undefined}
        />
      </div>

      {/* Sentiment + resolution distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Sentiment mix</h2>
          <Distribution
            items={[
              { label: "Positive", value: agg.sentimentCounts.Positive, color: "var(--positive)" },
              { label: "Neutral", value: agg.sentimentCounts.Neutral, color: "var(--neutral)" },
              { label: "Negative", value: agg.sentimentCounts.Negative, color: "var(--negative)" },
            ]}
            total={agg.totalCalls}
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Resolution outcomes</h2>
          <Distribution
            items={[
              { label: "Resolved", value: agg.resolutionCounts.resolved, color: "var(--positive)" },
              { label: "Partial", value: agg.resolutionCounts.partial, color: "#f59e0b" },
              { label: "Unresolved", value: agg.resolutionCounts.unresolved, color: "var(--negative)" },
            ]}
            total={agg.totalCalls}
          />
        </div>
      </div>

      {/* Top problems / topics */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold">Top problems & topics</h2>
        <p className="mb-4 text-xs text-muted">
          Most frequent topics extracted across all calls
        </p>
        {agg.topTopics.length === 0 ? (
          <p className="text-sm text-muted">No topics captured yet.</p>
        ) : (
          <div className="space-y-2">
            {agg.topTopics.map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <div className="w-40 shrink-0 truncate text-sm capitalize" title={t.topic}>
                  {t.topic}
                </div>
                <div className="h-5 flex-1 rounded-md bg-border/50">
                  <div
                    className="flex h-5 items-center rounded-md bg-brand px-2 text-xs font-medium text-white"
                    style={{ width: `${Math.max(12, (t.count / maxTopic) * 100)}%` }}
                  >
                    {t.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* High-risk calls */}
      {agg.highRisk.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">⚠️ High-risk calls</h2>
          <p className="mb-4 text-xs text-muted">
            Negative sentiment, high churn risk, or escalation risk
          </p>
          <div className="space-y-2">
            {agg.highRisk.slice(0, 10).map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-3 text-sm"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{a.fileName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(a.result.overall.sentiment)}`}>
                  {a.result.overall.sentiment}
                </span>
                {a.result.kpis.churn_risk === "high" && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${riskBadge("high")}`}>
                    Churn: High
                  </span>
                )}
                {a.result.kpis.escalation_risk === "high" && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${riskBadge("high")}`}>
                    Escalation: High
                  </span>
                )}
                <span className="text-xs text-muted">{formatDate(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent calls table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Recent calls</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="pb-2 pr-3 font-medium">File</th>
                <th className="pb-2 pr-3 font-medium">Sentiment</th>
                <th className="pb-2 pr-3 font-medium">CSAT</th>
                <th className="pb-2 pr-3 font-medium">Resolution</th>
                <th className="pb-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 20).map((a) => (
                <tr key={a.id} className="border-b border-border/40 last:border-0">
                  <td className="max-w-[180px] truncate py-2 pr-3" title={a.fileName}>
                    {isHighRisk(a) && <span className="mr-1">⚠️</span>}
                    {a.fileName}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(a.result.overall.sentiment)}`}>
                      {a.result.overall.sentiment}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{a.result.kpis.csat_proxy}</td>
                  <td className="py-2 pr-3 capitalize">{a.result.kpis.resolution}</td>
                  <td className="py-2 text-xs text-muted">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ?? ""}`}>
        {value}
        {suffix && <span className="text-sm font-normal text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

function Distribution({
  items,
  total,
}: {
  items: { label: string; value: number; color: string }[];
  total: number;
}) {
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const pct = total ? Math.round((it.value / total) * 100) : 0;
        return (
          <div key={it.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium">{it.label}</span>
              <span className="text-muted">
                {it.value} · {pct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-border">
              <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: it.color }} />
            </div>
          </div>
        );
      })}
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
