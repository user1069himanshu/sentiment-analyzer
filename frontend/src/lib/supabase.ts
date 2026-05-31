// Supabase persistence layer.
// Falls back to localStorage if credentials are not configured.
//
// Setup:
// 1. Create a free project at supabase.com
// 2. Run this SQL in the Supabase SQL editor:
//
//    create table call_history (
//      id text primary key,
//      file_name text not null,
//      created_at timestamptz default now(),
//      result jsonb not null
//    );
//    alter table call_history enable row level security;
//    create policy "anon read write" on call_history
//      for all to anon using (true) with check (true);
//
// 3. Add to frontend/.env.local:
//    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

import type { StoredAnalysis } from "./history";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isConfigured(): boolean {
  return Boolean(URL && KEY);
}

async function supaFetch(
  path: string,
  opts: RequestInit = {}
): Promise<Response> {
  return fetch(`${URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(opts.headers ?? {}),
    },
  });
}

export async function dbGetHistory(): Promise<StoredAnalysis[]> {
  if (!isConfigured()) return [];
  try {
    const res = await supaFetch(
      "/call_history?order=created_at.desc&limit=200"
    );
    if (!res.ok) return [];
    const rows: { id: string; file_name: string; created_at: string; result: unknown }[] =
      await res.json();
    return rows.map((r) => ({
      id: r.id,
      fileName: r.file_name,
      createdAt: r.created_at,
      result: r.result as StoredAnalysis["result"],
    }));
  } catch {
    return [];
  }
}

export async function dbSaveAnalysis(entry: StoredAnalysis): Promise<void> {
  if (!isConfigured()) return;
  try {
    await supaFetch("/call_history", {
      method: "POST",
      body: JSON.stringify({
        id: entry.id,
        file_name: entry.fileName,
        created_at: entry.createdAt,
        result: entry.result,
      }),
    });
  } catch {
    /* non-fatal */
  }
}

export async function dbDeleteAnalysis(id: string): Promise<void> {
  if (!isConfigured()) return;
  try {
    await supaFetch(`/call_history?id=eq.${id}`, { method: "DELETE" });
  } catch {}
}

export async function dbClearHistory(): Promise<void> {
  if (!isConfigured()) return;
  try {
    await supaFetch("/call_history?id=neq.none", { method: "DELETE" });
  } catch {}
}

export const supabaseConfigured = isConfigured();
