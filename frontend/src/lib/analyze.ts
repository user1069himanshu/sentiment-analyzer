import OpenAI from "openai";
import {
  AnalysisResult,
  CallKPIs,
  CallPhaseSentiment,
  Emotion,
  RiskLevel,
  Sentiment,
  SentenceAnalysis,
  TalkListenRatio,
  Trend,
} from "./types";
import { RawSentence, segmentTranscript } from "./segment";

const EMOTIONS: Emotion[] = [
  "joy", "satisfaction", "anger", "frustration",
  "sadness", "fear", "neutral", "surprise", "disgust", "anticipation",
];

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

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

const SYSTEM_PROMPT = `You are a contact-center conversation analyst. You receive a phone-call transcript and return a strict JSON object. Be objective — every judgment must be grounded in the text.
Definitions:
- Sentiment: "Positive" | "Negative" | "Neutral"
- Emotion: joy | satisfaction | anger | frustration | sadness | fear | neutral | surprise | disgust | anticipation
- Score: -1.0 (very negative) to 1.0 (very positive)
Think step by step before assigning KPI values. Use the derivation rules in the user prompt.`;

function buildUserPrompt(sentences: RawSentence[]): string {
  const numbered = sentences
    .map((s) => `${s.index}\t${s.speaker ?? "Unknown"}\t${s.text}`)
    .join("\n");

  return `Analyze this transcript. Each line: index<TAB>speaker<TAB>text.

${numbered}

Return ONLY this JSON shape (no markdown, no explanation outside the JSON):
{
  "overall": { "sentiment": Sentiment, "score": number, "confidence": number, "reasoning": string },
  "sentences": [ { "index": number, "sentiment": Sentiment, "score": number, "emotion": Emotion } ],
  "emotions": { "joy": 0, "satisfaction": 0, "anger": 0, "frustration": 0, "sadness": 0, "fear": 0, "neutral": 0, "surprise": 0, "disgust": 0, "anticipation": 0 },
  "summary": string,
  "kpis": {
    "csat_proxy": number,
    "nps_proxy": number,
    "sentiment_trend": "improving"|"declining"|"flat",
    "churn_risk": "low"|"medium"|"high",
    "escalation_risk": "low"|"medium"|"high",
    "resolution": "resolved"|"partial"|"unresolved",
    "empathy_score": number,
    "agent_compliance": number,
    "emotion_intensity": number,
    "silence_score": number,
    "interruption_risk": "low"|"medium"|"high",
    "key_topics": string[],
    "agent_sentiment": Sentiment|null,
    "customer_sentiment": Sentiment|null,
    "call_phase_sentiment": { "opening": Sentiment, "middle": Sentiment, "closing": Sentiment }
  }
}

KPI derivation rules (follow these exactly):
- csat_proxy (0-100): High (>70) if resolution=resolved AND customer tone is positive. Low (<40) if unresolved AND negative. Scale to 100, NOT 10.
- nps_proxy (-100 to 100): Count customer sentences with score>0.5 as promoters, score<-0.3 as detractors. Formula: round((promoters-detractors)/total_customer_sentences*100). If no labeled customers, use overall score: round(overall_score*100).
- churn_risk: "high" if customer_sentiment=Negative AND resolution≠resolved. "low" if Positive AND resolved. "medium" otherwise.
- escalation_risk: "high" if anger/frustration emotions dominate AND resolution≠resolved. "low" if resolved positively.
- empathy_score (0-100): Did agent: acknowledge feelings (+20), apologize (+20), offer solution (+20), follow through (+20), close warmly (+20)? Sum present behaviors × 20. Scale to 100, NOT 10.
- agent_compliance (0-100): Did agent: greet (+20), empathize (+20), offer resolution (+20), resolve the issue (+20), close politely (+20)? Sum present × 20.
- emotion_intensity (0-100): Peak negative emotion magnitude. Find the sentence with the most negative score; intensity = round(abs(min_score) * 100).
- silence_score (0-100): Proxy for call quality. Higher = more substantive exchange, less dead air. Score based on sentence length variety and absence of filler phrases. 70+ = good.
- interruption_risk: "high" if speakers alternate every 1-2 sentences frequently with negative sentiment. "low" if turns are long and calm.
- call_phase_sentiment: split sentences into thirds (opening=first third, middle=middle third, closing=last third), assign dominant Sentiment to each.
- talk_listen_ratio: NOT in JSON — computed server-side from speaker counts.
- emotions: distribution summing to 1.0.
- reasoning: 2-3 sentences with chain-of-thought explanation of overall verdict.`;
}

async function analyzeWithOpenAI(
  text: string,
  sentences: RawSentence[]
): Promise<AnalysisResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(sentences) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI.");
  const parsed = JSON.parse(content);

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
// Mock path
// ---------------------------------------------------------------------------

