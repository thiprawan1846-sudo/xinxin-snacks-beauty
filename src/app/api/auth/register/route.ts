import { NextResponse } from "next/server";
import {
  signSession,
  setSessionCookie,
} from "@/lib/auth";
import { createUser, toPublicUser } from "@/data/users";

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Creates a CUSTOMER account, sets session cookie, returns public user.
 */
export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "กรุณากรอกข้อมูลให้ครบ" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "รูปแบบอีเมลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  try {
    const record = await createUser({ name, email, password });
    const token = await signSession({
      sub: record.id,
      role: record.role,
      email: record.email,
      name: record.name,
    });
    const res = NextResponse.json({ data: toPublicUser(record) }, { status: 201 });
    res.headers.set("Set-Cookie", setSessionCookie(token));
    return res;
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้แล้ว" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "สมัครสมาชิกไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
