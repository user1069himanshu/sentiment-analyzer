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
import type { Sentiment } from "@/lib/types";

type FilterType =
  | { kind: "sentiment"; value: Sentiment }
  | { kind: "resolution"; value: "resolved" | "partial" | "unresolved" }
  | { kind: "topic"; value: string }
  | null;

export default function Insights() {
  const [history, setHistory] = useState<StoredAnalysis[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<FilterType>(null);

  useEffect(() => {
    getHistory().then(setHistory).finally(() => setReady(true));
  }, []);

  const agg = useMemo(() => aggregate(history), [history]);

  const filtered = useMemo(() => {
    if (!filter) return history;
    return history.filter((a) => {
      if (filter.kind === "sentiment") return a.result.overall.sentiment === filter.value;
      if (filter.kind === "resolution") return a.result.kpis.resolution === filter.value;
      if (filter.kind === "topic") return a.result.kpis.key_topics
        .map((t) => t.toLowerCase())
        .includes(filter.value.toLowerCase());
      return true;
    });
  }, [history, filter]);

  async function onClear() {
    if (confirm("Delete all stored call history? This cannot be undone.")) {
      await clearHistory();
      setHistory([]);
      setFilter(null);
    }
  }

  function toggleFilter(f: FilterType) {
    setFilter((prev) =>
      prev && JSON.stringify(prev) === JSON.stringify(f) ? null : f
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mb-3 text-5xl">📊</div>
        <h1 className="text-xl font-semibold">No calls analyzed yet</h1>
        <p className="mt-2 text-sm text-muted">
          Analyze a conversation and it will appear here automatically, building an
          aggregate view across all your calls.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Analyze a call
        </Link>
      </div>
    );
  }

  const maxTopic = agg.topTopics[0]?.count ?? 1;
  const filterLabel =
    filter?.kind === "sentiment" ? `Sentiment: ${filter.value}`
    : filter?.kind === "resolution" ? `Resolution: ${filter.value}`
    : filter?.kind === "topic" ? `Topic: ${filter.value}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Call insights</h1>
          <p className="text-sm text-muted">
            Aggregated across {agg.totalCalls}{" "}
            {agg.totalCalls === 1 ? "call" : "calls"}
            {filterLabel && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                {filterLabel}
                <button onClick={() => setFilter(null)} className="ml-0.5 hover:text-negative">✕</button>
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onClear}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-negative transition hover:bg-negative/5"
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
          onClick={() => toggleFilter({ kind: "sentiment", value: "Negative" })}
          clickable
        />
      </div>

      {/* Sentiment + resolution — clickable */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Sentiment mix</h2>
          <p className="mb-4 text-xs text-muted">Click a row to filter calls</p>
          <ClickableDistribution
            items={[
              { label: "Positive", value: agg.sentimentCounts.Positive, color: "var(--positive)" },
              { label: "Neutral", value: agg.sentimentCounts.Neutral, color: "var(--neutral)" },
              { label: "Negative", value: agg.sentimentCounts.Negative, color: "var(--negative)" },
            ]}
            total={agg.totalCalls}
            activeLabel={filter?.kind === "sentiment" ? filter.value : null}
            onSelect={(label) =>
              toggleFilter({ kind: "sentiment", value: label as Sentiment })
            }
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Resolution outcomes</h2>
          <p className="mb-4 text-xs text-muted">Click a row to filter calls</p>
          <ClickableDistribution
            items={[
              { label: "Resolved", value: agg.resolutionCounts.resolved, color: "var(--positive)" },
              { label: "Partial", value: agg.resolutionCounts.partial, color: "#f59e0b" },
              { label: "Unresolved", value: agg.resolutionCounts.unresolved, color: "var(--negative)" },
            ]}
            total={agg.totalCalls}
            activeLabel={filter?.kind === "resolution" ? filter.value : null}
            onSelect={(label) =>
              toggleFilter({
                kind: "resolution",
                value: label.toLowerCase() as "resolved" | "partial" | "unresolved",
              })
            }
          />
        </div>
      </div>

      {/* Top topics — clickable */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold">Top problems & topics</h2>
        <p className="mb-4 text-xs text-muted">
          Most frequent topics · click to filter calls by topic
        </p>
        {agg.topTopics.length === 0 ? (
          <p className="text-sm text-muted">No topics captured yet.</p>
        ) : (
          <div className="space-y-2">
            {agg.topTopics.map((t) => {
              const active = filter?.kind === "topic" && filter.value === t.topic;
              return (
                <button
                  key={t.topic}
                  onClick={() => toggleFilter({ kind: "topic", value: t.topic })}
                  className={`flex w-full items-center gap-3 rounded-lg p-1.5 transition ${
                    active ? "ring-2 ring-brand" : "hover:bg-background"
                  }`}
                >
                  <div className="w-36 shrink-0 truncate text-left text-sm capitalize" title={t.topic}>
                    {t.topic}
                  </div>
                  <div className="h-5 flex-1 rounded-md bg-border/50">
                    <div
                      className={`flex h-5 items-center rounded-md px-2 text-xs font-medium text-white transition-all ${active ? "bg-brand" : "bg-brand/70"}`}
                      style={{ width: `${Math.max(12, (t.count / maxTopic) * 100)}%` }}
                    >
                      {t.count}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filtered call list — appears when a filter is active */}
      {filter && (
        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {filtered.length} {filtered.length === 1 ? "call" : "calls"} · {filterLabel}
            </h2>
            <button
              onClick={() => setFilter(null)}
              className="text-xs text-muted hover:text-negative"
            >
              Clear filter
            </button>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted">No calls match this filter.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {isHighRisk(a) && <span className="mr-1">⚠️</span>}
                    {a.fileName}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(a.result.overall.sentiment)}`}>
                    {a.result.overall.sentiment}
                  </span>
                  <span className="text-xs text-muted">CSAT {a.result.kpis.csat_proxy}</span>
                  <span className="capitalize text-xs text-muted">{a.result.kpis.resolution}</span>
                  {a.result.kpis.churn_risk === "high" && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${riskBadge("high")}`}>Churn</span>
                  )}
                  {a.result.kpis.escalation_risk === "high" && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${riskBadge("high")}`}>Escalation</span>
                  )}
                  <span className="ml-auto text-xs text-muted">{formatDate(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* High-risk calls */}
      {agg.highRisk.length > 0 && !filter && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">⚠️ High-risk calls</h2>
          <p className="mb-4 text-xs text-muted">Negative sentiment, high churn, or escalation risk</p>
          <div className="space-y-2">
            {agg.highRisk.slice(0, 10).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 p-3 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium">{a.fileName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(a.result.overall.sentiment)}`}>
                  {a.result.overall.sentiment}
                </span>
                {a.result.kpis.churn_risk === "high" && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${riskBadge("high")}`}>Churn: High</span>
                )}
                {a.result.kpis.escalation_risk === "high" && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${riskBadge("high")}`}>Escalation: High</span>
                )}
                <span className="text-xs text-muted">{formatDate(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent calls table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">
          {filter ? `Filtered calls (${filtered.length})` : "Recent calls"}
        </h2>
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
              {(filter ? filtered : history).slice(0, 20).map((a) => (
                <tr key={a.id} className="border-b border-border/40 last:border-0">
                  <td className="max-w-[180px] truncate py-2 pr-3" title={a.fileName}>
                    {isHighRisk(a) && <span className="mr-1">⚠️</span>}{a.fileName}
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
  onClick,
  clickable,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: string;
  onClick?: () => void;
  clickable?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border bg-card p-4 ${clickable ? "cursor-pointer transition hover:border-brand hover:bg-brand/5" : ""}`}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ?? ""}`}>
        {value}
        {suffix && <span className="text-sm font-normal text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

function ClickableDistribution({
  items,
  total,
  activeLabel,
  onSelect,
}: {
  items: { label: string; value: number; color: string }[];
  total: number;
  activeLabel: string | null;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const pct = total ? Math.round((it.value / total) * 100) : 0;
        const active = activeLabel?.toLowerCase() === it.label.toLowerCase();
        return (
          <button
            key={it.label}
            onClick={() => it.value > 0 && onSelect(it.label)}
            disabled={it.value === 0}
            className={`w-full rounded-lg p-2 transition ${
              it.value > 0 ? "cursor-pointer hover:bg-background" : "cursor-default opacity-50"
            } ${active ? "ring-2 ring-brand" : ""}`}
          >
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium">{it.label}</span>
              <span className="text-muted">{it.value} · {pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, background: it.color, opacity: active ? 1 : 0.75 }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
