import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-2xl">
            💬
          </div>
          <h1 className="text-2xl font-semibold">Sentiment Analyzer</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to analyze your conversations
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
