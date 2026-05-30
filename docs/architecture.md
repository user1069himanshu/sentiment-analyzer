# Architecture

## Overview

```
┌──────────────────┐      ┌───────────────────────────┐      ┌──────────────────┐
│   Next.js UI     │ POST │   n8n workflow (webhook)   │ API  │     OpenAI       │
│   (Vercel)       │─────▶│  1. receive text           │─────▶│  structured      │
│                  │      │  2. split into sentences   │      │  JSON sentiment  │
│  • login         │      │  3. LLM analyze            │◀─────│  + emotions      │
│  • .txt upload   │◀─────│  4. aggregate + KPIs       │ JSON │  + summary       │
│  • dashboard     │ JSON │  5. return one JSON object │      │  + reasoning     │
└──────────────────┘      └───────────────────────────┘      └──────────────────┘
```

**Principle:** the UI is a dumb, beautiful renderer. All intelligence and all secrets live behind the n8n webhook. Either side can be rebuilt without touching the other as long as the JSON contract holds.

## Components

### 1. Frontend — `frontend/` (Next.js + Vercel)
- **Login**: basic auth (env-configured username/password or a hardcoded demo credential). Gates the dashboard.
- **Upload**: accepts a single `.txt` file, reads it client-side, POSTs the raw text to the n8n webhook URL (`NEXT_PUBLIC_N8N_WEBHOOK_URL`).
- **Dashboard**: renders the returned JSON — overall verdict, sentence-level timeline, emotion charts, KPIs, summary.
- **Stack**: TypeScript, App Router, Tailwind CSS, Recharts.

### 2. Orchestration — `orchestration/n8n/` (n8n Cloud)
Workflow nodes:
1. **Webhook** (POST) — entry point, receives `{ text }`.
2. **Preprocess** — normalize, split into sentences (Code node).
3. **LLM call** — OpenAI node with a prompt that demands strict JSON output (overall + per-sentence + emotions + summary + KPIs + reasoning). Sent as one batched call for consistency and cost.
4. **Aggregate** — compute distribution, trend, and KPI rollups (Code node).
5. **Respond to Webhook** — return the final JSON.

Exported to `orchestration/n8n/workflow.json` as the source of truth.

### 3. LLM — OpenAI
Prompted for deterministic, schema-constrained JSON. Temperature low. Reasoning string included per the "clear reasoning if LLM used" rubric.

## Data contract (the seam)

**Request** (UI → n8n):
```json
{ "text": "Agent: Hello... \nCustomer: I'm really upset..." }
```

**Response** (n8n → UI):
```json
{
  "overall": {
    "sentiment": "Negative",          // Positive | Negative | Neutral
    "score": -0.42,                    // -1.0 .. 1.0
    "confidence": 0.88,
    "reasoning": "Customer expressed frustration early; partially resolved by end."
  },
  "sentences": [
    { "index": 0, "speaker": "Agent", "text": "...", "sentiment": "Neutral", "score": 0.05, "emotion": "neutral" }
  ],
  "emotions": { "anger": 0.3, "frustration": 0.25, "satisfaction": 0.2, "joy": 0.1, "neutral": 0.15 },
  "summary": "Customer called about a billing error; agent acknowledged and opened a ticket.",
  "kpis": {
    "csat_proxy": 62,                  // 0..100
    "sentiment_trend": "improving",    // improving | declining | flat
    "churn_risk": "medium",            // low | medium | high
    "escalation_risk": "low",
    "resolution": "partial",           // resolved | partial | unresolved
    "key_topics": ["billing", "refund"],
    "empathy_score": 78,
    "agent_sentiment": "Positive",
    "customer_sentiment": "Negative"
  },
  "meta": { "sentence_count": 24, "model": "gpt-...", "processed_at": "2026-05-31T..." }
}
```

This shape is canonical. Change it here first, then update the n8n aggregate node and the UI together.

## KPIs (framed for phone calls / call-center)

The role sits in a telecom/cloud AI CoE, so KPIs map to contact-center analytics:

| KPI | Meaning | Why it matters |
|---|---|---|
| **Overall sentiment + score** | Net emotional tone of the call | Headline metric |
| **CSAT proxy** | 0–100 satisfaction estimate from tone + resolution | Stands in for post-call survey |
| **Sentiment trend** | Did tone improve/decline across the call | Recovery quality |
| **Churn risk** | low/med/high likelihood of customer leaving | Retention signal |
| **Escalation risk** | Likelihood the call needs a supervisor | Routing/ops |
| **Resolution status** | resolved / partial / unresolved | First-call-resolution proxy |
| **Empathy score** | Agent warmth/acknowledgement | Coaching metric |
| **Agent vs Customer sentiment** | Split when speakers are labeled | Agent performance |
| **Emotion distribution** | anger/frustration/joy/satisfaction/neutral | Creativity + nuance |
| **Key topics / intents** | What the call was about | Aggregatable insight |
| **Conversation summary** | 1–2 sentence recap | Reviewer convenience |

## Deployment
- **Frontend** → Vercel (connect the GitHub repo, set `NEXT_PUBLIC_N8N_WEBHOOK_URL`).
- **n8n** → n8n Cloud (or self-hosted), with the OpenAI credential stored in n8n.

## Optional resilience
A Next.js API route (`frontend/app/api/analyze`) can mirror the n8n logic as a fallback so a live demo never breaks if n8n is unreachable. Same JSON contract.
