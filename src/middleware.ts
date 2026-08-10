import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  createSessionCookieValue,
  sessionCookieOptions,
  verifySessionCookieValue,
} from "@/lib/session";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = path.startsWith("/login") || path.startsWith("/p/");
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionCookieValue(cookie);

  if (!valid) {
    if (isPublic) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // sliding expiry: reissue the cookie on every authenticated request
  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE_NAME, await createSessionCookieValue(), sessionCookieOptions);
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"] };
