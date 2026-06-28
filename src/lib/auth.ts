import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Lightweight JWT auth for the MVP.
 * - Passwords hashed with bcrypt (mock users seeded in src/data/users.ts)
 * - Session stored in an httpOnly cookie (XSS-safe)
 * - Token verified in middleware via `verifySession` (edge-compatible via jose)
 *
 * When wiring up Prisma/Supabase, replace `mockUsers` lookups with DB queries;
 * the rest of the surface (signSession / verifySession / hashPassword) stays.
 */

const SESSION_COOKIE = "xinxin_session";
const SESSION_TTL_DAYS = 7;

/**
 * JWT signing secret. In production we fail fast if it's missing — a silent
 * fallback to a known dev string would let anyone forge session tokens.
 * Dev falls back to a fixed value only for local convenience.
 */
const RAW_SECRET = process.env.JWT_SECRET;
if (!RAW_SECRET && process.env.NODE_ENV === "production") {
  throw new Error(
    "JWT_SECRET environment variable is required in production. Generate one with `openssl rand -base64 32`.",
  );
}
const secret = new TextEncoder().encode(
  RAW_SECRET ?? "xinxin-mvp-dev-secret-change-in-prod",
);

const ISSUER = "xinxin-snacks-beauty";
const AUDIENCE = "xinxin-users";

export interface SessionPayload {
  sub: string; // user id
  role: "CUSTOMER" | "ADMIN";
  email: string;
  name: string;
}

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

/** Sign a JWT session token for a user. */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(secret);
}

/** Verify a token and return its payload, or null if invalid/expired. */
export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return {
      sub: payload.sub as string,
      role: payload.role as SessionPayload["role"],
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/** Read the session cookie (server-side, in Route Handlers / Server Components). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
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
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
    SESSION_TTL_DAYS * 86400
  }; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`;
}

/** Clear the session cookie (logout). */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
