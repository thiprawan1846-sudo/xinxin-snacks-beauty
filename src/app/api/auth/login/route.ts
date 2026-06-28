import { NextResponse } from "next/server";
import {
  signSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { findUserByEmail, toPublicUser } from "@/data/users";

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Sets an httpOnly session cookie and returns the public user.
 */
export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "กรุณากรอกอีเมลและรหัสผ่าน" },
      { status: 400 },
    );
  }

  const record = await findUserByEmail(email);
  if (!record) {
    return NextResponse.json(
      { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  const valid = await verifyPassword(password, record.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  const token = await signSession({
    sub: record.id,
    role: record.role,
    email: record.email,
    name: record.name,
  });

  const res = NextResponse.json({ data: toPublicUser(record) });
  res.headers.set("Set-Cookie", setSessionCookie(token));
  return res;
}
