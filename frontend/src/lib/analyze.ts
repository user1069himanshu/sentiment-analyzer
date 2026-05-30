import OpenAI from "openai";
import {
  AnalysisResult,
  CallKPIs,
  Emotion,
  RiskLevel,
  Sentiment,
  SentenceAnalysis,
  Trend,
} from "./types";
import { RawSentence, segmentTranscript } from "./segment";

const EMOTIONS: Emotion[] = [
  "joy",
  "satisfaction",
  "anger",
  "frustration",
  "sadness",
  "fear",
  "neutral",
];

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Analyze a transcript. Prefers OpenAI when a key is configured, otherwise
 * returns a deterministic lexicon-based mock so the app is fully demoable with
 * zero configuration. (The primary production path forwards to n8n upstream of
 * this; see /api/analyze.)
 */
export async function analyzeText(text: string): Promise<AnalysisResult> {
  const sentences = segmentTranscript(text);
  if (sentences.length === 0) {
    throw new Error("No analyzable text found in the upload.");
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return await analyzeWithOpenAI(text, sentences);
    } catch (err) {
      console.error("OpenAI analysis failed, falling back to mock:", err);
    }
  }
  return mockAnalyze(sentences);
}

// ---------------------------------------------------------------------------
// OpenAI path
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a contact-center conversation analyst. You receive a phone-call transcript and return a strict JSON object analyzing sentiment and emotion. Be objective and base every judgement on the text. Sentiment is one of "Positive", "Negative", "Neutral". Emotion is one of joy, satisfaction, anger, frustration, sadness, fear, neutral. Scores range -1.0 (very negative) to 1.0 (very positive).`;

function buildUserPrompt(sentences: RawSentence[]): string {
  const numbered = sentences
    .map((s) => `${s.index}\t${s.speaker ?? "Unknown"}\t${s.text}`)
    .join("\n");
  return `Analyze this transcript. Each line is: index<TAB>speaker<TAB>text.

${numbered}

