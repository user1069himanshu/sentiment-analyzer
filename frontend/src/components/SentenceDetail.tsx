"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult, SentenceAnalysis } from "@/lib/types";
import { EMOTION_COLORS, sentimentBadge, titleCase } from "@/lib/ui";

/* Score bar — coloured strip proportional to |score|, direction shows polarity */
function ScoreBar({ score }: { score: number }) {
  const pct   = Math.round(Math.abs(score) * 100);
  const color = score > 0.1 ? "var(--positive)" : score < -0.1 ? "var(--negative)" : "#9ca3af";
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="relative h-1.5 w-16 rounded-full bg-border">
        <div
          className="absolute inset-y-0 rounded-full transition-all"
          style={{
            width:  `${pct}%`,
            left:   score >= 0 ? "50%" : `${50 - pct / 2}%`,
            background: color,
          }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-muted/40" />
      </div>
      <span
        className="tabular-nums text-xs font-semibold w-10 text-right"
        style={{ color }}
      >
        {score >= 0 ? "+" : ""}{score.toFixed(2)}
      </span>
    </div>
  );
}

/* Emotion pill */
function EmotionPill({ emotion }: { emotion: SentenceAnalysis["emotion"] }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        background: `${EMOTION_COLORS[emotion]}22`,
        color: EMOTION_COLORS[emotion],
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: EMOTION_COLORS[emotion] }}
      />
      {titleCase(emotion)}
    </span>
  );
}

/* Speaker chip */
function SpeakerChip({ speaker }: { speaker: string | null }) {
  if (!speaker) return <span className="text-xs text-muted">—</span>;
  const isAgent    = /agent/i.test(speaker);
  const isCustomer = /customer|client|caller/i.test(speaker);
  const cls = isAgent
    ? "bg-brand/10 text-brand"
    : isCustomer
      ? "bg-positive/10 text-positive"
      : "bg-neutral/15 text-muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${cls}`}>
      {speaker}
    </span>
  );
}

export default function SentenceDetail() {
  const router = useRouter();
  const [result,   setResult]   = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [filter,   setFilter]   = useState<"all" | "Positive" | "Negative" | "Neutral">("all");
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    try {
      const raw  = sessionStorage.getItem("sa_draft_result");
      const name = sessionStorage.getItem("sa_draft_filename");
      if (raw) setResult(JSON.parse(raw));
      if (name) setFileName(name);
    } catch {}
  }, []);

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-4xl">🔍</p>
        <p className="text-sm font-medium">No analysis found</p>
        <p className="text-xs text-muted">Analyze a call first, then come back here.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          ← Go to Analyzer
        </button>
      </div>
    );
  }

  const { sentences, overall, meta } = result;

  /* Filtered + searched list */
  const visible = sentences.filter((s) => {
    const matchFilter = filter === "all" || s.sentiment === filter;
    const matchSearch = !search || s.text.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  /* Per-sentiment counts for filter pills */
  const counts = {
    Positive: sentences.filter((s) => s.sentiment === "Positive").length,
    Neutral:  sentences.filter((s) => s.sentiment === "Neutral").length,
    Negative: sentences.filter((s) => s.sentiment === "Negative").length,
  };

  const filterOptions: Array<{ key: typeof filter; label: string; count: number }> = [
    { key: "all",      label: "All",      count: sentences.length },
    { key: "Positive", label: "Positive", count: counts.Positive },
    { key: "Neutral",  label: "Neutral",  count: counts.Neutral  },
    { key: "Negative", label: "Negative", count: counts.Negative },
  ];

  return (
    <div className="flex h-full flex-col gap-3">

      {/* ── Header ── */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-background"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-base font-bold">Sentence Analysis</h1>
            <p className="text-xs text-muted">
              {fileName ?? "conversation"} · {sentences.length} sentences · {overall.sentiment} overall
            </p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search sentences…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 w-56"
        />
      </div>

      {/* ── Filter pills ── */}
      <div className="flex shrink-0 flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === opt.key
                ? "border-brand bg-brand text-white shadow-sm"
                : "border-border bg-card hover:border-brand hover:text-brand"
            }`}
          >
            {opt.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
              filter === opt.key ? "bg-white/20 text-white" : "bg-border text-muted"
            }`}>
              {opt.count}
            </span>
          </button>
        ))}
        {search && (
          <span className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted">
            "{search}" · {visible.length} match{visible.length !== 1 ? "es" : ""}
            <button onClick={() => setSearch("")} className="ml-1 text-negative hover:opacity-80">✕</button>
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium w-10">#</th>
              <th className="px-3 py-2.5 font-medium">Speaker</th>
              <th className="px-3 py-2.5 font-medium">Sentence</th>
              <th className="px-3 py-2.5 font-medium">Sentiment</th>
              <th className="px-3 py-2.5 font-medium">Score</th>
              <th className="px-3 py-2.5 font-medium">Emotion</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-muted">
                  No sentences match this filter.
                </td>
              </tr>
            ) : (
              visible.map((s, i) => {
                const rowBg =
                  s.sentiment === "Positive" ? "hover:bg-positive/5" :
                  s.sentiment === "Negative" ? "hover:bg-negative/5" : "hover:bg-neutral/5";
                return (
                  <tr
                    key={s.index}
                    className={`border-b border-border/40 last:border-0 transition ${rowBg} ${
                      i % 2 === 0 ? "" : "bg-background/40"
                    }`}
                  >
                    {/* Row number */}
                    <td className="px-4 py-3 text-xs font-mono text-muted w-10">
                      {s.index + 1}
                    </td>

                    {/* Speaker */}
                    <td className="px-3 py-3">
                      <SpeakerChip speaker={s.speaker} />
                    </td>

                    {/* Sentence text */}
                    <td className="px-3 py-3 max-w-sm">
                      <p className="text-sm leading-relaxed">{s.text}</p>
                    </td>

                    {/* Sentiment badge */}
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sentimentBadge(s.sentiment)}`}>
                        {s.sentiment}
                      </span>
                    </td>

                    {/* Score bar */}
                    <td className="px-3 py-3">
                      <ScoreBar score={s.score} />
                    </td>

                    {/* Emotion */}
                    <td className="px-3 py-3">
                      <EmotionPill emotion={s.emotion} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer stat bar ── */}
      <div className="shrink-0 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-2 text-xs text-muted">
        <span>Showing <strong className="text-foreground">{visible.length}</strong> of <strong className="text-foreground">{sentences.length}</strong> sentences</span>
        <span>Avg score <strong className="text-foreground">{(sentences.reduce((a, s) => a + s.score, 0) / sentences.length).toFixed(2)}</strong></span>
        <span>Model <span className="font-mono">{meta.model}</span></span>
      </div>
    </div>
  );
}
