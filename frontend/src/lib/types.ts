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
  | "neutral"
  | "surprise"
  | "disgust"
  | "anticipation";

export interface SentenceAnalysis {
  index: number;
  speaker: string | null;
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

export interface CallPhaseSentiment {
  opening: Sentiment;
  middle: Sentiment;
  closing: Sentiment;
}

export interface TalkListenRatio {
  agent: number;   // percentage 0–100
  customer: number;
  unknown: number;
}

export interface CallKPIs {
  // --- original ---
  csat_proxy: number;          // 0 .. 100
  sentiment_trend: Trend;
  churn_risk: RiskLevel;
  escalation_risk: RiskLevel;
  resolution: Resolution;
  empathy_score: number;       // 0 .. 100
  key_topics: string[];
  agent_sentiment: Sentiment | null;
  customer_sentiment: Sentiment | null;
  // --- new ---
  nps_proxy: number;           // -100 .. 100  (Net Promoter Score estimate)
  agent_compliance: number;    // 0 .. 100  (script adherence: greet/empathize/solve/close)
  emotion_intensity: number;   // 0 .. 100  (peak negative moment magnitude)
  silence_score: number;       // 0 .. 100  (higher = more substantive, less filler)
  interruption_risk: RiskLevel;
  talk_listen_ratio: TalkListenRatio;
  call_phase_sentiment: CallPhaseSentiment;
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
