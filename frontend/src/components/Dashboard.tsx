"use client";

import { useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import Results from "@/components/Results";

export default function Dashboard() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function readFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Please upload a .txt file.");
      return;
    }
    setError(null);
    setFileName(file.name);
    setText(await file.text());
  }

  async function loadSample() {
    setError(null);
    const res = await fetch("/sample-conversation.txt");
    setText(await res.text());
    setFileName("sample-conversation.txt");
  }

  async function analyze() {
    if (!text.trim()) {
      setError("Upload a file or load the sample first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setFileName(null);
    setText("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (result) {
    return <Results result={result} fileName={fileName} onReset={reset} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Analyze a conversation</h1>
      <p className="mb-6 text-sm text-muted">
        Upload a <code className="font-mono">.txt</code> transcript to see
        sentiment, emotions, and call KPIs.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center transition hover:border-brand"
      >
        <div className="mb-2 text-3xl">📄</div>
        <p className="font-medium">
          {fileName ? fileName : "Drop a .txt file or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted">
          {fileName
            ? `${text.length.toLocaleString()} characters loaded`
            : "Conversation transcripts work best"}
        </p>
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

      {error && (
        <p className="mt-4 rounded-lg bg-negative/10 px-3 py-2 text-sm text-negative">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={analyze}
          disabled={loading}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Analyze sentiment"}
        </button>
        <button
          onClick={loadSample}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-card"
        >
          Try the sample
        </button>
      </div>
    </div>
  );
}
