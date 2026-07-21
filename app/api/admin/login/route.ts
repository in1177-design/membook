import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, createAdminSessionValue } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || !checkAdminPassword(password)) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }

  const sessionValue = await createAdminSessionValue();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
