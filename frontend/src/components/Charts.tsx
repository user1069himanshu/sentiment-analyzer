"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Emotion, SentenceAnalysis } from "@/lib/types";
import { EMOTION_COLORS, titleCase } from "@/lib/ui";

const TICK  = { fontSize: 10, fill: "#9ca3af" };
const LABEL = { fontSize: 10, fill: "#9ca3af" };

/* ── Sentiment timeline (line chart) ── */
export function SentimentTimeline({ sentences }: { sentences: SentenceAnalysis[] }) {
  const data = sentences.map((s) => ({
    index: s.index + 1,
    score: +s.score.toFixed(2),
    speaker: s.speaker ?? "—",
  }));

  return (
    <ResponsiveContainer width="100%" height={175}>
      <LineChart data={data} margin={{ top: 6, right: 16, bottom: 32, left: 54 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

        {/* X axis — "Utterance #" label below ticks */}
        <XAxis
          dataKey="index"
          tick={TICK}
          stroke="var(--border)"
          label={{
            value: "Utterance #",
            position: "insideBottom",
            offset: -14,
            style: LABEL,
          }}
        />

        {/* Y axis — "Score" label rotated left of tick numbers */}
        <YAxis
          domain={[-1, 1]}
          tick={TICK}
          stroke="var(--border)"
          tickCount={5}
          width={38}
          label={{
            value: "Score",
            angle: -90,
            position: "insideLeft",
            dx: -28,          // push label into left margin, clear of tick numbers
            dy: 22,
            style: LABEL,
          }}
        />

        <ReferenceLine y={0} stroke="var(--muted)" strokeDasharray="4 2" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(v) => [`${v}`, "Score"]}
          labelFormatter={(l) => `Utterance ${l}`}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--brand)"
          strokeWidth={2}
          dot={{ r: 2 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Emotion fingerprint (bar chart) ── */
export function EmotionChart({
  emotions,
  onBarClick,
}: {
  emotions: Record<Emotion, number>;
  onBarClick?: (emotion: Emotion) => void;
}) {
  const data = (Object.entries(emotions) as [Emotion, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, value]) => ({
      emotion: titleCase(emotion),
      short: titleCase(emotion).slice(0, 5),   // 5-char abbreviation
      key: emotion as Emotion,
      pct: Math.round(value * 100),
    }));

  if (data.length === 0) {
    return <p className="text-sm text-muted">No emotion signal detected.</p>;
  }

  const clickable = !!onBarClick;

  return (
    <ResponsiveContainer width="100%" height={175}>
      <BarChart data={data} margin={{ top: 6, right: 16, bottom: 32, left: 54 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

        {/* X axis */}
        <XAxis
          dataKey="short"
          tick={TICK}
          stroke="var(--border)"
          label={{
            value: "Emotion",
            position: "insideBottom",
            offset: -14,
            style: LABEL,
          }}
        />

        {/* Y axis */}
        <YAxis
          unit="%"
          tick={TICK}
          stroke="var(--border)"
          width={38}
          label={{
            value: "Share %",
            angle: -90,
            position: "insideLeft",
            dx: -28,
            dy: 22,
            style: LABEL,
          }}
        />

        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(v, _n, entry) => [
            `${v}%`,
            (entry.payload as { emotion: string }).emotion,
          ]}
          cursor={clickable ? { fill: "rgba(0,0,0,0.06)" } : undefined}
        />

        <Bar
          dataKey="pct"
          radius={[4, 4, 0, 0]}
          style={clickable ? { cursor: "pointer" } : undefined}
          onClick={(d: unknown) => {
            if (onBarClick) onBarClick((d as { key: Emotion }).key);
          }}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={EMOTION_COLORS[d.key]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
