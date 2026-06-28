import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  signSession,
  verifySession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  type SessionPayload,
} from "@/lib/session";

/**
 * Node-runtime auth helpers. Password hashing + cookie-aware session utils
 * live here because they depend on Node-only APIs (bcryptjs, next/headers).
 *
 * The edge-compatible JWT primitives (signSession / verifySession) are in
 * `session.ts` so `middleware.ts` can import them without pulling bcryptjs
 * into the Edge Runtime bundle.
 */

// Re-export so existing callers can keep importing from "@/lib/auth".
export {
  signSession,
  verifySession,
  SESSION_COOKIE_NAME,
  type SessionPayload,
};

/** Hash a plaintext password (used at seed time + registration). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** Verify a plaintext password against a stored hash. */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Read the session cookie (server-side, in Route Handlers / Server Components). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Guard for admin-only Route Handlers. Returns the admin session on success,
 * or a 401/403 NextResponse when the caller is unauthenticated or not an
 * admin. Usage:
 *   const session = await requireAdmin();
 *   if (session instanceof NextResponse) return session;
 */
export async function requireAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return session;
}

/** Set the session cookie on a Response (login/register). */
export function setSessionCookie(token: string): string {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}; ${
    process.env.NODE_ENV === "production" ? "Secure;" : ""
  }`;
}

/** Clear the session cookie (logout). */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
