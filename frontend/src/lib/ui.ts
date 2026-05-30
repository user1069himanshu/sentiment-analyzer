import type { Emotion, RiskLevel, Sentiment } from "./types";

export function sentimentColor(s: Sentiment): string {
  return s === "Positive"
    ? "var(--positive)"
    : s === "Negative"
      ? "var(--negative)"
      : "var(--neutral)";
}

export function sentimentBadge(s: Sentiment): string {
  return s === "Positive"
    ? "bg-positive/10 text-positive"
    : s === "Negative"
      ? "bg-negative/10 text-negative"
      : "bg-neutral/15 text-muted";
}

export function riskBadge(r: RiskLevel): string {
  return r === "high"
    ? "bg-negative/10 text-negative"
    : r === "medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-positive/10 text-positive";
}

export const EMOTION_COLORS: Record<Emotion, string> = {
  joy: "#f59e0b",
  satisfaction: "#16a34a",
  anger: "#dc2626",
  frustration: "#ea580c",
  sadness: "#2563eb",
  fear: "#7c3aed",
  neutral: "#9ca3af",
  surprise: "#06b6d4",
  disgust: "#84cc16",
  anticipation: "#f97316",
};

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
