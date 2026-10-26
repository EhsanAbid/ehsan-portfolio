import "server-only";

/**
 * Reject cross-site POSTs to our API routes. Browsers always send an Origin header on
 * POST; if it isn't our own host, someone else's page is trying to submit on the user's
 * behalf (CSRF). Server actions get this check from Next.js automatically.
 */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
