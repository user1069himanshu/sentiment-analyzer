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

const AXIS_STYLE = { fontSize: 10, fill: "var(--muted-foreground, #9ca3af)" };
const LABEL_STYLE = { fontSize: 10, fill: "var(--muted-foreground, #9ca3af)" };

export function SentimentTimeline({ sentences }: { sentences: SentenceAnalysis[] }) {
  const data = sentences.map((s) => ({
    index: s.index + 1,
    score: +s.score.toFixed(2),
    speaker: s.speaker ?? "—",
  }));

  return (
    <ResponsiveContainer width="100%" height={175}>
      <LineChart data={data} margin={{ top: 4, right: 12, bottom: 28, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="index"
          tick={AXIS_STYLE}
          stroke="var(--border)"
          label={{ value: "Utterance #", position: "insideBottom", offset: -14, style: LABEL_STYLE }}
        />
        <YAxis
          domain={[-1, 1]}
          tick={AXIS_STYLE}
          stroke="var(--border)"
          tickCount={5}
          label={{ value: "Sentiment Score", angle: -90, position: "insideLeft", offset: 18, style: LABEL_STYLE }}
        />
        <ReferenceLine y={0} stroke="var(--muted)" strokeDasharray="4 2" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(v) => [`${v}`, "Score"]}
          labelFormatter={(l) => `Utterance ${l}`}
        />
        <Line type="monotone" dataKey="score" stroke="var(--brand)" strokeWidth={2} dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EmotionChart({ emotions }: { emotions: Record<Emotion, number> }) {
  const data = (Object.entries(emotions) as [Emotion, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, value]) => ({
      emotion: titleCase(emotion),
      short: titleCase(emotion).slice(0, 4),   // abbreviated for tight X axis
      key: emotion,
      pct: Math.round(value * 100),
    }));

  if (data.length === 0) {
    return <p className="text-sm text-muted">No emotion signal detected.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={175}>
      <BarChart data={data} margin={{ top: 4, right: 12, bottom: 28, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="short"
          tick={AXIS_STYLE}
          stroke="var(--border)"
          label={{ value: "Emotion", position: "insideBottom", offset: -14, style: LABEL_STYLE }}
        />
        <YAxis
          unit="%"
          tick={AXIS_STYLE}
          stroke="var(--border)"
          label={{ value: "Share (%)", angle: -90, position: "insideLeft", offset: 18, style: LABEL_STYLE }}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(v, _n, entry) => [`${v}%`, (entry.payload as { emotion: string }).emotion]}
        />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
          {data.map((d) => <Cell key={d.key} fill={EMOTION_COLORS[d.key]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
