"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Analyze" },
  { href: "/dashboard/insights", label: "Insights" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard"
          ? pathname === l.href
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? "bg-brand/10 text-brand" : "text-muted hover:bg-background"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
