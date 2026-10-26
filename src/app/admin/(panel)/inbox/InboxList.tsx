"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMessageAction, updateMessageAction } from "../../actions";

type Msg = { id: number; name: string; email: string; message: string; read: boolean; spam: boolean; createdAt: string };

export function InboxList({ messages }: { messages: Msg[] }) {
  const [tab, setTab] = useState<"inbox" | "spam">("inbox");
  const [open, setOpen] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const shown = messages.filter((m) => (tab === "spam" ? m.spam : !m.spam));

  const act = (fn: () => Promise<{ ok: boolean }>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div>
      <div className="mb-4 flex gap-1.5" role="tablist">
        {(["inbox", "spam"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`a-btn ${tab === t ? "!border-cyan !text-cyan" : ""}`} onClick={() => setTab(t)}>
            {t === "inbox" ? `Inbox (${messages.filter((m) => !m.spam).length})` : `Spam (${messages.filter((m) => m.spam).length})`}
          </button>
        ))}
      </div>
      <ul className="grid gap-2">
        {shown.map((m) => {
          const expanded = open === m.id;
          return (
            <li key={m.id} className={`a-card p-3 ${m.read ? "" : "border-cyan/40"}`}>
              <button
                type="button"
                className="flex w-full items-start gap-3 text-left"
                aria-expanded={expanded}
                onClick={() => {
                  setOpen(expanded ? null : m.id);
                  if (!m.read) act(() => updateMessageAction(m.id, { read: true }));
                }}
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${m.read ? "bg-transparent" : "bg-cyan"}`} aria-label={m.read ? "read" : "unread"} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap justify-between gap-2">
                    <span className={`truncate ${m.read ? "text-text" : "font-semibold text-white"}`}>
                      {m.name} <span className="text-muted">&lt;{m.email}&gt;</span>
                    </span>
                    <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString("en-GB")}</span>
                  </span>
                  {!expanded && <span className="block truncate text-xs text-muted">{m.message}</span>}
                </span>
              </button>
              {expanded && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-sm whitespace-pre-wrap text-text">{m.message}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <a className="a-btn a-btn-primary" href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: your message")}`}>
                      Reply by email
                    </a>
                    <button className="a-btn" disabled={pending} onClick={() => act(() => updateMessageAction(m.id, { read: !m.read }))}>
                      Mark {m.read ? "unread" : "read"}
                    </button>
                    <button className="a-btn" disabled={pending} onClick={() => act(() => updateMessageAction(m.id, { spam: !m.spam }))}>
                      {m.spam ? "Not spam" : "Mark spam"}
                    </button>
                    <button className="a-btn a-btn-danger" disabled={pending} onClick={() => window.confirm("Delete this message?") && act(() => deleteMessageAction(m.id))}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {!shown.length && <li className="text-muted">Nothing here.</li>}
      </ul>
    </div>
  );
}
