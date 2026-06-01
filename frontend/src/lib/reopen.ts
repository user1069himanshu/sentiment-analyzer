"use client";

import type { StoredAnalysis } from "./history";

/**
 * Persist a stored analysis into sessionStorage so the main Dashboard
 * component picks it up on mount and renders the Results view.
 *
 * Pair with router.push("/dashboard") in the calling component.
 *
 * Note: we don't restore the raw transcript text — only the analyzed result.
 * The Results view shows everything the user cares about; the raw text was
 * just an intermediate input that the user already submitted.
 */
export function stashForReopen(a: StoredAnalysis): void {
  try {
    sessionStorage.setItem("sa_draft_result",   JSON.stringify(a.result));
    sessionStorage.setItem("sa_draft_filename", a.fileName);
    sessionStorage.removeItem("sa_draft_text");
  } catch {}
}
