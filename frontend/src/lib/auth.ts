import { createHmac, timingSafeEqual } from "crypto";

// Lightweight signed-cookie session. Basic auth is acceptable for this
// assignment; this keeps credentials server-side and the cookie tamper-evident.

export const SESSION_COOKIE = "sa_session";

const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";

export function validCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.APP_USERNAME || "admin";
  const expectedPass = process.env.APP_PASSWORD || "admin123";
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}

export function createSessionToken(username: string): string {
  const payload = `${username}.${Date.now()}`;
  const sig = sign(payload);
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  return safeEqual(sig, sign(payload));
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
