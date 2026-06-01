"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";

const TABS = [
  { href: "/dashboard/sentences/sentiment", icon: "😊", label: "Sentiment" },
  { href: "/dashboard/sentences/emotion",   icon: "🎭", label: "Emotion"   },
  { href: "/dashboard/sentences/phase",     icon: "🌊", label: "Phase"     },
] as const;

export default function SentencesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <div className="flex h-full flex-col gap-3">
      {/* ── Nav bar ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-background"
        >
          ← Back
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">💬</span>
          <h1 className="text-base font-bold">Sentence Analysis</h1>
        </div>

        {/* Page tabs — right-aligned */}
        <div className="ml-auto flex gap-1 rounded-xl border border-border bg-card p-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname.startsWith(t.href)
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Content fills remaining height ── */}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
