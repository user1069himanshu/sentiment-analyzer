// Canonical data contract shared by UI, /api/analyze, and the n8n workflow.
// Keep in sync with docs/architecture.md.

export type Sentiment = "Positive" | "Negative" | "Neutral";

export type Emotion =
  | "joy"
  | "satisfaction"
  | "anger"
  | "frustration"
  | "sadness"
  | "fear"
  | "neutral";

export interface SentenceAnalysis {
  index: number;
  speaker: string | null; // "Agent" | "Customer" | null when unlabeled
  text: string;
  sentiment: Sentiment;
  score: number; // -1.0 .. 1.0
  emotion: Emotion;
}

export interface OverallAnalysis {
  sentiment: Sentiment;
  score: number; // -1.0 .. 1.0
  confidence: number; // 0 .. 1
  reasoning: string;
}

export type RiskLevel = "low" | "medium" | "high";
export type Resolution = "resolved" | "partial" | "unresolved";
export type Trend = "improving" | "declining" | "flat";

export interface CallKPIs {
  csat_proxy: number; // 0 .. 100
  sentiment_trend: Trend;
  churn_risk: RiskLevel;
  escalation_risk: RiskLevel;
  resolution: Resolution;
  empathy_score: number; // 0 .. 100
  key_topics: string[];
  agent_sentiment: Sentiment | null;
  customer_sentiment: Sentiment | null;
}

export interface AnalysisResult {
  overall: OverallAnalysis;
  sentences: SentenceAnalysis[];
  emotions: Record<Emotion, number>; // distribution, sums to ~1
  summary: string;
  kpis: CallKPIs;
  meta: {
    sentence_count: number;
    model: string;
    source: "n8n" | "openai" | "mock";
    processed_at: string;
  };
}
