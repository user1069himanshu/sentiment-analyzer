# n8n Orchestration

The n8n workflow is the middle layer: **UI → (this) → OpenAI**.

## Workflow

1. **Webhook** (POST) — receives `{ "text": "<conversation>" }`.
2. **Preprocess** (Code) — normalize text, split into sentences, detect speaker labels.
3. **OpenAI** — single batched call; prompt demands strict JSON (overall + per-sentence sentiment, emotions, summary, KPIs, reasoning).
4. **Aggregate** (Code) — emotion distribution, sentiment trend, KPI rollups.
5. **Respond to Webhook** — return the final JSON.

## Files

- `workflow.json` — exported workflow (source of truth). Export after every meaningful change: n8n → workflow → ⋯ → Download.

## Setup

1. Create a workflow in n8n Cloud (or self-hosted).
2. Add the **OpenAI credential** in n8n (key stored here, never in the repo or browser).
3. Copy the production webhook URL into the frontend env: `NEXT_PUBLIC_N8N_WEBHOOK_URL`.
4. Keep the response shape aligned with the contract in [`../../docs/architecture.md`](../../docs/architecture.md).
