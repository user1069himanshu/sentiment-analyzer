# n8n Workflow Setup Guide

This guide covers how to import, configure, and publish the Sentiment Analyzer n8n workflow from scratch. It also documents the node architecture and the data contract between the frontend and the workflow.

---

## Production Webhook URL

```
https://himanshu069.app.n8n.cloud/webhook/sentiment-analyze
```

Set this in the frontend environment:

```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://himanshu069.app.n8n.cloud/webhook/sentiment-analyze
```

---

## Step-by-Step Setup

### 1. Import the workflow

1. Log in to [n8n Cloud](https://app.n8n.cloud) (or your self-hosted instance).
2. Click **New Workflow** (top right) then choose **Import from file**.
3. Select `workflow.json` from this directory.
4. The workflow loads with all five nodes already wired together.

### 2. Add the OpenAI credential

1. Open the **OpenAI** node (third node in the canvas).
2. Click the **Credential** dropdown and select **Create new credential**.
3. Enter your OpenAI API key. Name the credential something clear, e.g. `OpenAI - Sentiment Analyzer`.
4. Save. The key is stored only in n8n; it never reaches the browser or the repo.

### 3. Verify the OpenAI model is gpt-4o

1. Inside the OpenAI node, confirm the **Model** field is set to `gpt-4o`.
2. The node is already configured with `temperature: 0.1` and `responseFormat: json_object` — do not change these; they enforce strict JSON output.

### 4. Publish (activate) the workflow

1. Toggle the **Active** switch in the top-right corner of the workflow canvas to **ON**.
2. n8n will register the webhook path `sentiment-analyze` and begin accepting POST requests.
3. The production URL becomes active immediately. Test it with:

```bash
curl -X POST https://himanshu069.app.n8n.cloud/webhook/sentiment-analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Agent: Hello, how can I help you?\nCustomer: I have a billing issue."}'
```

You should receive a full `AnalysisResult` JSON response within a few seconds.

### 5. Copy the webhook URL into the frontend

1. The webhook URL is fixed at the path configured in the Webhook node (`sentiment-analyze`).
2. Copy the production URL above into `frontend/.env.local`:

```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://himanshu069.app.n8n.cloud/webhook/sentiment-analyze
```

3. Redeploy the frontend (or restart the dev server) for the change to take effect.

### 6. Keeping workflow.json up to date

The `workflow.json` file in this directory is the source of truth for the workflow. **It does not update automatically.** After making any meaningful change in the n8n canvas:

1. Open the workflow in n8n.
2. Click the **...** menu (top right) then **Download** (or Export).
3. Replace `orchestration/n8n/workflow.json` with the downloaded file.
4. Commit the updated file to the repo.

---

## Node Descriptions

The workflow has exactly five nodes wired in a straight chain:

```
Webhook  →  Preprocess  →  OpenAI  →  Aggregate  →  Respond
```

### Node 1: Webhook

- **Type:** n8n-nodes-base.webhook (v2)
- **Method:** POST
- **Path:** `sentiment-analyze`
- **Response mode:** `responseNode` (defers response to the Respond node)
- **Purpose:** Entry point for all requests. Receives `{ "text": "<conversation>" }` from the frontend and passes `body` downstream. Does no processing itself.

### Node 2: Preprocess (Code)

- **Type:** n8n-nodes-base.code (v2)
- **Language:** JavaScript
- **Purpose:** Validates, normalizes, and segments the raw conversation text.
  - Reads `body.text` from the webhook payload.
  - Detects speaker labels using a regex (`Speaker: utterance` or `Speaker - utterance` format).
  - Splits each speaker turn into individual sentences using punctuation boundaries.
  - Assigns a sequential `index` to every sentence.
  - Outputs `{ sentences, table, raw }` where `table` is a tab-delimited string (index TAB speaker TAB text) used as the LLM prompt input.
- **Error conditions:** Throws if `text` is missing or no analyzable sentences are found.

### Node 3: OpenAI

- **Type:** n8n-nodes-base.openAi (v1)
- **Model:** gpt-4o
- **Temperature:** 0.1 (near-deterministic for consistent JSON)
- **Response format:** `json_object` (enforces valid JSON output)
- **Purpose:** Single batched LLM call that analyzes the full transcript in one pass.
  - System prompt: defines the analyst role, sentiment labels, emotion taxonomy, and score ranges.
  - User prompt: passes the `table` from Preprocess and instructs the model to return a strict JSON shape covering `overall`, `sentences`, `emotions`, `summary`, and `kpis`.
  - KPI derivation rules are embedded in the prompt so the model reasons about them step by step.

### Node 4: Aggregate (Code)

- **Type:** n8n-nodes-base.code (v2)
- **Language:** JavaScript
- **Purpose:** Merges and validates the LLM output, computes derived metrics, and produces the final response payload.
  - Parses the LLM JSON (handles both string and object responses).
  - Merges per-sentence LLM analysis back onto the pre-segmented sentences from Preprocess (ensuring speaker labels are preserved).
  - Normalizes the 10-emotion distribution so values sum to 1.0.
  - Applies fallback derivations for every KPI in case the LLM omits or mis-scales a value:
    - `csat_proxy`: scaled 0-100 (not 0-10)
    - `nps_proxy`: formula-derived from promoter/detractor sentence ratios
    - `emotion_intensity`: from the most-negative sentence score
    - `silence_score`: substantive sentence ratio
    - `interruption_risk`: from speaker alternation rate
    - `talk_listen_ratio`: computed entirely here (not from LLM)
    - `call_phase_sentiment`: sentence thirds analysis as fallback
  - Clamps all numeric fields to their valid ranges.
  - Appends a `meta` block: `{ sentence_count, model, source, processed_at }`.

### Node 5: Respond

- **Type:** n8n-nodes-base.respondToWebhook (v1.1)
- **Response:** `firstEntryJson`
- **Purpose:** Sends the Aggregate output as the HTTP response back to the frontend. This is what the frontend receives and renders in the dashboard.

---

## Data Contract

### Request

```
POST https://himanshu069.app.n8n.cloud/webhook/sentiment-analyze
Content-Type: application/json

{ "text": "<raw conversation string>" }
```

The `text` field must be a non-empty string. Speaker labels are optional but improve per-speaker KPIs. Supported formats:

```
Agent: Hello, how can I help you?
Customer: I have a billing problem.
```

### Response — AnalysisResult

```jsonc
{
  "overall": {
    "sentiment": "Positive | Negative | Neutral",
    "score": 0.0,          // -1.0 to 1.0
    "confidence": 0.0,     // 0.0 to 1.0
    "reasoning": ""        // 2-3 sentence chain-of-thought
  },
  "sentences": [
    {
      "index": 0,
      "speaker": "Agent | Customer | null",
      "text": "",
      "sentiment": "Positive | Negative | Neutral",
      "score": 0.0,        // -1.0 to 1.0
      "emotion": "joy | satisfaction | anger | frustration | sadness | fear | neutral | surprise | disgust | anticipation"
    }
  ],
  "emotions": {
    "joy": 0.0,            // All 10 values sum to 1.0
    "satisfaction": 0.0,
    "anger": 0.0,
    "frustration": 0.0,
    "sadness": 0.0,
    "fear": 0.0,
    "neutral": 0.0,
    "surprise": 0.0,
    "disgust": 0.0,
    "anticipation": 0.0
  },
  "summary": "",
  "kpis": {
    "csat_proxy": 0,                // 0-100
    "nps_proxy": 0,                 // -100 to 100
    "sentiment_trend": "improving | declining | flat",
    "churn_risk": "low | medium | high",
    "escalation_risk": "low | medium | high",
    "resolution": "resolved | partial | unresolved",
    "empathy_score": 0,             // 0-100
    "agent_compliance": 0,          // 0-100
    "emotion_intensity": 0,         // 0-100
    "silence_score": 0,             // 0-100 (substantive sentence ratio)
    "interruption_risk": "low | medium | high",
    "key_topics": [],               // up to 6 strings
    "agent_sentiment": "Positive | Negative | Neutral | null",
    "customer_sentiment": "Positive | Negative | Neutral | null",
    "talk_listen_ratio": {
      "agent": 0,                   // % of sentences (0-100)
      "customer": 0,
      "unknown": 0
    },
    "call_phase_sentiment": {
      "opening": "Positive | Negative | Neutral",
      "middle": "Positive | Negative | Neutral",
      "closing": "Positive | Negative | Neutral"
    }
  },
  "meta": {
    "sentence_count": 0,
    "model": "gpt-4o",
    "source": "n8n",
    "processed_at": "ISO 8601 timestamp"
  }
}
```

The canonical contract is maintained in `docs/architecture.md`. If you add a field, update that file first, then both the Aggregate node code and the frontend types.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `No text field in request body` error | Frontend not sending `{ text }` or wrong content-type | Check `Content-Type: application/json` and payload shape |
| OpenAI node shows auth error | Credential not attached or key expired | Re-enter the key in n8n credentials |
| Response has `csat_proxy` as a decimal (e.g. 0.7) | Old LLM output before scale fix | Aggregate node normalizes this; re-run the workflow |
| Webhook returns 404 | Workflow is not activated | Toggle Active switch to ON |
| `No analyzable sentences found` | Text is blank or only whitespace | Validate input before submitting |
