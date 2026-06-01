"use client";

import { useMemo } from "react";
import { aggregate } from "@/lib/history";
import { useHistory } from "@/lib/useHistory";
import InsightsIssues from "@/components/InsightsIssues";
import InsightsEmpty from "@/components/InsightsEmpty";

export default function InsightsIssuesPage() {
  const { history, ready } = useHistory();
  const agg = useMemo(() => aggregate(history), [history]);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  if (history.length === 0) return <InsightsEmpty />;

  return <InsightsIssues agg={agg} />;
}
