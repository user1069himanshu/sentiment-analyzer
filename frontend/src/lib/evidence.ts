// Pure evidence detection for KPI drivers.
// Composes per-sentence LLM labels (sentiment/score/emotion/speaker) with
// linguistic markers to surface WHY a KPI scored the way it did.

import type { CallKPIs, SentenceAnalysis } from "./types";

export type DriverKey = "empathy" | "adherence" | "engagement" | "churn";

export type CueTone = "positive" | "negative" | "neutral";

export interface EvidenceItem {
  sentence: SentenceAnalysis;
  cues: { text: string; tone: CueTone }[]; // why this sentence counts
  weight: number;                          // ranking signal (higher = more impactful)
}

export interface DriverChecklistItem {
  label: string;
  passed: boolean;
  partial?: boolean;   // amber state — neither fully passed nor failed
  detail: string;
}

export interface DriverEvidence {
  key: DriverKey;
  title: string;
  icon: string;
  value: number;                  // 0..100
  rating: "Strong" | "Moderate" | "Weak";
  verdictColor: "positive" | "amber" | "negative";
  oneLine: string;                // human summary of the metric
  checklist: DriverChecklistItem[]; // bullet-style derivation steps
  evidence: EvidenceItem[];       // sentences that drove it (sorted by weight desc)
  counterEvidence: EvidenceItem[];// sentences that dragged it down (where relevant)
}

/* ─── helpers ─── */

const isAgent    = (s: SentenceAnalysis) => !!s.speaker && /agent/i.test(s.speaker);
const isCustomer = (s: SentenceAnalysis) => !!s.speaker && /customer|client|caller/i.test(s.speaker);

function phaseOf(idx: number, total: number): "opening" | "middle" | "closing" {
  if (idx < Math.floor(total / 3)) return "opening";
  if (idx < Math.floor((total * 2) / 3)) return "middle";
  return "closing";
}

function ratingFor(value: number): { rating: "Strong" | "Moderate" | "Weak"; verdictColor: "positive" | "amber" | "negative" } {
  if (value >= 70) return { rating: "Strong",   verdictColor: "positive" };
  if (value >= 40) return { rating: "Moderate", verdictColor: "amber"    };
  return                 { rating: "Weak",     verdictColor: "negative" };
}

/** Find which phrases from `markers` appear in `text` (case-insensitive). */
function matchMarkers(text: string, markers: readonly string[]): string[] {
  const lower = text.toLowerCase();
  return markers.filter((m) => lower.includes(m));
}

/* ─── marker dictionaries (telco call-center calibrated) ─── */

const EMPATHY_STRONG = [
  "i'm so sorry", "i sincerely apologize", "i completely understand",
  "i can only imagine", "that must be incredibly", "deeply apologize",
] as const;

const EMPATHY_MED = [
  "i understand", "i'm sorry", "i apologize", "i hear you", "i can imagine",
  "that must be", "that's frustrating", "i realize", "i acknowledge",
  "i appreciate your patience", "thank you for your patience",
] as const;

const GREETING = [
  "hello", "good morning", "good afternoon", "good evening",
  "thank you for calling", "how can i help", "how may i help",
  "this is", "welcome to", "how are you today",
] as const;

const SOLUTION = [
  "let me", "i'll", "i will", "we can", "what i can do", "what i'll do",
  "i'm going to", "here's what", "i can offer", "let's", "we'll",
  "i've gone ahead", "i've issued", "i've processed", "i've credited", "i'll process",
] as const;

const CLOSING = [
  "anything else", "is there anything", "have a great", "have a nice",
  "have a wonderful", "appreciate your", "take care", "thanks for calling",
  "we appreciate", "enjoy the rest",
] as const;

const FILLER_TOKENS = new Set([
  "yeah", "yes", "no", "ok", "okay", "right", "uh-huh", "mm", "mm-hmm",
  "sure", "alright", "got it", "uhh", "umm", "hmm", "yep",
]);

const CHURN_PHRASES = [
  "cancel", "switching", "switch to", "another provider", "competitor",
  "find another", "look elsewhere", "had enough", "fed up", "never again",
  "never use", "last time", "lawyer", "attorney", "regulator", "bbb",
  "complaint", "file a complaint", "report you", "leave", "leaving",
  "close my account", "porting out", "moving to",
] as const;

