"use client";

/**
 * Small "ⓘ" affordance that reveals an explanatory tooltip on hover/focus.
 * Pure CSS (no JS state) — uses a named Tailwind group so multiple tips can
 * coexist on one card without interfering.
 */
export default function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="ml-1 flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-muted/50 text-[9px] font-bold leading-none text-muted transition-colors hover:border-brand hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-background opacity-0 shadow-xl transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </span>
    </span>
  );
}
