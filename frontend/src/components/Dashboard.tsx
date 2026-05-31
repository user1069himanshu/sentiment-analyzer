"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import Results from "@/components/Results";
import { saveAnalysis } from "@/lib/history";
import { SAMPLE_CALLS, type SampleCall } from "@/lib/samples";

const SENTIMENT_ICON: Record<string, string> = {
  Positive: "😊",
  Negative: "😠",
  Neutral: "😐",
};

const TYPE_ICON: Record<string, string> = {
  "Technical Support": "🔧",
  Billing: "💳",
  Retention: "🤝",
  Escalation: "⚠️",
  Onboarding: "🌟",
  Sales: "📈",
  Security: "🔒",
  Hardware: "📦",
  Complaints: "📢",
  "Proactive Support": "🔔",
};

const ANALYSIS_STEPS = [
  { label: "Preprocessing transcript", detail: "Splitting into speaker-labeled sentences…" },
  { label: "Sending to AI", detail: "Forwarding to the n8n orchestration layer…" },
  { label: "Analyzing sentiment", detail: "Scoring each sentence with gpt-4o…" },
  { label: "Detecting emotions", detail: "Mapping to 10-emotion Plutchik model…" },
  { label: "Computing KPIs", detail: "CSAT, NPS, compliance, churn risk…" },
  { label: "Building insights", detail: "Aggregating results and generating summary…" },
];

