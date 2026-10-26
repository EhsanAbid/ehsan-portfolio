import { and, count, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db/client";
import { json, sameOrigin } from "@/lib/http";
import { CONTACT_MAX, CONTACT_WINDOW_MS, clientIpHash } from "@/lib/rateLimit";

const body = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(5).max(5000),
  website: z.string().max(200).optional(), // honeypot: humans never see or fill it
  t: z.number().int().optional(), // when the form was rendered (ms)
});

/**
 * POST /api/contact — Signal Station → admin Inbox (stored in Neon, no third-party service).
 * Anti-spam: same-origin check, Zod length limits, a hidden honeypot field, a minimum fill
 * time, and at most 3 messages per IP per 10 minutes.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  if (Number(req.headers.get("content-length") ?? 0) > 20_000) return json({ error: "Too large" }, 413);

  let data: z.infer<typeof body>;
  try {
    data = body.parse(await req.json());
  } catch {
    return json({ error: "invalid" }, 400);
  }

  // Bots fill every field and submit instantly. Pretend success so they don't adapt.
  const tooFast = data.t !== undefined && Date.now() - data.t < 2500;
  if (data.website || tooFast) return json({ ok: true });

  const db = getDb();
  const ipHash = await clientIpHash();
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.messages)
    .where(and(eq(schema.messages.ipHash, ipHash), gt(schema.messages.createdAt, new Date(Date.now() - CONTACT_WINDOW_MS))));
  if (n >= CONTACT_MAX) return json({ error: "rate" }, 429);

  await db.insert(schema.messages).values({ name: data.name, email: data.email, message: data.message, ipHash });
  return json({ ok: true });
}
