# Sentiment Analyzer — Full-Stack AI Call Intelligence Platform

Upload a conversation transcript and get a complete AI-powered sentiment analysis, emotion breakdown, and call-center KPI dashboard — in seconds.

**Live demo:** [https://sentiment-analyzer-coe.vercel.app](https://sentiment-analyzer-coe.vercel.app) &nbsp;|&nbsp; Login: `admin` / `admin123`

Built for the **AI Centre of Excellence (CoE) / AI Engineer** assignment. Demonstrates clean three-layer separation (**UI → n8n → AI**), 16 contact-center KPIs, and production-grade UX.

---

## Architecture

```
┌──────────────────────┐       ┌───────────────────────────────────┐       ┌──────────────────────┐
│   Next.js UI         │ POST  │   n8n workflow (webhook)           │  API  │   OpenAI gpt-4o      │
│   (Vercel)           │──────▶│  1. receive { text }              │──────▶│  structured JSON     │
│                      │       │  2. split into sentences           │       │  sentiment + emotions│
│  login / upload /    │       │  3. LLM analyze (batched)          │◀──────│  + summary + KPIs   │
│  dashboard / insights│◀──────│  4. aggregate + 16 KPIs            │ JSON  │  + reasoning         │
│                      │ JSON  │  5. Respond to Webhook             │       │                      │
└──────────────────────┘       └───────────────────────────────────┘       └──────────────────────┘
                                              ▲
                                              │ history
                                              ▼
                                        Supabase DB
                                   (cross-device call log)
```

**Design principle:** the UI is a dumb, beautiful renderer. All intelligence and all API secrets live behind the n8n webhook. Either layer can be rebuilt without touching the other, as long as the JSON contract holds.

Full data contract: [`docs/architecture.md`](docs/architecture.md)

---

## Features

### Core Analysis
- Drag-and-drop `.txt` conversation upload (or click-to-browse)
- 6-step animated loading sequence while the LLM processes
- Overall sentiment verdict with confidence score and LLM reasoning
- Sentence-level sentiment timeline — expandable list with per-sentence emotion tags
- Sentiment trend chart showing how tone evolves across the call

### Emotion Intelligence (Plutchik Model)
- 10 emotions detected: **joy, satisfaction, anger, frustration, sadness, fear, neutral, surprise, disgust, anticipation**
- Interactive donut chart with per-emotion percentages
- Dominant emotion highlight on the main results card

### 16 Call-Center KPIs
| KPI | What it measures |
|-----|-----------------|
| ⭐ Satisfaction Index | 0–100 satisfaction estimate derived from tone and resolution (CSAT proxy) |
| 📣 Net Promoter Signal | −100 to +100 loyalty measure from promoter/detractor sentence ratio |
| 📈 Tone Trajectory | Did the call improve, decline, or stay flat across its arc? |
| 🔒 Retention Risk | Low / Medium / High likelihood of customer defection |
| ⚡ Escalation Signal | Probability the call needed a supervisor |
| ✅ FCR Status | First Contact Resolution — Resolved / Partial / Unresolved |
| 🤝 Empathy Quotient | Agent warmth, acknowledgement, and follow-through quality |
| 📋 Protocol Adherence | Adherence to expected communication script and standards |
| ⚡ Peak Intensity | Magnitude of the most negative single moment in the call |
| 💎 Engagement Depth | Substantive conversation ratio vs. dead air and filler |
| 🔄 Overtalk Risk | Cross-talk and rapid speaker-switching signals |
| 🏷️ Key Topics | Auto-extracted intents and subjects from the transcript |
| 🎙️ Agent Pulse | Agent-only emotional tone across all utterances |
| 💬 Customer Pulse | Customer-only emotional tone across all utterances |
| ⚖️ Voice Share | Agent-to-customer speaking balance (Gong benchmark: 57/43) |
| 🌊 Conversation Arc | Opening / middle / closing sentiment — the call's narrative arc |

### Insights Dashboard
- Aggregate Insights view across all analyzed calls
- Donut charts for sentiment distribution, emotion distribution, and KPI breakdowns
- Filtered drill-down page: click any metric to see the matching calls
- Cross-device call history via Supabase with localStorage fallback

### UX & Polish
- 20 curated sample calls — one-click load for instant demo
- Hover tooltips on every KPI explaining what it means and why it matters
- Basic auth login gate
- Fully responsive layout (Tailwind CSS v4)
- Graceful degradation if any field is missing from the LLM response

---

## Quick Start

### Prerequisites
- Node.js 18+
- An n8n Cloud account (or self-hosted n8n)
- An OpenAI API key (stored in n8n credentials only — never in the frontend)
- A Supabase project (optional — falls back to localStorage without it)

### 1. Clone and install

```bash
git clone <repo-url>
cd "Segment Analyzer/frontend"
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# n8n webhook URL (primary AI path — all secrets stay server-side)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-path

# Auth gate credentials
APP_USERNAME=admin
APP_PASSWORD=admin123
AUTH_SECRET=generate-a-long-random-string

# OpenAI fallback (only used if N8N_WEBHOOK_URL is empty)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o

# Supabase for cross-device call history (optional — falls back to localStorage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 4. Set up the n8n workflow

1. Import `orchestration/n8n/workflow.json` into your n8n instance.
2. Add your OpenAI API key as an n8n credential (type: OpenAI).
3. Activate the workflow — n8n provides a webhook URL.
4. Paste that URL into `NEXT_PUBLIC_N8N_WEBHOOK_URL`.

The workflow nodes:
1. **Webhook** — POST entry point, receives `{ "text": "..." }`
2. **Preprocess** — normalize and split into sentences (Code node)
3. **LLM call** — OpenAI gpt-4o with a strict JSON schema prompt
4. **Aggregate** — compute KPI rollups and emotion distributions (Code node)
5. **Respond** — return the final structured JSON to the UI

### 5. Deploy to Vercel

```bash
vercel deploy
# Set NEXT_PUBLIC_N8N_WEBHOOK_URL and Supabase vars in Vercel project settings
```

---

## Repository Layout

```
Segment Analyzer/
├── frontend/                  Next.js app (UI + routing)
│   ├── src/
│   │   ├── app/               App Router pages
│   │   │   ├── dashboard/     Main results + Insights pages
│   │   │   └── api/analyze/   Optional fallback API route (same JSON contract)
│   │   └── components/        React components (Dashboard, Insights, Results, ...)
│   ├── .env.example           Required env var template
│   └── package.json
├── orchestration/
│   └── n8n/
│       └── workflow.json      Exported n8n workflow (source of truth)
├── docs/
│   ├── architecture.md        Data contract + KPI definitions
│   └── assignment/            Original assignment brief
├── sample-data/               20 sample conversation .txt files
└── CLAUDE.md                  Developer guide for AI assistants
```

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend framework | Next.js 16 (App Router) | UI routing, SSR, API routes |
| Styling | Tailwind CSS v4 | Utility-first responsive design |
| Charts | Recharts v3 | Sentiment timeline, emotion donut, KPI bars |
| Orchestration | n8n Cloud | Webhook, LLM call, aggregation — no secrets in the browser |
| LLM | OpenAI gpt-4o | Structured JSON sentiment, emotions, KPIs, reasoning |
| Database | Supabase (PostgreSQL) | Cross-device call history |
| Local fallback | localStorage | Call history when Supabase is unavailable |
| Deployment | Vercel | Frontend hosting, env var management |
| Language | TypeScript | Full type safety across the stack |

---

## Assignment Rubric Alignment

### AI Quality and Reasoning
- Uses **gpt-4o** with a carefully engineered prompt that enforces strict JSON output (schema-constrained, low temperature).
- LLM reasoning is surfaced verbatim on the results card so evaluators can see how the model justified its verdict.
- Sentence-level analysis gives granular, per-utterance sentiment with emotion tags — not just an aggregate score.
- 10-emotion Plutchik model goes beyond positive/negative/neutral for genuine emotional nuance.

### Clean Separation (UI → n8n → AI)
- The browser never holds an API key. The UI only POSTs raw text to the n8n webhook and renders the returned JSON.
- The n8n workflow is independently exportable and replaceable — the UI is unaware of OpenAI's API shape.
- The JSON contract is documented in `docs/architecture.md` and is the single seam between the two halves.
- An optional Next.js API route mirrors the contract as a resilience fallback, demonstrating the pattern holds at both layers.

### UX and Creativity
- Production-grade loading experience: 6 named steps with a progress animation so users know what is happening.
- 20 sample calls let evaluators explore the full feature set without uploading their own files.
- Hover tooltips on every metric explain KPIs in plain language — the dashboard teaches as well as informs.
- Insights dashboard aggregates across sessions with donut charts and a filtered drill-down view for any metric.
- Cross-device history via Supabase means call results persist beyond a single browser session.

### KPIs and Call-Center Relevance
- 16 KPIs mapped directly to contact-center and telecom use cases: CSAT proxy, NPS proxy, churn risk, escalation risk, empathy score, agent compliance, talk/listen ratio, and more.
- Every KPI is defined in `docs/architecture.md` with its meaning and why it matters in a CoE/telecom context.
- Agent and customer sentiment are tracked separately when speaker labels are present, enabling agent-performance coaching workflows.

---

## Data Contract Reference

**Request** (UI → n8n):
```json
{ "text": "Agent: Hello, thank you for calling...\nCustomer: Hi, I have a billing issue..." }
```

**Response** (n8n → UI):
```json
{
  "overall": {
    "sentiment": "Negative",
    "score": -0.42,
    "confidence": 0.88,
    "reasoning": "Customer expressed strong frustration early; partial resolution by close."
  },
  "sentences": [
    { "index": 0, "speaker": "Agent", "text": "...", "sentiment": "Neutral", "score": 0.05, "emotion": "neutral" }
  ],
  "emotions": { "anger": 0.30, "frustration": 0.25, "satisfaction": 0.20, "joy": 0.10, "neutral": 0.15 },
  "summary": "Customer called about a billing error; agent acknowledged the issue and opened a ticket.",
  "kpis": {
    "csat_proxy": 62,
    "nps_proxy": 45,
    "sentiment_trend": "improving",
    "churn_risk": "medium",
    "escalation_risk": "low",
    "resolution": "partial",
    "empathy_score": 78,
    "agent_compliance": 85,
    "emotion_intensity": 0.72,
    "silence_score": 0.15,
    "interruption_risk": "low",
    "key_topics": ["billing", "refund", "ticket"],
    "agent_sentiment": "Positive",
    "customer_sentiment": "Negative",
    "talk_listen_ratio": 0.55,
    "call_phase_sentiment": { "opening": "neutral", "middle": "negative", "closing": "positive" }
  },
  "meta": { "sentence_count": 24, "model": "gpt-4o", "processed_at": "2026-06-01T..." }
}
```

Full schema and KPI definitions: [`docs/architecture.md`](docs/architecture.md)

---

## License

Built as an assignment submission for the AI Centre of Excellence (CoE) / AI Engineer role.
