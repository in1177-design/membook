import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (isLoginPage || isLoginApi) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const sessionCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = await isValidAdminSession(sessionCookie);

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
