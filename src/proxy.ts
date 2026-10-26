import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (formerly "middleware") — runs before /admin and /preview requests.
 * It only does a cheap convenience redirect when there is no session cookie at all and
 * marks the pages noindex. It is NOT the security boundary: every admin page, action
 * and API route verifies the signed session on the server itself (src/lib/auth.ts).
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasCookie = req.cookies.has("ehsan_admin");
  if (!hasCookie && pathname !== "/admin/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/preview"],
};
