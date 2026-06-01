import { Suspense } from "react";
import SentenceView from "@/components/SentenceView";

export default function SentimentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
        </div>
      }
    >
      <SentenceView mode="sentiment" />
    </Suspense>
  );
}
