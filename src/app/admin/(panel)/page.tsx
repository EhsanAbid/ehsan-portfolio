import Link from "next/link";
import { getDb, schema } from "@/db/client";
import { loadAdmin, unreadCount } from "@/lib/adminData";
import { AREA_LINKS } from "@/lib/adminLinks";
import { findTodos, todoHint } from "@/lib/todo";

export default async function Dashboard() {
  const [{ site, changes, publishedAt, hasDraft }, unread, stats] = await Promise.all([
    loadAdmin(),
    unreadCount(),
    getDb().select().from(schema.stats),
  ]);
  const todos = findTodos(site);
  const grouped = Object.groupBy(todos, (t) => t.path.split(/[.[]/)[0]);
  const stat = (k: string) => stats.find((s) => s.key === k)?.count ?? 0;

  const cards = [
    { label: "Unpublished changes", value: changes, hint: hasDraft ? "draft in progress" : "nothing pending" },
    { label: "Missing content", value: todos.length, hint: "TODO_EHSAN fields" },
    { label: "Unread messages", value: unread, hint: "in the Inbox", href: "/admin/inbox" },
    { label: "Projects", value: site.works.length, hint: "in the 3D flight", href: "/admin/content?tab=works" },
    { label: "Visits", value: stat("visits"), hint: "unique sessions" },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Last published: {publishedAt ? new Date(publishedAt).toLocaleString("en-GB") : "never"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((c) => {
          const inner = (
            <>
              <p className="text-xs text-muted">{c.label}</p>
              <p className="mt-1 font-heading text-3xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-muted">{c.hint}</p>
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="a-card p-4 hover:border-cyan/40">{inner}</Link>
          ) : (
            <div key={c.label} className="a-card p-4">{inner}</div>
          );
        })}
      </div>

      <section className="a-card p-5" aria-labelledby="todo-h">
        <h2 id="todo-h" className="text-lg font-semibold text-white">
          Missing-content checklist <span className="text-muted">({todos.length})</span>
        </h2>
        <p className="mb-4 text-xs text-muted">
          Placeholders marked <code>TODO_EHSAN</code>. They are hidden on the live site and shown in Preview. Fill them in, then Publish.
        </p>
        {todos.length === 0 ? (
          <p className="text-emerald-300">Everything is filled in. 🎉</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(grouped).map(([area, items]) => (
              <div key={area}>
                <Link href={AREA_LINKS[area]?.href ?? "/admin"} className="text-sm font-semibold text-cyan hover:underline">
                  {AREA_LINKS[area]?.label ?? area} → ({items!.length})
                </Link>
                <ul className="mt-1.5 space-y-1">
                  {items!.slice(0, 8).map((t) => (
                    <li key={t.path} className="text-xs">
                      <code className="text-muted">{t.path}</code> <span className="text-amber-200/90">{todoHint(t.value)}</span>
                    </li>
                  ))}
                  {items!.length > 8 && <li className="text-xs text-muted">…and {items!.length - 8} more</li>}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
