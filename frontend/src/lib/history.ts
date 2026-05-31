import type { AnalysisResult, Sentiment } from "./types";

// Client-side persistence of analyzed calls (browser localStorage).
// Swap this module for a DB-backed API later for cross-device history.

export interface StoredAnalysis {
  id: string;
  fileName: string;
  createdAt: string; // ISO timestamp
  result: AnalysisResult;
}

const KEY = "sa_history";
const MAX_ENTRIES = 200;

export function getHistory(): StoredAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(
  fileName: string | null,
  result: AnalysisResult
): StoredAnalysis {
  const entry: StoredAnalysis = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: fileName ?? "conversation",
    createdAt: new Date().toISOString(),
    result,
  };
  const next = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota or unavailable — non-fatal */
  }
  return entry;
}

export function deleteAnalysis(id: string): void {
  const next = getHistory().filter((e) => e.id !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}

// ---------------------------------------------------------------------------
// Aggregation across all stored calls
// ---------------------------------------------------------------------------

export interface TopicCount {
  topic: string;
  count: number;
}

export interface Aggregate {
  totalCalls: number;
  avgCsat: number;
  avgNps: number;
  avgEmpathy: number;
  avgScore: number;
  sentimentCounts: Record<Sentiment, number>;
  resolutionCounts: { resolved: number; partial: number; unresolved: number };
  topTopics: TopicCount[];
  highRisk: StoredAnalysis[];
}

export function isHighRisk(a: StoredAnalysis): boolean {
  const k = a.result.kpis;
  return (
    k.churn_risk === "high" ||
    k.escalation_risk === "high" ||
    a.result.overall.sentiment === "Negative"
  );
}

export function aggregate(history: StoredAnalysis[]): Aggregate {
  const n = history.length;
  const sentimentCounts: Record<Sentiment, number> = { Positive: 0, Negative: 0, Neutral: 0 };
  const resolutionCounts = { resolved: 0, partial: 0, unresolved: 0 };
  const topicMap = new Map<string, number>();
  let csat = 0, nps = 0, empathy = 0, score = 0;

  for (const a of history) {
    const r = a.result;
    sentimentCounts[r.overall.sentiment]++;
    resolutionCounts[r.kpis.resolution]++;
    csat += r.kpis.csat_proxy;
    nps += r.kpis.nps_proxy;
    empathy += r.kpis.empathy_score;
    score += r.overall.score;
    for (const t of r.kpis.key_topics ?? []) {
      const key = t.trim().toLowerCase();
      if (!key) continue;
      topicMap.set(key, (topicMap.get(key) ?? 0) + 1);
    }
  }

  const topTopics = [...topicMap.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalCalls: n,
    avgCsat: n ? Math.round(csat / n) : 0,
    avgNps: n ? Math.round(nps / n) : 0,
    avgEmpathy: n ? Math.round(empathy / n) : 0,
    avgScore: n ? +(score / n).toFixed(2) : 0,
    sentimentCounts,
    resolutionCounts,
    topTopics,
    highRisk: history.filter(isHighRisk),
  };
}
