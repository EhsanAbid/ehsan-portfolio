import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { loadAdmin } from "@/lib/adminData";
import { InboxList } from "./InboxList";

export default async function InboxPage() {
  await loadAdmin();
  const rows = await getDb()
    .select({
      id: schema.messages.id,
      name: schema.messages.name,
      email: schema.messages.email,
      message: schema.messages.message,
      read: schema.messages.read,
      spam: schema.messages.spam,
      createdAt: schema.messages.createdAt,
    })
    .from(schema.messages)
    .orderBy(desc(schema.messages.createdAt))
    .limit(500);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <p className="mt-1 text-sm text-muted">Messages from the Signal Station contact form.</p>
        </div>
        <a href="/api/admin/inbox" className="a-btn">
          ⭳ Export CSV
        </a>
      </div>
      <InboxList messages={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
    </div>
  );
}