Return ONLY a JSON object with this exact shape:
{
  "overall": { "sentiment": Sentiment, "score": number, "confidence": number, "reasoning": string },
  "sentences": [ { "index": number, "sentiment": Sentiment, "score": number, "emotion": Emotion } ],
  "emotions": { "joy": number, "satisfaction": number, "anger": number, "frustration": number, "sadness": number, "fear": number, "neutral": number },
  "summary": string,
  "kpis": {
    "csat_proxy": number (0-100),
    "sentiment_trend": "improving"|"declining"|"flat",
    "churn_risk": "low"|"medium"|"high",
    "escalation_risk": "low"|"medium"|"high",
    "resolution": "resolved"|"partial"|"unresolved",
    "empathy_score": number (0-100),
    "key_topics": string[],
    "agent_sentiment": Sentiment|null,
    "customer_sentiment": Sentiment|null
  }
}
The "emotions" values are a distribution that sums to 1. Include one sentences[] entry per input index. "reasoning" is one or two sentences explaining the overall verdict.`;
}

async function analyzeWithOpenAI(
  text: string,
  sentences: RawSentence[]
): Promise<AnalysisResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(sentences) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI.");
  const parsed = JSON.parse(content);

  // Merge model's per-sentence analysis back onto our segmented text.
  const byIndex = new Map<number, { sentiment: Sentiment; score: number; emotion: Emotion }>();
  for (const s of parsed.sentences ?? []) {
    byIndex.set(s.index, {
      sentiment: s.sentiment,
      score: clampScore(s.score),
      emotion: EMOTIONS.includes(s.emotion) ? s.emotion : "neutral",
    });
  }
  const merged: SentenceAnalysis[] = sentences.map((s) => {
    const a = byIndex.get(s.index);
    return {
      index: s.index,
      speaker: s.speaker,
      text: s.text,
      sentiment: a?.sentiment ?? "Neutral",
      score: a?.score ?? 0,
      emotion: a?.emotion ?? "neutral",
    };
  });

  return {
    overall: {
      sentiment: parsed.overall?.sentiment ?? "Neutral",
      score: clampScore(parsed.overall?.score ?? 0),
      confidence: clamp01(parsed.overall?.confidence ?? 0.7),
      reasoning: parsed.overall?.reasoning ?? "",
    },
    sentences: merged,
    emotions: normalizeEmotions(parsed.emotions),
    summary: parsed.summary ?? "",
    kpis: sanitizeKpis(parsed.kpis, merged),
    meta: {
      sentence_count: merged.length,
      model: OPENAI_MODEL,
      source: "openai",
      processed_at: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Mock path (deterministic lexicon — no key required)
// ---------------------------------------------------------------------------

const POSITIVE = ["great","good","thank","thanks","appreciate","happy","glad","wonderful","helpful","resolved","working","perfect","love","excellent","fixed","pleasure"];
const NEGATIVE = ["frustrated","upset","angry","annoyed","down","broken","issue","problem","wrong","terrible","bad","disappointed","unhappy","slow","never","worst","fail","stressful"];
const EMOTION_WORDS: Record<Emotion, string[]> = {
  joy: ["happy", "glad", "wonderful", "love", "great"],
  satisfaction: ["thank", "appreciate", "resolved", "helpful", "perfect", "pleasure"],
  anger: ["angry", "furious", "unacceptable", "worst"],
  frustration: ["frustrated", "annoyed", "again", "still", "never", "stressful"],
  sadness: ["down", "disappointed", "unhappy", "sad"],
  fear: ["worried", "afraid", "scared", "concerned"],
  neutral: [],
};

function mockAnalyze(sentences: RawSentence[]): AnalysisResult {
  const analyzed: SentenceAnalysis[] = sentences.map((s) => {
    const lower = s.text.toLowerCase();
    const pos = POSITIVE.filter((w) => lower.includes(w)).length;
    const neg = NEGATIVE.filter((w) => lower.includes(w)).length;
    const raw = (pos - neg) / Math.max(1, pos + neg);
    const score = clampScore(raw);
    return {
      index: s.index,
      speaker: s.speaker,
      text: s.text,
      sentiment: toSentiment(score),
      score,
      emotion: pickEmotion(lower, score),
    };
  });

  const emotions = distribution(analyzed.map((s) => s.emotion));
  const overallScore = clampScore(avg(analyzed.map((s) => s.score)));
  const kpis = sanitizeKpis(undefined, analyzed);

  return {
    overall: {
      sentiment: toSentiment(overallScore),
      score: overallScore,
      confidence: 0.5,
      reasoning:
        "Heuristic (mock) analysis: net sentiment derived from a positive/negative keyword lexicon. Configure OPENAI_API_KEY or N8N_WEBHOOK_URL for LLM-grade reasoning.",
    },
    sentences: analyzed,
    emotions,
    summary: mockSummary(analyzed),
    kpis,
    meta: {
      sentence_count: analyzed.length,
      model: "mock-lexicon-v1",
      source: "mock",
      processed_at: new Date().toISOString(),
    },
  };
}

function pickEmotion(lower: string, score: number): Emotion {
  for (const e of EMOTIONS) {
    if (EMOTION_WORDS[e].some((w) => lower.includes(w))) return e;
  }
  if (score > 0.25) return "satisfaction";
  if (score < -0.25) return "frustration";
  return "neutral";
}

function mockSummary(s: SentenceAnalysis[]): string {
  const speakers = [...new Set(s.map((x) => x.speaker).filter(Boolean))];
  const who = speakers.length ? speakers.join(" and ") : "the participants";
  const tone = toSentiment(avg(s.map((x) => x.score))).toLowerCase();
  return `A ${s.length}-sentence conversation between ${who} with an overall ${tone} tone.`;
}

// ---------------------------------------------------------------------------
// KPI derivation + sanitizers (shared)
// ---------------------------------------------------------------------------

function sanitizeKpis(
  raw: Partial<CallKPIs> | undefined,
  sentences: SentenceAnalysis[]
): CallKPIs {
  const derived = deriveKpis(sentences);
  if (!raw) return derived;
  return {
    csat_proxy: clampInt(raw.csat_proxy, derived.csat_proxy, 0, 100),
    sentiment_trend: oneOf<Trend>(raw.sentiment_trend, ["improving", "declining", "flat"], derived.sentiment_trend),
    churn_risk: oneOf<RiskLevel>(raw.churn_risk, ["low", "medium", "high"], derived.churn_risk),
    escalation_risk: oneOf<RiskLevel>(raw.escalation_risk, ["low", "medium", "high"], derived.escalation_risk),
    resolution: oneOf(raw.resolution, ["resolved", "partial", "unresolved"], derived.resolution),
    empathy_score: clampInt(raw.empathy_score, derived.empathy_score, 0, 100),
    key_topics: Array.isArray(raw.key_topics) && raw.key_topics.length ? raw.key_topics.slice(0, 6) : derived.key_topics,
    agent_sentiment: raw.agent_sentiment ?? derived.agent_sentiment,
    customer_sentiment: raw.customer_sentiment ?? derived.customer_sentiment,
  };
}

function deriveKpis(sentences: SentenceAnalysis[]): CallKPIs {
  const scores = sentences.map((s) => s.score);
  const overall = avg(scores);
  const firstHalf = avg(scores.slice(0, Math.ceil(scores.length / 2)));
  const secondHalf = avg(scores.slice(Math.ceil(scores.length / 2)));
  const delta = secondHalf - firstHalf;

  const agent = speakerSentiment(sentences, "Agent");
  const customer = speakerSentiment(sentences, "Customer");

  const csat = Math.round(((overall + 1) / 2) * 100);
  const trend: Trend = delta > 0.1 ? "improving" : delta < -0.1 ? "declining" : "flat";
  const churn: RiskLevel = customerScore(customer) < -0.2 ? "high" : customerScore(customer) < 0 ? "medium" : "low";

  return {
    csat_proxy: csat,
    sentiment_trend: trend,
    churn_risk: churn,
    escalation_risk: overall < -0.2 && trend !== "improving" ? "high" : overall < 0 ? "medium" : "low",
    resolution: secondHalf > 0.2 ? "resolved" : secondHalf > -0.1 ? "partial" : "unresolved",
    empathy_score: Math.round(((Math.max(0, agentScore(agent)) + 1) / 2) * 100),
    key_topics: [],
    agent_sentiment: agent,
    customer_sentiment: customer,
  };
}

function speakerSentiment(sentences: SentenceAnalysis[], speaker: string): Sentiment | null {
  const subset = sentences.filter((s) => s.speaker?.toLowerCase() === speaker.toLowerCase());
  if (!subset.length) return null;
  return toSentiment(avg(subset.map((s) => s.score)));
}

function customerScore(s: Sentiment | null): number {
  return s === "Negative" ? -0.5 : s === "Positive" ? 0.5 : 0;
}
function agentScore(s: Sentiment | null): number {
  return s === "Positive" ? 0.6 : s === "Negative" ? -0.4 : 0.1;
}

// ---------------------------------------------------------------------------
// Small numeric helpers
// ---------------------------------------------------------------------------

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
function clampScore(n: number): number {
  return Math.max(-1, Math.min(1, typeof n === "number" && !Number.isNaN(n) ? n : 0));
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, typeof n === "number" && !Number.isNaN(n) ? n : 0));
}
function clampInt(n: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return fallback;
  return Math.round(Math.max(min, Math.min(max, n)));
}
function toSentiment(score: number): Sentiment {
  if (score > 0.15) return "Positive";
  if (score < -0.15) return "Negative";
  return "Neutral";
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}
function distribution(items: Emotion[]): Record<Emotion, number> {
  const counts = Object.fromEntries(EMOTIONS.map((e) => [e, 0])) as Record<Emotion, number>;
  for (const e of items) counts[e]++;
  const total = items.length || 1;
  for (const e of EMOTIONS) counts[e] = +(counts[e] / total).toFixed(3);
  return counts;
}
function normalizeEmotions(raw: unknown): Record<Emotion, number> {
  const base = Object.fromEntries(EMOTIONS.map((e) => [e, 0])) as Record<Emotion, number>;
  if (raw && typeof raw === "object") {
    for (const e of EMOTIONS) {
      const v = (raw as Record<string, unknown>)[e];
      if (typeof v === "number" && !Number.isNaN(v)) base[e] = v;
    }
  }
  const total = Object.values(base).reduce((a, b) => a + b, 0);
  if (total > 0) for (const e of EMOTIONS) base[e] = +(base[e] / total).toFixed(3);
  return base;
}
