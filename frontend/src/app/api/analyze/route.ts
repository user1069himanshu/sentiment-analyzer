import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { analyzeText } from "@/lib/analyze";
import type { AnalysisResult } from "@/lib/types";

export const maxDuration = 60;

const MAX_CHARS = 100_000;

export async function POST(request: Request) {
  // Gate: only authenticated sessions may analyze.
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = (typeof body.text === "string" ? body.text : "").trim();
  if (!text) {
    return Response.json({ error: "No text provided." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return Response.json(
      { error: `Text too large (max ${MAX_CHARS} characters).` },
      { status: 413 }
    );
  }

  try {
    const result = await analyze(text);
    return Response.json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    return Response.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Orchestration boundary. Production path: forward to the n8n webhook
 * (UI -> n8n -> AI). If n8n is not configured, fall back to in-process
 * analysis (OpenAI or mock) so the app always works.
 */
async function analyze(text: string): Promise<AnalysisResult> {
  const webhook = process.env.N8N_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      throw new Error(`n8n webhook returned ${res.status}`);
    }
    return (await res.json()) as AnalysisResult;
  }
  return analyzeText(text);
}
