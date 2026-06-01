"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AnalysisResult, SentenceAnalysis } from "@/lib/types";
import { EMOTION_COLORS, sentimentBadge, titleCase } from "@/lib/ui";

/* ── Score bar — bidirectional, colour-coded ── */
function ScoreBar({ score }: { score: number }) {
  const pct   = Math.round(Math.abs(score) * 100);
  const color = score > 0.1 ? "var(--positive)" : score < -0.1 ? "var(--negative)" : "#9ca3af";
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="relative h-1.5 w-16 rounded-full bg-border">
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            width: `${pct}%`,
            left:  score >= 0 ? "50%" : `${50 - pct / 2}%`,
            background: color,
          }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-muted/40" />
      </div>
      <span className="tabular-nums text-xs font-semibold w-10 text-right" style={{ color }}>
        {score >= 0 ? "+" : ""}{score.toFixed(2)}
      </span>
    </div>
  );
}

/* ── Emotion pill ── */
function EmotionPill({ emotion }: { emotion: SentenceAnalysis["emotion"] }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `${EMOTION_COLORS[emotion]}22`, color: EMOTION_COLORS[emotion] }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EMOTION_COLORS[emotion] }} />
      {titleCase(emotion)}
    </span>
  );
}

/* ── Speaker chip ── */
function SpeakerChip({ speaker }: { speaker: string | null }) {
  if (!speaker) return <span className="text-xs text-muted">—</span>;
  const cls = /agent/i.test(speaker)
    ? "bg-brand/10 text-brand"
    : /customer|client|caller/i.test(speaker)
      ? "bg-positive/10 text-positive"
      : "bg-neutral/15 text-muted";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${cls}`}>{speaker}</span>;
}

/* ── Phase helpers ── */
function getPhaseLabel(index: number, total: number): "opening" | "middle" | "closing" {
  if (index < Math.floor(total / 3)) return "opening";
  if (index < Math.floor((total * 2) / 3)) return "middle";
  return "closing";
}
const PHASE_ICONS: Record<string, string> = { opening: "🌅", middle: "⚙️", closing: "🏁" };

export default function SentenceDetail() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const urlFilter    = searchParams.get("filter") ?? "sentiment";   // sentiment | emotion | phase
  const urlValue     = searchParams.get("value")  ?? "all";

  const [result,   setResult]   = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [search,   setSearch]   = useState("");

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

  /* ── Build active filter chip state ── */
  type FilterDim = "sentiment" | "emotion" | "phase";
  const filterDim   = urlFilter as FilterDim;
  const filterValue = urlValue;   // "all" | specific value

  /* ── Filtered + searched list ── */
  const visible = sentences.filter((s) => {
    const phase = getPhaseLabel(s.index, sentences.length);
    const matchFilter =
      filterValue === "all"               ? true :
      filterDim === "sentiment"           ? s.sentiment === filterValue :
      filterDim === "emotion"             ? s.emotion   === filterValue :
      filterDim === "phase"               ? phase        === filterValue :
      true;
    const matchSearch = !search || s.text.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  /* ── Filter chip groups ── */
  const sentimentOptions = ["Positive", "Neutral", "Negative"] as const;
  const emotionOptions   = [...new Set(sentences.map((s) => s.emotion))].sort();
  const phaseOptions     = ["opening", "middle", "closing"] as const;

  function chipHref(dim: string, val: string) {
    return `/dashboard/sentences?filter=${dim}&value=${encodeURIComponent(val)}`;
  }

  /* ── Page subtitle ── */
  const subtitle =
    filterDim === "emotion" && filterValue !== "all"
      ? `Emotion · ${titleCase(filterValue)}`
      : filterDim === "phase" && filterValue !== "all"
        ? `${PHASE_ICONS[filterValue] ?? ""} ${titleCase(filterValue)} Phase`
        : filterDim === "sentiment" && filterValue !== "all"
          ? `${filterValue} Sentences`
          : "All Sentences";

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
            <h1 className="text-base font-bold">Sentence Analysis — {subtitle}</h1>
            <p className="text-xs text-muted">
              {fileName ?? "conversation"} · {sentences.length} sentences · {overall.sentiment} overall
            </p>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search sentences…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56 rounded-xl border border-border bg-card px-3 py-1.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {/* ── Filter chips — three rows of dimensions ── */}
      <div className="shrink-0 space-y-2 rounded-2xl border border-border bg-card p-3">
        {/* Sentiment filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 shrink-0 text-xs font-semibold text-muted">Sentiment</span>
          {(["all", ...sentimentOptions] as const).map((v) => (
            <a key={v} href={chipHref("sentiment", v)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                filterDim === "sentiment" && filterValue === v
                  ? "border-brand bg-brand text-white"
                  : "border-border hover:border-brand hover:text-brand"
              }`}
            >
              {v === "all" ? "All" : v}
              <span className="ml-1 tabular-nums text-xs opacity-70">
                ({v === "all" ? sentences.length : sentences.filter((s) => s.sentiment === v).length})
              </span>
            </a>
          ))}
        </div>

        {/* Emotion filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 shrink-0 text-xs font-semibold text-muted">Emotion</span>
          {emotionOptions.map((e) => (
            <a key={e} href={chipHref("emotion", e)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                filterDim === "emotion" && filterValue === e
                  ? "border-brand bg-brand text-white"
                  : "border-border hover:border-brand hover:text-brand"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: EMOTION_COLORS[e] }} />
              {titleCase(e)}
              <span className="tabular-nums opacity-70">
                ({sentences.filter((s) => s.emotion === e).length})
              </span>
            </a>
          ))}
        </div>

        {/* Phase filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 shrink-0 text-xs font-semibold text-muted">Phase</span>
          {phaseOptions.map((p) => {
            const count = sentences.filter((s) => getPhaseLabel(s.index, sentences.length) === p).length;
            return (
              <a key={p} href={chipHref("phase", p)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                  filterDim === "phase" && filterValue === p
                    ? "border-brand bg-brand text-white"
                    : "border-border hover:border-brand hover:text-brand"
                }`}
              >
                {PHASE_ICONS[p]} {titleCase(p)}
                <span className="ml-1 tabular-nums opacity-70">({count})</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="w-10 px-4 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Speaker</th>
              <th className="px-3 py-2.5 font-medium">Sentence</th>
              <th className="px-3 py-2.5 font-medium">Sentiment</th>
              <th className="px-3 py-2.5 font-medium">Score</th>
              <th className="px-3 py-2.5 font-medium">Emotion</th>
              <th className="px-3 py-2.5 font-medium">Phase</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-muted">
                  No sentences match this filter.
                </td>
              </tr>
            ) : (
              visible.map((s, i) => {
                const phase = getPhaseLabel(s.index, sentences.length);
                const rowBg =
                  s.sentiment === "Positive" ? "hover:bg-positive/5" :
                  s.sentiment === "Negative" ? "hover:bg-negative/5" : "hover:bg-neutral/5";
                return (
                  <tr key={s.index}
                    className={`border-b border-border/40 last:border-0 transition ${rowBg} ${i % 2 !== 0 ? "bg-background/40" : ""}`}
                  >
                    <td className="w-10 px-4 py-3 font-mono text-xs text-muted">{s.index + 1}</td>
                    <td className="px-3 py-3"><SpeakerChip speaker={s.speaker} /></td>
                    <td className="max-w-sm px-3 py-3">
                      <p className="text-sm leading-relaxed">{s.text}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sentimentBadge(s.sentiment)}`}>
                        {s.sentiment}
                      </span>
                    </td>
                    <td className="px-3 py-3"><ScoreBar score={s.score} /></td>
                    <td className="px-3 py-3"><EmotionPill emotion={s.emotion} /></td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-muted">{PHASE_ICONS[phase]} {titleCase(phase)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-2 text-xs text-muted">
        <span>Showing <strong className="text-foreground">{visible.length}</strong> of <strong className="text-foreground">{sentences.length}</strong> sentences</span>
        <span>Avg score <strong className="text-foreground">{(sentences.reduce((a, s) => a + s.score, 0) / sentences.length).toFixed(2)}</strong></span>
        <span>Model <span className="font-mono">{meta.model}</span></span>
        {search && (
          <button onClick={() => setSearch("")} className="ml-auto text-xs text-negative hover:opacity-80">
            Clear search ✕
          </button>
        )}
      </div>
    </div>
  );
}
