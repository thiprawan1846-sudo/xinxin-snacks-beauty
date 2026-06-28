/**
 * User data access — Supabase REST API implementation.
 *
 * Replaces the in-memory mock. Passwords are bcrypt-hashed before storage.
 * The DB column is `password` (per Prisma schema); we expose it as
 * `passwordHash` in the returned record for compatibility with auth.ts.
 */
import bcrypt from "bcryptjs";
import type { User } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

export interface UserRecord extends User {
  passwordHash: string;
}

interface UserRow {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

function toRecord(r: UserRow): UserRecord {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    passwordHash: r.password,
    createdAt: r.createdAt,
  };
}

/** Find a user by email. */
export async function findUserByEmail(
  email: string,
): Promise<UserRecord | undefined> {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("email", `eq.${email.toLowerCase()}`);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/User?${params.toString()}`,
    { headers },
  );
  if (!res.ok) return undefined;
  const rows = (await res.json()) as UserRow[];
  return rows[0] ? toRecord(rows[0]) : undefined;
}

/** Find a user by id. */
export async function findUserById(
  id: string,
): Promise<UserRecord | undefined> {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("id", `eq.${id}`);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/User?${params.toString()}`,
    { headers },
  );
  if (!res.ok) return undefined;
  const rows = (await res.json()) as UserRow[];
  return rows[0] ? toRecord(rows[0]) : undefined;
}

/** Strip the password hash before returning to the client. */
export function toPublicUser(u: UserRecord): User {
  const { passwordHash: _pw, ...publicUser } = u;
  void _pw;
  return publicUser;
}

/** Hash a plaintext password. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * Register a new user. Returns the public user or throws on duplicate email.
 * Also seeds the two demo accounts if the table is empty (first run only).
 */
export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<UserRecord> {
  if (await findUserByEmail(input.email)) {
    throw new Error("EMAIL_TAKEN");
  }

  await ensureDemoUsers();

  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);

  const row: UserRow = {
    id,
    email: input.email,
    password: passwordHash,
    name: input.name,
    role: "CUSTOMER",
    createdAt: now,
    updatedAt: now,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/User`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createUser failed: ${res.status} ${text}`);
  }
  return toRecord(row);
}

/**
 * Seed demo admin + customer accounts if the User table is empty.
 * Idempotent — skipped once any user exists.
 */
let demoSeeded = false;
async function ensureDemoUsers(): Promise<void> {
  if (demoSeeded) return;
  const params = new URLSearchParams();
  params.set("select", "id");
  params.set("limit", "1");
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/User?${params.toString()}`,
    { headers },
  );
  const rows = (await res.json()) as UserRow[];
  if (rows.length > 0) {
    demoSeeded = true;
    return;
  }

  const now = new Date().toISOString();
  const demos: UserRow[] = [
    {
      id: "u_admin",
      email: "admin@xinxin.shop",
      password: await hashPassword("admin123"),
      name: "Admin XinXin",
      role: "ADMIN",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: now,
    },
    {
      id: "u_demo",
      email: "customer@xinxin.shop",
      password: await hashPassword("demo123"),
      name: "คุณใบหยก",
      role: "CUSTOMER",
      createdAt: "2026-02-14T00:00:00Z",
      updatedAt: now,
    },
  ];
  await fetch(`${SUPABASE_URL}/rest/v1/User`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(demos),
  });
  demoSeeded = true;
}
