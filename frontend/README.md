# Frontend — Sentiment Analyzer

Next.js 16 (App Router) + Tailwind v4 + Recharts. Login, `.txt` upload, and a
sentiment dashboard.

## Run locally

```bash
npm install
cp .env.example .env.local   # then edit values
npm run dev                  # http://localhost:3000
```

Default demo login: `admin` / `admin123` (configurable via env).

## How analysis is wired

`UI → /api/analyze → (n8n | OpenAI | mock)`

`/api/analyze` resolves a source in this order:

1. **n8n** — if `N8N_WEBHOOK_URL` is set, it forwards `{ text }` to the n8n
   webhook (the production "UI → n8n → AI" path) and returns its JSON.
2. **OpenAI** — else if `OPENAI_API_KEY` is set, it analyzes in-process via the
   OpenAI SDK (fallback so demos never break).
3. **Mock** — else a deterministic keyword-lexicon analyzer runs, so the app
   works with **zero configuration**.

All three return the same shape (`src/lib/types.ts` / `docs/architecture.md`).

## Structure

```
src/
  app/
    page.tsx              redirect by auth state
    login/page.tsx        login screen
    dashboard/page.tsx    protected dashboard shell
    api/login|logout|analyze/route.ts
  components/             LoginForm, Dashboard, Results, Charts, SentenceList…
  lib/
    auth.ts               signed-cookie session
    types.ts              the data contract
    segment.ts            transcript → speaker-labeled sentences
    analyze.ts            OpenAI + mock analysis + KPI derivation
    ui.ts                 colors / badges
  proxy.ts                protects /dashboard (Next 16 middleware == proxy)
```

## Deploy (Vercel)

Connect the repo, set root directory to `frontend/`, and add the env vars from
`.env.example`. Build command and output are auto-detected.
