"use client";

import { useEffect, useState } from "react";
import { getHistory, type StoredAnalysis } from "./history";

export function useHistory() {
  const [history,    setHistory] = useState<StoredAnalysis[]>([]);
  const [ready,      setReady]   = useState(false);

  useEffect(() => {
    getHistory().then(setHistory).finally(() => setReady(true));
  }, []);

  return { history, setHistory, ready };
}
