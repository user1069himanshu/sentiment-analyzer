import { Suspense } from "react";
import SentenceDetail from "@/components/SentenceDetail";

export default function SentencesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
        </div>
      }
    >
      <SentenceDetail />
    </Suspense>
  );
}