const POSITIVE = ["great","good","thank","thanks","appreciate","happy","glad","wonderful","helpful","resolved","working","perfect","love","excellent","fixed","pleasure","amazing","fantastic"];
const NEGATIVE = ["frustrated","upset","angry","annoyed","down","broken","issue","problem","wrong","terrible","bad","disappointed","unhappy","slow","never","worst","fail","stressful","unacceptable"];
const EMOTION_WORDS: Record<Emotion, string[]> = {
  joy: ["happy", "glad", "wonderful", "love", "great", "amazing"],
  satisfaction: ["thank", "appreciate", "resolved", "helpful", "perfect", "pleasure", "fantastic"],
  anger: ["angry", "furious", "unacceptable", "worst", "outrageous"],
  frustration: ["frustrated", "annoyed", "again", "still", "never", "stressful"],
  sadness: ["down", "disappointed", "unhappy", "sad", "sorry"],
  fear: ["worried", "afraid", "scared", "concerned", "anxious"],
  neutral: [],
  surprise: ["wow", "really", "unexpected", "finally", "actually"],
  disgust: ["horrible", "awful", "disgusting", "ridiculous"],
  anticipation: ["hope", "expect", "waiting", "will", "soon"],
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
// KPI derivation + sanitizers (shared by OpenAI and mock paths)
// ---------------------------------------------------------------------------

function sanitizeKpis(
  raw: Partial<CallKPIs> | undefined,
  sentences: SentenceAnalysis[]
): CallKPIs {
  const derived = deriveKpis(sentences);
  if (!raw) return derived;

  const r = raw as Record<string, unknown>;

  const phaseRaw = r.call_phase_sentiment as Partial<CallPhaseSentiment> | undefined;
  const SENTS = ["Positive", "Negative", "Neutral"] as const;
  const phase: CallPhaseSentiment = {
    opening: oneOf(phaseRaw?.opening, SENTS, derived.call_phase_sentiment.opening),
    middle: oneOf(phaseRaw?.middle, SENTS, derived.call_phase_sentiment.middle),
    closing: oneOf(phaseRaw?.closing, SENTS, derived.call_phase_sentiment.closing),
  };

  const rawNps = typeof r.nps_proxy === "number" ? r.nps_proxy : derived.nps_proxy;

  return {
    csat_proxy: normalizeScale(r.csat_proxy, derived.csat_proxy, 0, 100),
    nps_proxy: Math.round(Math.max(-100, Math.min(100, isFinite(rawNps) ? rawNps : derived.nps_proxy))),
    sentiment_trend: oneOf<Trend>(r.sentiment_trend, ["improving", "declining", "flat"], derived.sentiment_trend),
    churn_risk: oneOf<RiskLevel>(r.churn_risk, ["low", "medium", "high"], derived.churn_risk),
    escalation_risk: oneOf<RiskLevel>(r.escalation_risk, ["low", "medium", "high"], derived.escalation_risk),
    resolution: oneOf(r.resolution, ["resolved", "partial", "unresolved"] as const, derived.resolution),
    empathy_score: normalizeScale(r.empathy_score, derived.empathy_score, 0, 100),
    agent_compliance: normalizeScale(r.agent_compliance, derived.agent_compliance, 0, 100),
    emotion_intensity: normalizeScale(r.emotion_intensity, derived.emotion_intensity, 0, 100),
    silence_score: normalizeScale(r.silence_score, derived.silence_score, 0, 100),
    interruption_risk: oneOf<RiskLevel>(r.interruption_risk, ["low", "medium", "high"], derived.interruption_risk),
    key_topics: Array.isArray(r.key_topics) && (r.key_topics as unknown[]).length
      ? (r.key_topics as string[]).slice(0, 6)
      : derived.key_topics,
    agent_sentiment: SENTS.includes(r.agent_sentiment as Sentiment) ? (r.agent_sentiment as Sentiment) : derived.agent_sentiment,
    customer_sentiment: SENTS.includes(r.customer_sentiment as Sentiment) ? (r.customer_sentiment as Sentiment) : derived.customer_sentiment,
    talk_listen_ratio: derived.talk_listen_ratio,
    call_phase_sentiment: phase,
  };
}

function deriveKpis(sentences: SentenceAnalysis[]): CallKPIs {
  const scores = sentences.map((s) => s.score);
  const overall = avg(scores);
  const n = scores.length;
  const t1 = Math.floor(n / 3);
  const t2 = Math.floor((2 * n) / 3);
  const firstHalf = avg(scores.slice(0, Math.ceil(n / 2)));
  const secondHalf = avg(scores.slice(Math.ceil(n / 2)));
  const delta = secondHalf - firstHalf;

  const agentSent = speakerSentiment(sentences, "Agent");
  const customerSent = speakerSentiment(sentences, "Customer");

  // talk/listen ratio
  const talkRatio = deriveTalkRatio(sentences);

  // NPS proxy
  const customerSentences = sentences.filter(
    (s) => s.speaker?.toLowerCase() === "customer"
  );
  const total = customerSentences.length || sentences.length;
  const src = customerSentences.length ? customerSentences : sentences;
  const promoters = src.filter((s) => s.score > 0.5).length;
  const detractors = src.filter((s) => s.score < -0.3).length;
  const nps = Math.round(((promoters - detractors) / total) * 100);

  // emotion intensity: worst single-sentence score
  const minScore = scores.length ? Math.min(...scores) : 0;
  const emotionIntensity = Math.round(Math.abs(minScore) * 100);

  // silence score: sentences with meaningful length vs filler
  const substantive = sentences.filter((s) => s.text.split(" ").length > 4).length;
  const silenceScore = Math.round((substantive / Math.max(1, sentences.length)) * 100);

  // interruption risk: rapid alternation with negative sentiment
  let alterCount = 0;
  for (let i = 1; i < sentences.length; i++) {
    if (sentences[i].speaker !== sentences[i - 1].speaker) alterCount++;
  }
  const alterRate = alterCount / Math.max(1, sentences.length - 1);
  const interruptRisk: RiskLevel = alterRate > 0.8 && overall < -0.1 ? "high" : alterRate > 0.6 ? "medium" : "low";

  // call phase sentiment
  const phaseOf = (third: 0|1|2): Sentiment => {
    const slice = third === 0
      ? scores.slice(0, t1)
      : third === 1
        ? scores.slice(t1, t2)
        : scores.slice(t2);
    return toSentiment(avg(slice));
  };

  const csat = Math.round(((overall + 1) / 2) * 100);
  const trend: Trend = delta > 0.1 ? "improving" : delta < -0.1 ? "declining" : "flat";
  const custScore = customerSentiment2score(customerSent);
  const churn: RiskLevel = custScore < -0.2 ? "high" : custScore < 0 ? "medium" : "low";

  const agentS = agentSentiment2score(agentSent);
  const empathy = Math.round(((Math.max(0, agentS) + 1) / 2) * 100);

  return {
    csat_proxy: csat,
    nps_proxy: Math.max(-100, Math.min(100, nps)),
    sentiment_trend: trend,
    churn_risk: churn,
    escalation_risk: overall < -0.2 && trend !== "improving" ? "high" : overall < 0 ? "medium" : "low",
    resolution: secondHalf > 0.2 ? "resolved" : secondHalf > -0.1 ? "partial" : "unresolved",
    empathy_score: empathy,
    agent_compliance: empathy, // same derivation in mock; LLM provides real value
    emotion_intensity: emotionIntensity,
    silence_score: silenceScore,
    interruption_risk: interruptRisk,
    key_topics: [],
    agent_sentiment: agentSent,
    customer_sentiment: customerSent,
    talk_listen_ratio: talkRatio,
    call_phase_sentiment: {
      opening: phaseOf(0),
      middle: phaseOf(1),
      closing: phaseOf(2),
    },
  };
}

function deriveTalkRatio(sentences: SentenceAnalysis[]): TalkListenRatio {
  const counts: Record<string, number> = { agent: 0, customer: 0, unknown: 0 };
  for (const s of sentences) {
    const key = s.speaker?.toLowerCase();
    if (key === "agent") counts.agent++;
    else if (key === "customer") counts.customer++;
    else counts.unknown++;
  }
  const total = Math.max(1, sentences.length);
  return {
    agent: Math.round((counts.agent / total) * 100),
    customer: Math.round((counts.customer / total) * 100),
    unknown: Math.round((counts.unknown / total) * 100),
  };
}

function speakerSentiment(sentences: SentenceAnalysis[], speaker: string): Sentiment | null {
  const subset = sentences.filter((s) => s.speaker?.toLowerCase() === speaker.toLowerCase());
  if (!subset.length) return null;
  return toSentiment(avg(subset.map((s) => s.score)));
}

function customerSentiment2score(s: Sentiment | null): number {
  return s === "Negative" ? -0.5 : s === "Positive" ? 0.5 : 0;
}
function agentSentiment2score(s: Sentiment | null): number {
  return s === "Positive" ? 0.6 : s === "Negative" ? -0.4 : 0.1;
}

// ---------------------------------------------------------------------------
// Numeric helpers
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
function toSentiment(score: number): Sentiment {
  if (score > 0.15) return "Positive";
  if (score < -0.15) return "Negative";
  return "Neutral";
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(v as string) ? (v as T) : fallback;
}
// Normalise a 0-10 LLM response to 0-100, then clamp
function normalizeScale(v: unknown, fallback: number, min: number, max: number): number {
  if (typeof v !== "number" || !isFinite(v)) return fallback;
  const n = v <= 10 ? v * 10 : v;
  return Math.round(Math.max(min, Math.min(max, n)));
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
