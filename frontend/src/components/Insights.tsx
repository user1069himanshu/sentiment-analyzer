"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  aggregate,
  clearHistory,
  getHistory,
  isHighRisk,
  type StoredAnalysis,
} from "@/lib/history";
import { sentimentBadge } from "@/lib/ui";

/* ── Colour maps ── */
const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "var(--positive)",
  Neutral:  "#9ca3af",
  Negative: "var(--negative)",
};
const RESOLUTION_COLORS: Record<string, string> = {
  Resolved:   "var(--positive)",
  Partial:    "#f59e0b",
  Unresolved: "var(--negative)",
};

/* ── Helper: build the filtered-calls URL ── */
function filterUrl(kind: string, value: string) {
  return `/dashboard/insights/calls?kind=${encodeURIComponent(kind)}&value=${encodeURIComponent(value)}`;
}

export default function Insights() {
  const router = useRouter();
  const [history, setHistory] = useState<StoredAnalysis[]>([]);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    getHistory().then(setHistory).finally(() => setReady(true));
  }, []);

  const agg = useMemo(() => aggregate(history), [history]);

  async function onClear() {
    if (confirm("Delete all stored call history? This cannot be undone.")) {
      await clearHistory();
      setHistory([]);
    }
  }

  /* ── Loading ── */
  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  /* ── Empty state ── */
  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/10 text-4xl">
          📊
        </div>
        <h1 className="text-xl font-semibold">No calls analyzed yet</h1>
        <p className="mt-2 text-sm text-muted">
          Analyze a conversation and it will appear here automatically, building an aggregate view
          across all your calls.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Analyze a call →
        </Link>
      </div>
    );
  }

  /* ── Chart data ── */
  const sentimentData = [
    { name: "Positive", value: agg.sentimentCounts.Positive },
    { name: "Neutral",  value: agg.sentimentCounts.Neutral  },
    { name: "Negative", value: agg.sentimentCounts.Negative },
  ].filter((d) => d.value > 0);

  const resolutionData = [
    { name: "Resolved",   value: agg.resolutionCounts.resolved   },
    { name: "Partial",    value: agg.resolutionCounts.partial     },
    { name: "Unresolved", value: agg.resolutionCounts.unresolved  },
  ].filter((d) => d.value > 0);

  const csatClass =
    agg.avgCsat >= 70 ? "text-positive" : agg.avgCsat >= 40 ? "text-amber-500" : "text-negative";
  const npsClass =
    agg.avgNps > 0 ? "text-positive" : agg.avgNps < 0 ? "text-negative" : "text-muted";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Insights Dashboard</h1>
          <p className="text-sm text-muted">
            {agg.totalCalls} {agg.totalCalls === 1 ? "call" : "calls"} analyzed
          </p>
        </div>
        <button
          onClick={onClear}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-negative hover:text-negative"
        >
          Clear history
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon="📞" label="Total Calls"  value={`${agg.totalCalls}`} sub="across all sessions" />
        <KpiCard
          icon="⭐" label="Satisfaction Index"
          value={`${agg.avgCsat}`} suffix="/100"
          valueClass={csatClass}
          sub={agg.avgCsat >= 70 ? "Healthy" : agg.avgCsat >= 40 ? "Needs attention" : "Critical"}
        />
        <KpiCard
          icon="📣" label="Net Promoter Signal"
          value={`${agg.avgNps > 0 ? "+" : ""}${agg.avgNps}`} suffix="/100"
          valueClass={npsClass}
          sub={agg.avgNps > 30 ? "Strong loyalty" : agg.avgNps >= 0 ? "Moderate" : "At risk"}
        />
        <KpiCard
          icon="⚠️" label="High-Risk Calls"
          value={`${agg.highRisk.length}`}
          valueClass={agg.highRisk.length > 0 ? "text-negative" : "text-positive"}
          sub={agg.highRisk.length > 0 ? "Click to review" : "All clear"}
          href={agg.highRisk.length > 0 ? filterUrl("sentiment", "Negative") : undefined}
        />
      </div>

      {/* ── Donut charts ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sentiment */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">🎯 Sentiment Breakdown</h2>
          <p className="mb-4 text-xs text-muted">Click a slice or row to open filtered view</p>
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%" cy="50%"
                    innerRadius={42} outerRadius={68}
                    paddingAngle={3} dataKey="value"
                    onClick={(d) => d?.name && router.push(filterUrl("sentiment", d.name))}
                    className="cursor-pointer"
                  >
                    {sentimentData.map((d) => (
                      <Cell key={d.name} fill={SENTIMENT_COLORS[d.name]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                    formatter={(value, name) => [`${value} calls`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {[
                { label: "Positive", value: agg.sentimentCounts.Positive },
                { label: "Neutral",  value: agg.sentimentCounts.Neutral  },
                { label: "Negative", value: agg.sentimentCounts.Negative },
              ].map((item) => {
                const pct = agg.totalCalls ? Math.round((item.value / agg.totalCalls) * 100) : 0;
                return (
                  <Link
                    key={item.label}
                    href={filterUrl("sentiment", item.label)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                      item.value > 0 ? "hover:bg-background" : "pointer-events-none opacity-40"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SENTIMENT_COLORS[item.label] }} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <span className="text-muted">{item.value}</span>
                    <span className="w-8 text-right font-semibold">{pct}%</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Resolution */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">✅ FCR Outcomes</h2>
          <p className="mb-4 text-xs text-muted">First Contact Resolution — click to filter</p>
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resolutionData}
                    cx="50%" cy="50%"
                    innerRadius={42} outerRadius={68}
                    paddingAngle={3} dataKey="value"
                    onClick={(d) => {
                      if (d?.name) router.push(filterUrl("resolution", d.name.toLowerCase()));
                    }}
                    className="cursor-pointer"
                  >
                    {resolutionData.map((d) => (
                      <Cell key={d.name} fill={RESOLUTION_COLORS[d.name]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                    formatter={(value, name) => [`${value} calls`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {[
                { label: "Resolved",   key: "resolved",   value: agg.resolutionCounts.resolved   },
                { label: "Partial",    key: "partial",    value: agg.resolutionCounts.partial     },
                { label: "Unresolved", key: "unresolved", value: agg.resolutionCounts.unresolved  },
              ].map((item) => {
                const pct = agg.totalCalls ? Math.round((item.value / agg.totalCalls) * 100) : 0;
                return (
                  <Link
                    key={item.key}
                    href={filterUrl("resolution", item.key)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                      item.value > 0 ? "hover:bg-background" : "pointer-events-none opacity-40"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: RESOLUTION_COLORS[item.label] }} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <span className="text-muted">{item.value}</span>
                    <span className="w-8 text-right font-semibold">{pct}%</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Performance averages ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">📊 Benchmark Averages</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <PerfBar label="⭐ Satisfaction Index"  value={agg.avgCsat}   display={`${agg.avgCsat}/100`} />
          <PerfBar label="📣 Net Promoter Signal" value={Math.max(0, agg.avgNps)} display={`${agg.avgNps > 0 ? "+" : ""}${agg.avgNps}/100`} />
          <PerfBar label="🤝 Empathy Quotient"    value={agg.avgEmpathy} display={`${agg.avgEmpathy}/100`} />
        </div>
      </div>

      {/* ── Top topics ── */}
      {agg.topTopics.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">🏷️ Top Issues &amp; Topics</h2>
          <p className="mb-4 text-xs text-muted">Auto-extracted intents — click to filter matching calls</p>
          <div className="flex flex-wrap gap-2">
            {agg.topTopics.map((t) => (
              <Link
                key={t.topic}
                href={filterUrl("topic", t.topic)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium capitalize transition hover:border-brand hover:bg-brand/5 hover:text-brand"
              >
                {t.topic}
                <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-xs font-semibold leading-none text-brand">
                  {t.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── High-risk calls ── */}
      {agg.highRisk.length > 0 && (
        <div className="rounded-2xl border border-negative/25 bg-negative/5 p-5">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-negative">🚨 High-Risk Calls</h2>
              <span className="rounded-full bg-negative/10 px-2 py-0.5 text-xs font-semibold text-negative">
                {agg.highRisk.length}
              </span>
            </div>
            <Link
              href={filterUrl("sentiment", "Negative")}
              className="text-xs text-muted transition hover:text-negative"
            >
              View all →
            </Link>
          </div>
          <p className="mb-4 text-xs text-muted">Negative sentiment + high retention risk or escalation signal</p>
          <div className="space-y-2">
            {agg.highRisk.slice(0, 5).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium">{a.fileName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(a.result.overall.sentiment)}`}>
                  {a.result.overall.sentiment}
                </span>
                <span className="text-xs text-muted">Sat. {a.result.kpis.csat_proxy}</span>
                <span className="text-xs text-muted">{formatDate(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent calls table ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">
          🕐 Recent Calls ({Math.min(history.length, 20)} of {history.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="pb-2 pr-3 font-medium">File</th>
                <th className="pb-2 pr-3 font-medium">Sentiment</th>
                <th className="pb-2 pr-3 font-medium">Satisfaction</th>
                <th className="pb-2 pr-3 font-medium">FCR Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 20).map((a, i) => (
                <tr key={a.id} className={`border-b border-border/40 last:border-0 ${i % 2 !== 0 ? "bg-background/50" : ""}`}>
                  <td className="max-w-[180px] truncate py-2.5 pr-3 font-medium" title={a.fileName}>
                    {isHighRisk(a) && <span className="mr-1 text-negative" title="High risk">⚠</span>}
                    {a.fileName}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(a.result.overall.sentiment)}`}>
                      {a.result.overall.sentiment}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={`font-semibold ${a.result.kpis.csat_proxy >= 70 ? "text-positive" : a.result.kpis.csat_proxy >= 40 ? "text-amber-500" : "text-negative"}`}>
                      {a.result.kpis.csat_proxy}
                    </span>
                    <span className="text-xs text-muted">/100</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                      a.result.kpis.resolution === "resolved"   ? "bg-positive/10 text-positive" :
                      a.result.kpis.resolution === "partial"    ? "bg-amber-100 text-amber-700"  :
                      "bg-negative/10 text-negative"
                    }`}>
                      {a.result.kpis.resolution}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-xs text-muted">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function KpiCard({
  icon, label, value, suffix, sub, valueClass = "", href,
}: {
  icon: string; label: string; value: string;
  suffix?: string; sub?: string; valueClass?: string; href?: string;
}) {
  const cls = `rounded-2xl border border-border bg-card p-4 ${href ? "cursor-pointer transition hover:border-brand hover:shadow-sm" : ""}`;
  const inner = (
    <>
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-xs font-medium text-muted">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>
        {value}
        {suffix && <span className="text-sm font-normal text-muted">{suffix}</span>}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </>
  );
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

function PerfBar({ label, value, display }: { label: string; value: number; display: string }) {
  const barPct = Math.min(100, Math.max(0, value));
  const color  = value >= 70 ? "var(--positive)" : value >= 40 ? "#f59e0b" : "var(--negative)";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-muted">{label}</span>
        <span className="font-semibold text-foreground">{display}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${barPct}%`, background: color }} />
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
