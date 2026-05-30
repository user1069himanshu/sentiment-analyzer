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

export function SentimentTimeline({
  sentences,
}: {
  sentences: SentenceAnalysis[];
}) {
  const data = sentences.map((s) => ({
    index: s.index + 1,
    score: +s.score.toFixed(2),
    speaker: s.speaker ?? "—",
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="index" tick={{ fontSize: 11 }} stroke="var(--muted)" />
        <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} stroke="var(--muted)" />
        <ReferenceLine y={0} stroke="var(--muted)" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(value) => [`${value}`, "score"]}
          labelFormatter={(l) => `Sentence ${l}`}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--brand)"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EmotionChart({
  emotions,
}: {
  emotions: Record<Emotion, number>;
}) {
  const data = (Object.entries(emotions) as [Emotion, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, value]) => ({
      emotion: titleCase(emotion),
      key: emotion,
      pct: Math.round(value * 100),
    }));

  if (data.length === 0) {
    return <p className="text-sm text-muted">No emotion signal detected.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="emotion" tick={{ fontSize: 11 }} stroke="var(--muted)" />
        <YAxis unit="%" tick={{ fontSize: 11 }} stroke="var(--muted)" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(value) => [`${value}%`, "share"]}
        />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.key} fill={EMOTION_COLORS[d.key]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
