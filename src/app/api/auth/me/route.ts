import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findUserById, toPublicUser } from "@/data/users";

/** GET /api/auth/me — returns the current logged-in user, or 401. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ data: null }, { status: 401 });
  }
  const record = await findUserById(session.sub);
  if (!record) {
    return NextResponse.json({ data: null }, { status: 401 });
  }
  return NextResponse.json({ data: toPublicUser(record) });
}
