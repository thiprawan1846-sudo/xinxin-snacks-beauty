import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-compatible JWT session primitives.
 *
 * This module is imported by `middleware.ts`, which runs on the Edge Runtime.
 * It MUST NOT import any Node.js-only module (bcryptjs, next/headers, etc.)
 * or the edge function will fail to build/deploy. Password hashing and
 * cookie-aware helpers live in `auth.ts` (Node runtime) instead.
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

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 86400;
