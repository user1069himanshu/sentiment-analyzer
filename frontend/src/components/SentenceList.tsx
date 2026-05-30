"use client";

import type { SentenceAnalysis } from "@/lib/types";
import { EMOTION_COLORS, sentimentBadge, titleCase } from "@/lib/ui";

export default function SentenceList({
  sentences,
}: {
  sentences: SentenceAnalysis[];
}) {
  return (
    <ul className="space-y-2">
      {sentences.map((s) => (
        <li
          key={s.index}
          className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
        >
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: EMOTION_COLORS[s.emotion] }}
            title={titleCase(s.emotion)}
          />
          <div className="min-w-0 flex-1">
            {s.speaker && (
              <span className="mr-2 text-xs font-semibold text-muted">
                {s.speaker}
              </span>
            )}
            <span className="text-sm">{s.text}</span>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${sentimentBadge(
              s.sentiment
            )}`}
          >
            {s.sentiment}
          </span>
        </li>
      ))}
    </ul>
  );
}
