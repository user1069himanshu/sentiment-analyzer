import LogoutButton from "@/components/LogoutButton";
import DashboardNav from "@/components/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <span className="font-semibold">Sentiment Analyzer</span>
            </div>
            <DashboardNav />
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 overflow-auto px-6 py-4">{children}</main>
    </div>
  );
}
