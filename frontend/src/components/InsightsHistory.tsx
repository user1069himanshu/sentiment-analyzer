"use client";

import { isHighRisk, type StoredAnalysis } from "@/lib/history";
import { sentimentBadge } from "@/lib/ui";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function InsightsHistory({
  history,
  onClear,
}: {
  history: StoredAnalysis[];
  onClear: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <p className="text-sm text-muted">
          Showing <strong className="text-foreground">{Math.min(history.length, 20)}</strong> of{" "}
          <strong className="text-foreground">{history.length}</strong> calls
        </p>
        <button
          onClick={onClear}
          className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-negative hover:text-negative"
        >
          Clear history
        </button>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">File</th>
              <th className="px-3 py-2.5 font-medium">Sentiment</th>
              <th className="px-3 py-2.5 font-medium">Satisfaction</th>
              <th className="px-3 py-2.5 font-medium">FCR Status</th>
              <th className="px-3 py-2.5 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 20).map((a, i) => (
              <tr
                key={a.id}
                className={`border-b border-border/40 last:border-0 ${i % 2 !== 0 ? "bg-background/50" : ""}`}
              >
                <td className="max-w-[180px] truncate px-4 py-2.5 font-medium" title={a.fileName}>
                  {isHighRisk(a) && <span className="mr-1 text-negative" title="High risk">⚠</span>}
                  {a.fileName}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sentimentBadge(a.result.overall.sentiment)}`}>
                    {a.result.overall.sentiment}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`font-semibold ${
                    a.result.kpis.csat_proxy >= 70 ? "text-positive" :
                    a.result.kpis.csat_proxy >= 40 ? "text-amber-500" : "text-negative"
                  }`}>
                    {a.result.kpis.csat_proxy}
                  </span>
                  <span className="text-xs text-muted">/100</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                    a.result.kpis.resolution === "resolved" ? "bg-positive/10 text-positive" :
                    a.result.kpis.resolution === "partial"  ? "bg-amber-100 text-amber-700"  :
                    "bg-negative/10 text-negative"
                  }`}>
                    {a.result.kpis.resolution}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">{formatDate(a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
