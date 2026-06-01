"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Aggregate, StoredAnalysis } from "@/lib/history";

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

function filterUrl(kind: string, value: string) {
  return `/dashboard/insights/calls?kind=${encodeURIComponent(kind)}&value=${encodeURIComponent(value)}`;
}

function KpiCard({ icon, label, value, suffix, sub, valueClass = "", href }: {
  icon: string; label: string; value: string;
  suffix?: string; sub?: string; valueClass?: string; href?: string;
}) {
  const cls = `rounded-2xl border border-border bg-card p-4 ${href ? "cursor-pointer transition hover:border-brand hover:shadow-sm" : ""}`;
  const inner = (
    <>
      <div className="mb-1.5 flex items-center gap-1.5">
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
  return href
    ? <Link href={href} className={cls}>{inner}</Link>
    : <div className={cls}>{inner}</div>;
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

export default function InsightsOverview({
  history,
  agg,
}: {
  history: StoredAnalysis[];
  agg: Aggregate;
}) {
  const router = useRouter();

  const csatClass = agg.avgCsat >= 70 ? "text-positive" : agg.avgCsat >= 40 ? "text-amber-500" : "text-negative";
  const npsClass  = agg.avgNps  >  0  ? "text-positive" : agg.avgNps  <  0  ? "text-negative"  : "text-muted";

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

  return (
    <div className="grid gap-3">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon="📞" label="Total Calls"         value={`${agg.totalCalls}`} sub="across all sessions" />
        <KpiCard icon="⭐" label="Satisfaction Index"  value={`${agg.avgCsat}`}    suffix="/100" valueClass={csatClass}
          sub={agg.avgCsat >= 70 ? "Healthy" : agg.avgCsat >= 40 ? "Needs attention" : "Critical"} />
        <KpiCard icon="📣" label="Net Promoter Signal" value={`${agg.avgNps > 0 ? "+" : ""}${agg.avgNps}`} suffix="/100" valueClass={npsClass}
          sub={agg.avgNps > 30 ? "Strong loyalty" : agg.avgNps >= 0 ? "Moderate" : "At risk"} />
        <KpiCard icon="⚠️" label="High-Risk Calls"     value={`${agg.highRisk.length}`}
          valueClass={agg.highRisk.length > 0 ? "text-negative" : "text-positive"}
          sub={agg.highRisk.length > 0 ? "Click to review" : "All clear"}
          href={agg.highRisk.length > 0 ? filterUrl("sentiment", "Negative") : undefined} />
      </div>

      {/* Donut charts */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Sentiment Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-0.5 text-sm font-semibold">🎯 Sentiment Breakdown</h2>
          <p className="mb-3 text-xs text-muted">Click a slice or row to filter</p>
          <div className="flex items-center gap-4">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={36} outerRadius={56}
                    paddingAngle={3} dataKey="value"
                    onClick={(d) => d?.name && router.push(filterUrl("sentiment", d.name))}
                    className="cursor-pointer">
                    {sentimentData.map((d) => <Cell key={d.name} fill={SENTIMENT_COLORS[d.name]} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                    formatter={(v, n) => [`${v} calls`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {[
                { label: "Positive", value: agg.sentimentCounts.Positive },
                { label: "Neutral",  value: agg.sentimentCounts.Neutral  },
                { label: "Negative", value: agg.sentimentCounts.Negative },
              ].map((item) => {
                const pct = agg.totalCalls ? Math.round((item.value / agg.totalCalls) * 100) : 0;
                return (
                  <Link key={item.label} href={filterUrl("sentiment", item.label)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${item.value > 0 ? "hover:bg-background" : "pointer-events-none opacity-40"}`}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SENTIMENT_COLORS[item.label] }} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <span className="text-muted">{item.value}</span>
                    <span className="w-8 text-right font-semibold">{pct}%</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* FCR Outcomes */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-0.5 text-sm font-semibold">✅ FCR Outcomes</h2>
          <p className="mb-3 text-xs text-muted">First Contact Resolution — click to filter</p>
          <div className="flex items-center gap-4">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={resolutionData} cx="50%" cy="50%" innerRadius={36} outerRadius={56}
                    paddingAngle={3} dataKey="value"
                    onClick={(d) => { if (d?.name) router.push(filterUrl("resolution", d.name.toLowerCase())); }}
                    className="cursor-pointer">
                    {resolutionData.map((d) => <Cell key={d.name} fill={RESOLUTION_COLORS[d.name]} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                    formatter={(v, n) => [`${v} calls`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {[
                { label: "Resolved",   key: "resolved",   value: agg.resolutionCounts.resolved   },
                { label: "Partial",    key: "partial",    value: agg.resolutionCounts.partial     },
                { label: "Unresolved", key: "unresolved", value: agg.resolutionCounts.unresolved  },
              ].map((item) => {
                const pct = agg.totalCalls ? Math.round((item.value / agg.totalCalls) * 100) : 0;
                return (
                  <Link key={item.key} href={filterUrl("resolution", item.key)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${item.value > 0 ? "hover:bg-background" : "pointer-events-none opacity-40"}`}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: RESOLUTION_COLORS[item.label] }} />
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

      {/* Benchmark Averages */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">📊 Benchmark Averages</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <PerfBar label="⭐ Satisfaction Index"  value={agg.avgCsat}             display={`${agg.avgCsat}/100`} />
          <PerfBar label="📣 Net Promoter Signal" value={Math.max(0, agg.avgNps)} display={`${agg.avgNps > 0 ? "+" : ""}${agg.avgNps}/100`} />
          <PerfBar label="🤝 Empathy Quotient"    value={agg.avgEmpathy}          display={`${agg.avgEmpathy}/100`} />
        </div>
      </div>
    </div>
  );
}
