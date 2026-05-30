# Sentiment Analyzer (Full-Stack + AI)

Upload a conversation transcript → analyze sentiment with an LLM → explore insights in a dashboard.

Built for the **AI Centre of Excellence (CoE)** assignment. Clean three-layer separation: **UI → n8n → AI**.

## Architecture

```
Next.js UI (Vercel)  ──▶  n8n webhook (orchestration)  ──▶  OpenAI (LLM)
                     ◀──            JSON contract        ◀──
```

- **Frontend** — Next.js + Tailwind + Recharts. Login, `.txt` upload, results dashboard.
- **Orchestration** — n8n workflow: receive → split → LLM → aggregate KPIs → respond.
- **AI** — OpenAI returns structured JSON: overall + sentence-level sentiment, emotions, summary, call-center KPIs, and reasoning.

Full design in [`docs/architecture.md`](docs/architecture.md). Working guide in [`CLAUDE.md`](CLAUDE.md).

## Features

- 🔐 Login (basic auth)
- 📄 `.txt` conversation upload
- 📊 Sentiment dashboard: overall verdict, sentence-level timeline, emotion charts
- 🧠 LLM reasoning shown alongside results
- 📞 Phone-call KPIs: CSAT proxy, churn/escalation risk, resolution, empathy, trend
- 📝 Conversation summary

## Repository layout

```
frontend/            Next.js app
orchestration/n8n/   exported n8n workflow
docs/                architecture + assignment brief
sample-data/         sample conversations for testing
```

## Status

🚧 Scaffolding. See [`docs/architecture.md`](docs/architecture.md) for the plan.
