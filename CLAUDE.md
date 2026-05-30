# CLAUDE.md

Guidance for working in this repository. Read this first.

## What this is

**Sentiment Analyzer** — a full-stack AI assignment for the **AI Centre of Excellence (CoE) / AI Engineer** role.

Flow: **Upload a conversation `.txt` → analyze sentiment with an LLM → show insights in a dashboard.**

The assignment scores: AI quality + reasoning, **clean separation (UI → n8n → AI)**, UX/UI, and **creativity** (charts, emotion detection, summary, extra KPIs). Original brief: [`docs/assignment/`](docs/assignment/).

## Architecture (the rule we don't break)

Three clean layers, each replaceable in isolation:

```
Next.js UI  ──HTTP──▶  n8n webhook (orchestration)  ──API──▶  OpenAI (LLM)
 (Vercel)   ◀──JSON──            workflow            ◀──JSON──
```

- **`frontend/`** — Next.js (App Router) + Tailwind + Recharts. Deployed on **Vercel**. Owns: login (basic auth), `.txt` upload, dashboard. The UI **never calls OpenAI directly** — it only talks to the n8n webhook.
- **`orchestration/`** — the **n8n** workflow (exported as JSON). Owns: receive text → split into sentences → call the LLM → aggregate per-sentence + overall results + KPIs → return one structured JSON payload. This is the "UI → n8n → AI" separation the rubric rewards.
- **LLM** — **OpenAI**, prompted to return strict JSON (overall sentiment, per-sentence sentiment, emotions, summary, KPIs, reasoning). Lives behind n8n; keys never reach the browser.

See [`docs/architecture.md`](docs/architecture.md) for the full data contract and KPI definitions.

## Repository layout

```
frontend/            Next.js app (UI + optional API fallback)
orchestration/n8n/   exported n8n workflow JSON + setup notes
docs/                architecture.md, assignment brief
sample-data/         sample conversation .txt files for testing
```

## The data contract (UI ⇄ n8n)

The UI POSTs `{ "text": "<raw conversation>" }` to the n8n webhook and renders whatever JSON comes back. Keep this contract stable — it's the seam between the two halves of the system. Canonical shape lives in [`docs/architecture.md`](docs/architecture.md); update it there first, then both sides.

## Conventions

- **Secrets**: OpenAI key lives only in n8n credentials (and `.env.local` if a fallback API route is used). Never commit keys. `.env*` is gitignored — commit `.env.example` instead.
- **Frontend**: TypeScript, App Router, Tailwind. Charts via Recharts. Keep components in `frontend/components/`.
- **n8n**: export the workflow to `orchestration/n8n/workflow.json` after every meaningful change so the repo is the source of truth.
- **Commits**: small and scoped. Branch off `main`; don't commit to the stray repo at `C:\Users\himanshu` (the real repo lives in this folder).

## Working agreements

- Keep the three layers decoupled — a change to the LLM prompt should not require a UI change beyond the JSON contract.
- Favor demo robustness: the dashboard should degrade gracefully if a field is missing.
- KPIs are framed for **phone-call / call-center** context (the role is telecom/cloud AI CoE) — see architecture doc.
