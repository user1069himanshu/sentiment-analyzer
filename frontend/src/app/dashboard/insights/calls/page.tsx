import { Suspense } from "react";
import FilteredCalls from "@/components/FilteredCalls";

export default function FilteredCallsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
        </div>
      }
    >
      <FilteredCalls />
    </Suspense>
  );
}