const SUBSTANTIVE_MIN_CHARS = 40;

/* ─────────────────────────── EMPATHY ─────────────────────────── */

function detectEmpathy(sentences: SentenceAnalysis[], kpis: CallKPIs): DriverEvidence {
  const agentSentences = sentences.filter(isAgent);
  const items: EvidenceItem[] = [];

  for (const s of agentSentences) {
    const strong = matchMarkers(s.text, EMPATHY_STRONG);
    const med    = matchMarkers(s.text, EMPATHY_MED);
    const weight = strong.length * 2 + med.length;
    if (weight === 0) continue;
    items.push({
      sentence: s,
      weight,
      cues: [
        ...strong.map((t) => ({ text: t, tone: "positive" as const })),
        ...med.map((t)    => ({ text: t, tone: "positive" as const })),
      ],
    });
  }

  items.sort((a, b) => b.weight - a.weight);

  // counter-evidence: agent sentences with negative tone AND no empathy marker.
  // Acknowledging customer pain ("I see, that's terrible") often has negative
  // content tone — but it IS empathy, so we exclude any sentence carrying an
  // empathy marker from the counter-evidence pool.
  const counter: EvidenceItem[] = agentSentences
    .filter((s) => {
      if (s.score >= -0.2) return false;
      const hasEmpathyMarker =
        matchMarkers(s.text, EMPATHY_STRONG).length > 0 ||
        matchMarkers(s.text, EMPATHY_MED).length > 0;
      return !hasEmpathyMarker;
    })
    .map((s) => ({
      sentence: s,
      weight: Math.abs(s.score),
      cues: [{ text: `negative tone, no empathy marker (${s.score.toFixed(2)})`, tone: "negative" as const }],
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const value = kpis.empathy_score;
  const { rating, verdictColor } = ratingFor(value);
  const totalCues = items.reduce((acc, i) => acc + i.weight, 0);

  return {
    key: "empathy",
    title: "Empathy Quotient",
    icon: "🤝",
    value,
    rating,
    verdictColor,
    oneLine:
      totalCues === 0
        ? "No explicit empathy markers detected in agent utterances."
        : `${totalCues} empathy cue${totalCues === 1 ? "" : "s"} across ${items.length} agent utterance${items.length === 1 ? "" : "s"}.`,
    checklist: [
      { label: "Strong empathy phrases", passed: items.some((i) => i.cues.some((c) => EMPATHY_STRONG.some((m) => c.text === m))), detail: "e.g. \"I sincerely apologize\", \"I completely understand\"" },
      { label: "Standard acknowledgments", passed: items.length >= 1, detail: "e.g. \"I understand\", \"I'm sorry\", \"I hear you\"" },
      { label: "Dismissive language", passed: counter.length === 0, detail: counter.length === 0 ? "None detected" : `${counter.length} negative-tone agent utterance${counter.length === 1 ? "" : "s"}` },
    ],
    evidence: items,
    counterEvidence: counter,
  };
}

/* ─────────────────────────── ADHERENCE ─────────────────────────── */

function detectAdherence(sentences: SentenceAnalysis[], kpis: CallKPIs): DriverEvidence {
  const total = sentences.length;
  const agents = sentences.filter(isAgent);

  const openingAgents = agents.filter((s) => phaseOf(s.index, total) === "opening");
  const closingAgents = agents.filter((s) => phaseOf(s.index, total) === "closing");

  // 5-bucket adherence
  const greetingHits = openingAgents.flatMap((s) =>
    matchMarkers(s.text, GREETING).map((cue) => ({ s, cue })));
  const empathyHits = agents.flatMap((s) =>
    [...matchMarkers(s.text, EMPATHY_STRONG), ...matchMarkers(s.text, EMPATHY_MED)].map((cue) => ({ s, cue })));
  const solutionHits = agents.flatMap((s) =>
    matchMarkers(s.text, SOLUTION).map((cue) => ({ s, cue })));
  const closingHits = closingAgents.flatMap((s) =>
    matchMarkers(s.text, CLOSING).map((cue) => ({ s, cue })));
  const fullyResolved   = kpis.resolution === "resolved";
  const partialResolved = kpis.resolution === "partial";

  const buckets: DriverChecklistItem[] = [
    { label: "1. Greeted at opening",  passed: greetingHits.length > 0,             detail: greetingHits.length ? `"${greetingHits[0].cue}"` : "No greeting phrase detected in opening third" },
    { label: "2. Showed empathy",      passed: empathyHits.length  > 0,             detail: empathyHits.length  ? `${empathyHits.length} acknowledgment${empathyHits.length === 1 ? "" : "s"}` : "No empathy phrase detected" },
    { label: "3. Offered a solution",  passed: solutionHits.length > 0,             detail: solutionHits.length ? `"${solutionHits[0].cue}"` : "No solution-offering phrase detected" },
    { label: "4. Resolution achieved", passed: fullyResolved, partial: partialResolved, detail: `Resolution: ${kpis.resolution}` },
    { label: "5. Closed warmly",       passed: closingHits.length  > 0,             detail: closingHits.length  ? `"${closingHits[0].cue}"` : "No closing phrase detected in final third" },
  ];

  // Build evidence list: one item per bucket that passed, ordered by call flow
  const evidence: EvidenceItem[] = [];
  const consumed = new Set<number>();

  function takeOne(hits: { s: SentenceAnalysis; cue: string }[], stepLabel: string) {
    const hit = hits.find((h) => !consumed.has(h.s.index));
    if (!hit) return;
    consumed.add(hit.s.index);
    evidence.push({
      sentence: hit.s,
      weight: 5 - evidence.length,
      cues: [{ text: `${stepLabel} · "${hit.cue}"`, tone: "positive" }],
    });
  }
  takeOne(greetingHits, "Step 1 · Greet");
  takeOne(empathyHits,  "Step 2 · Empathize");
  takeOne(solutionHits, "Step 3 · Solution");
  takeOne(closingHits,  "Step 5 · Close");

  // counter-evidence: which buckets fully failed (excluding partials)?
  const missingSteps  = buckets.filter((b) => !b.passed && !b.partial).map((b) => b.label);
  const partialSteps  = buckets.filter((b) => b.partial).map((b) => b.label);
  const counter: EvidenceItem[] = []; // no specific sentences for missing buckets

  const value = kpis.agent_compliance;
  const { rating, verdictColor } = ratingFor(value);
  const passedCount  = buckets.filter((b) => b.passed).length;
  const partialCount = partialSteps.length;

  const oneLineParts = [`${passedCount}/5 protocol steps completed`];
  if (partialCount > 0)         oneLineParts.push(`${partialCount} partial`);
  if (missingSteps.length > 0)  oneLineParts.push(`Missing: ${missingSteps.map((s) => s.replace(/^\d+\.\s/, "")).join(", ")}`);

  return {
    key: "adherence",
    title: "Protocol Adherence",
    icon: "📋",
    value,
    rating,
    verdictColor,
    oneLine: oneLineParts.join(" · ") + ".",
    checklist: buckets,
    evidence,
    counterEvidence: counter,
  };
}

/* ─────────────────────────── ENGAGEMENT ─────────────────────────── */

function detectEngagement(sentences: SentenceAnalysis[], kpis: CallKPIs): DriverEvidence {
  const substantive: EvidenceItem[] = [];
  const filler:      EvidenceItem[] = [];

  for (const s of sentences) {
    const trimmed = s.text.trim();
    const tokens  = trimmed.toLowerCase().split(/\W+/).filter(Boolean);
    const isFillerOnly = tokens.length > 0 && tokens.every((t) => FILLER_TOKENS.has(t));
    const isShort      = trimmed.length <= 15;

    if (isFillerOnly || isShort) {
      filler.push({
        sentence: s,
        weight: 100 - trimmed.length,
        cues: [{ text: isFillerOnly ? "filler / acknowledgment only" : "very short utterance", tone: "negative" }],
      });
    } else if (trimmed.length >= SUBSTANTIVE_MIN_CHARS) {
      substantive.push({
        sentence: s,
        weight: trimmed.length,
        cues: [{ text: `${trimmed.length} chars — substantive`, tone: "positive" }],
      });
    }
  }

  substantive.sort((a, b) => b.weight - a.weight);
  filler.sort((a, b) => b.weight - a.weight);

  const total = sentences.length;
  const value = kpis.silence_score;
  const { rating, verdictColor } = ratingFor(value);

  return {
    key: "engagement",
    title: "Engagement Depth",
    icon: "💎",
    value,
    rating,
    verdictColor,
    oneLine: `${substantive.length} substantive · ${filler.length} filler · ${total - substantive.length - filler.length} mid-length`,
    checklist: [
      { label: "Substantive exchanges",   passed: substantive.length >= total * 0.4, detail: `${substantive.length} / ${total} sentences ≥ ${SUBSTANTIVE_MIN_CHARS} chars` },
      { label: "Filler proportion low",   passed: filler.length      <= total * 0.3, detail: `${filler.length} / ${total} sentences are filler/very short` },
      { label: "Balanced sentence depth", passed: value >= 50,                         detail: `Engagement score ${value}/100` },
    ],
    evidence:        substantive.slice(0, 6),
    counterEvidence: filler.slice(0, 6),
  };
}

/* ─────────────────────────── CHURN RISK ─────────────────────────── */

function detectChurn(sentences: SentenceAnalysis[], kpis: CallKPIs): DriverEvidence {
  const customers = sentences.filter(isCustomer);
  const items: EvidenceItem[] = [];

  for (const s of customers) {
    const phrases = matchMarkers(s.text, CHURN_PHRASES);
    const veryNeg = s.score < -0.5;
    const angry   = s.emotion === "anger" || s.emotion === "frustration" || s.emotion === "disgust";

    if (phrases.length === 0 && !veryNeg && !angry) continue;

    const cues: { text: string; tone: CueTone }[] = [];
    if (phrases.length) phrases.forEach((p) => cues.push({ text: `\"${p}\"`, tone: "negative" }));
    if (veryNeg)        cues.push({ text: `very negative score (${s.score.toFixed(2)})`, tone: "negative" });
    if (angry)          cues.push({ text: `emotion: ${s.emotion}`, tone: "negative" });

    const weight = phrases.length * 3 + (veryNeg ? 2 : 0) + (angry ? 1 : 0);
    items.push({ sentence: s, weight, cues });
  }

  items.sort((a, b) => b.weight - a.weight);

  // Map risk level to display value (0-100 axis for consistency w/ Quality cards)
  const value =
    kpis.churn_risk === "high"   ? 85 :
    kpis.churn_risk === "medium" ? 55 : 20;

  // Higher value = worse, so invert verdictColor
  const verdictColor: "positive" | "amber" | "negative" =
    kpis.churn_risk === "high"   ? "negative" :
    kpis.churn_risk === "medium" ? "amber"    : "positive";
  const rating: "Strong" | "Moderate" | "Weak" =
    kpis.churn_risk === "high"   ? "Strong"   :
    kpis.churn_risk === "medium" ? "Moderate" : "Weak";

  return {
    key: "churn",
    title: "Churn Risk",
    icon: "🔒",
    value,
    rating,
    verdictColor,
    oneLine:
      items.length === 0
        ? "No explicit churn signals detected — risk derived from overall tone & resolution."
        : `${items.length} customer utterance${items.length === 1 ? "" : "s"} contain churn signals.`,
    checklist: [
      { label: "Cancel/switch language", passed: items.some((i) => i.cues.some((c) => CHURN_PHRASES.some((p) => c.text.includes(p)))), detail: items.length ? "Detected" : "None detected" },
      { label: "Resolution status",      passed: kpis.resolution === "resolved", detail: `Resolution: ${kpis.resolution}` },
      { label: "Customer sentiment",     passed: kpis.customer_sentiment !== "Negative", detail: `Customer pulse: ${kpis.customer_sentiment ?? "—"}` },
      { label: "Escalation signal",      passed: kpis.escalation_risk !== "high", detail: `Escalation risk: ${kpis.escalation_risk}` },
    ],
    evidence: items,
    counterEvidence: [],
  };
}

/* ─────────────────────────── Public API ─────────────────────────── */

export function getDriverEvidence(
  key: DriverKey,
  sentences: SentenceAnalysis[],
  kpis: CallKPIs,
): DriverEvidence {
  switch (key) {
    case "empathy":    return detectEmpathy(sentences, kpis);
    case "adherence":  return detectAdherence(sentences, kpis);
    case "engagement": return detectEngagement(sentences, kpis);
    case "churn":      return detectChurn(sentences, kpis);
  }
}
