import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { getSession } from "@/lib/auth";
import { json } from "@/lib/http";

/** CSV cell: quote it, double inner quotes, and neutralise spreadsheet formulas (=, +, -, @). */
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

/** GET /api/admin/inbox — all messages as CSV (admin only). */
export async function GET() {
  if (!(await getSession())) return json({ error: "Not signed in" }, 401);
  const rows = await getDb().select().from(schema.messages).orderBy(desc(schema.messages.createdAt));
  const lines = [
    ["id", "date", "name", "email", "message", "read", "spam"].join(","),
    ...rows.map((r) => [r.id, r.createdAt.toISOString(), r.name, r.email, r.message, r.read, r.spam].map(cell).join(",")),
  ];
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ehsan-exe-inbox-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
