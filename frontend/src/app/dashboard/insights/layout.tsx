"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

const TABS = [
  { href: "/dashboard/insights",         label: "📊 Overview" },
  { href: "/dashboard/insights/issues",  label: "🏷️ Issues"   },
  { href: "/dashboard/insights/history", label: "🕐 History"  },
] as const;

export default function InsightsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-3">
      {/* ── Header + page nav ── */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">📊 Insights Dashboard</h1>

        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                pathname === t.href
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="min-h-0 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
