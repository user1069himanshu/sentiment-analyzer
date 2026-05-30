import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const authed = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  redirect(authed ? "/dashboard" : "/login");
}
