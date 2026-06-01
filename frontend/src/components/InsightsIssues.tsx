"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Aggregate, StoredAnalysis } from "@/lib/history";
import { sentimentBadge } from "@/lib/ui";
import { stashForReopen } from "@/lib/reopen";

function filterUrl(kind: string, value: string) {
  return `/dashboard/insights/calls?kind=${encodeURIComponent(kind)}&value=${encodeURIComponent(value)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function InsightsIssues({ agg }: { agg: Aggregate }) {
  const router = useRouter();

  function openCall(a: StoredAnalysis) {
    stashForReopen(a);
    router.push("/dashboard");
  }

  return (
    <div className="grid gap-3">
      {/* Top Issues & Topics */}
      {agg.topTopics.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-0.5 text-sm font-semibold">🏷️ Top Issues &amp; Topics</h2>
          <p className="mb-3 text-xs text-muted">Auto-extracted intents — click to filter matching calls</p>
          <div className="flex flex-wrap gap-2">
            {agg.topTopics.map((t) => (
              <Link key={t.topic} href={filterUrl("topic", t.topic)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium capitalize transition hover:border-brand hover:bg-brand/5 hover:text-brand">
                {t.topic}
                <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-xs font-semibold leading-none text-brand">
                  {t.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
          No topics extracted yet. Analyze more calls.
        </div>
      )}

      {/* High-Risk Calls */}
      {agg.highRisk.length > 0 ? (
        <div className="rounded-2xl border border-negative/25 bg-negative/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-negative">🚨 High-Risk Calls</h2>
              <span className="rounded-full bg-negative/10 px-2 py-0.5 text-xs font-semibold text-negative">
                {agg.highRisk.length}
              </span>
            </div>
            <Link href={filterUrl("sentiment", "Negative")} className="text-xs text-muted transition hover:text-negative">
              View all →
            </Link>
          </div>
          <p className="mb-3 text-xs text-muted">Negative sentiment + high churn or escalation signal · click to re-open</p>
          <div className="space-y-2">
            {agg.highRisk.slice(0, 6).map((a: StoredAnalysis) => (
              <button
                key={a.id}
                onClick={() => openCall(a)}
                className="group flex w-full flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-left text-sm transition hover:border-brand hover:shadow-sm"
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {a.fileName}
                  <span className="ml-1.5 text-brand opacity-0 transition group-hover:opacity-100">↗</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(a.result.overall.sentiment)}`}>
                  {a.result.overall.sentiment}
                </span>
                <span className="text-xs text-muted">Sat. {a.result.kpis.csat_proxy}</span>
                <span className="text-xs text-muted">{formatDate(a.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-positive/25 bg-positive/5 p-6 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-medium text-positive">No high-risk calls</p>
          <p className="text-xs text-muted mt-1">All analyzed calls are within acceptable risk thresholds.</p>
        </div>
      )}
    </div>
  );
}
