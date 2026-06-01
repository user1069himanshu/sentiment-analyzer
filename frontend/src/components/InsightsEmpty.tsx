import Link from "next/link";

export default function InsightsEmpty() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/10 text-4xl">
          📊
        </div>
        <h1 className="text-xl font-semibold">No calls analyzed yet</h1>
        <p className="mt-2 text-sm text-muted">
          Analyze a conversation and it will appear here automatically.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Analyze a call →
        </Link>
      </div>
    </div>
  );
}