export default function Dashboard() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "samples">("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore all draft state on mount — survives navigating to Insights and back
  useEffect(() => {
    try {
      const savedResult = sessionStorage.getItem("sa_draft_result");
      const savedText   = sessionStorage.getItem("sa_draft_text");
      const savedName   = sessionStorage.getItem("sa_draft_filename");
      if (savedResult) setResult(JSON.parse(savedResult));
      if (savedText)   { setText(savedText); setFileName(savedName || null); }
    } catch {}
  }, []);

  // Persist result so it survives route changes
  useEffect(() => {
    try {
      if (result) sessionStorage.setItem("sa_draft_result", JSON.stringify(result));
      else        sessionStorage.removeItem("sa_draft_result");
    } catch {}
  }, [result]);

  // Persist loaded file/text
  useEffect(() => {
    try {
      if (text) {
        sessionStorage.setItem("sa_draft_text",     text);
        sessionStorage.setItem("sa_draft_filename", fileName ?? "");
      } else {
        sessionStorage.removeItem("sa_draft_text");
        sessionStorage.removeItem("sa_draft_filename");
      }
    } catch {}
  }, [text, fileName]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  function startLoading() {
    setLoadingStep(0);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    stepTimerRef.current = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1));
    }, 2200);
  }

  function stopLoading() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (stepTimerRef.current) { clearInterval(stepTimerRef.current); stepTimerRef.current = null; }
  }

  async function readFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Please upload a .txt file.");
      return;
    }
    setError(null);
    setFileName(file.name);
    setText(await file.text());
    setActiveTab("upload");
  }

  function loadSampleCall(sample: SampleCall) {
    setError(null);
    setFileName(`${sample.title}.txt`);
    setText(sample.transcript);
    setActiveTab("upload");
  }

  async function analyze() {
    if (!text.trim()) {
      setError("Upload a file or pick a sample call first.");
      return;
    }
    setLoading(true);
    setError(null);
    startLoading();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data as AnalysisResult);
      await saveAnalysis(fileName, data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      stopLoading();
      setLoading(false);
    }
  }

  // Back to starting page — clears result but keeps the loaded file
  function backToUpload() {
    setResult(null);
    setError(null);
    try { sessionStorage.removeItem("sa_draft_result"); } catch {}
  }

  // Fully clear everything (used by the "Remove file" button)
  function clearFile() {
    setResult(null);
    setFileName(null);
    setText("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    try {
      sessionStorage.removeItem("sa_draft_result");
      sessionStorage.removeItem("sa_draft_text");
      sessionStorage.removeItem("sa_draft_filename");
    } catch {}
  }

  if (result) {
    return <Results result={result} fileName={fileName} onReset={backToUpload} />;
  }

  if (loading) {
    return <AnalyzingState step={loadingStep} elapsed={elapsed} fileName={fileName} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* ── Hero ── */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-3xl shadow-inner">
          🎙️
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Call Sentiment Analyzer</h1>
        <p className="mt-2 text-muted max-w-md mx-auto">
          Upload a conversation transcript and get AI-powered sentiment analysis, emotion
          detection, and 16 call-center KPIs in seconds.
        </p>
      </div>

      {/* ── Feature pills ── */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {[
          { icon: "💬", label: "Overall sentiment" },
          { icon: "😊", label: "Emotion detection" },
          { icon: "⭐", label: "CSAT & NPS" },
          { icon: "✅", label: "Agent compliance" },
          { icon: "⚠️", label: "Churn risk" },
          { icon: "📈", label: "Call arc" },
        ].map((f) => (
          <span key={f.label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">
            <span>{f.icon}</span>{f.label}
          </span>
        ))}
      </div>

      {/* ── Tab switcher ── */}
      <div className="mb-4 flex rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === "upload" ? "bg-brand text-white shadow-sm" : "text-muted hover:text-foreground"}`}
        >
          📄 Upload a file
        </button>
        <button
          onClick={() => setActiveTab("samples")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === "samples" ? "bg-brand text-white shadow-sm" : "text-muted hover:text-foreground"}`}
        >
          🎧 Sample calls ({SAMPLE_CALLS.length})
        </button>
      </div>

      {/* ── Upload tab ── */}
      {activeTab === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) readFile(f);
          }}
          onClick={() => !fileName && inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            dragging
              ? "cursor-copy border-brand bg-brand/5 scale-[1.01]"
              : fileName
              ? "cursor-default border-positive/40 bg-positive/5"
              : "cursor-pointer border-border bg-card hover:border-brand hover:bg-brand/5"
          }`}
        >
          {fileName ? (
            <div>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-positive/10 text-3xl">✅</div>
              <p className="font-semibold text-foreground">{fileName}</p>
              <p className="mt-1 text-sm text-muted">{text.length.toLocaleString()} characters · ready to analyze</p>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="mt-3 text-xs text-muted underline transition hover:text-negative"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-3xl">
                {dragging ? "📂" : "📄"}
              </div>
              <p className="font-semibold">{dragging ? "Drop it here!" : "Drop a .txt file or click to browse"}</p>
              <p className="mt-1 text-sm text-muted">Accepts plain text conversation transcripts</p>
              <p className="mt-4 inline-block rounded-lg border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
                Format: "Agent: …" / "Customer: …" per line
              </p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
            }}
          />
        </div>
      )}

      {/* ── Samples tab ── */}
      {activeTab === "samples" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {SAMPLE_CALLS.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSampleCall(s)}
              className={`rounded-xl border p-4 text-left transition hover:border-brand hover:bg-brand/5 hover:shadow-sm ${
                fileName === `${s.title}.txt` ? "border-brand bg-brand/5 shadow-sm" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xl">{TYPE_ICON[s.type] ?? "📞"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{s.title}</span>
                    <span className="text-sm">{SENTIMENT_ICON[s.sentiment]}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{s.type}</p>
                  <p className="mt-1 text-xs text-foreground/70 line-clamp-2">{s.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-negative/10 px-4 py-3 text-sm text-negative">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* CTA */}
      <div className="mt-6">
        <button
          onClick={analyze}
          disabled={!text.trim()}
          className="group relative w-full overflow-hidden rounded-xl bg-brand py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>🔍</span>
            {text.trim() ? `Analyze "${fileName ?? "conversation"}"` : "Select a file or sample to begin"}
          </span>
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          Takes 10–15 seconds · Powered by gpt-4o via n8n
        </p>
      </div>
    </div>
  );
}

function AnalyzingState({
  step,
  elapsed,
  fileName,
}: {
  step: number;
  elapsed: number;
  fileName: string | null;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="relative mx-auto mb-6 h-20 w-20">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-border border-t-brand" />
        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-brand/10 text-2xl">
          🎙️
        </div>
      </div>
      <h2 className="text-xl font-semibold">Analyzing your conversation</h2>
      <p className="mt-1 text-sm text-muted">{fileName ?? "conversation"} · {elapsed}s elapsed</p>

      <div className="mt-8 space-y-3 text-left">
        {ANALYSIS_STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                done ? "border-positive/30 bg-positive/5"
                : active ? "border-brand/40 bg-brand/5 shadow-sm"
                : "border-border opacity-40"
              }`}
            >
              <span className="text-lg shrink-0">
                {done ? "✅" : active ? "⏳" : "○"}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${active ? "text-brand" : done ? "text-positive" : "text-muted"}`}>
                  {s.label}
                </p>
                {active && <p className="text-xs text-muted mt-0.5">{s.detail}</p>}
              </div>
              {active && (
                <div className="ml-auto flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted">
        Analyzing sentiment, emotions, and 16 call-center KPIs…
      </p>
    </div>
  );
}
