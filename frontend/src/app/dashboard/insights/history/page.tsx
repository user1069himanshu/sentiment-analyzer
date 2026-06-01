"use client";

import { useHistory } from "@/lib/useHistory";
import { clearHistory } from "@/lib/history";
import InsightsHistory from "@/components/InsightsHistory";
import InsightsEmpty from "@/components/InsightsEmpty";

export default function InsightsHistoryPage() {
  const { history, setHistory, ready } = useHistory();

  async function onClear() {
    if (confirm("Delete all stored call history? This cannot be undone.")) {
      await clearHistory();
      setHistory([]);
    }
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  if (history.length === 0) return <InsightsEmpty />;

  return <InsightsHistory history={history} onClear={onClear} />;
}
