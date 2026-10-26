"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { discardDraftAction, publishAction } from "@/app/admin/actions";
import { useAdmin } from "./AdminContext";

/** Top bar: unpublished-changes counter, Preview, Publish, Discard. */
export function PublishBar() {
  const { changes, setChanges } = useAdmin();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");

  const publish = () =>
    start(async () => {
      const res = await publishAction(note);
      if (res.ok) {
        setChanges(0);
        setNote("");
        setMsg("Published ✓ — live in a few seconds");
        router.refresh();
      } else setMsg(res.error);
    });

  const discard = () => {
    if (!window.confirm("Discard all unpublished changes and go back to the live version?")) return;
    start(async () => {
      const res = await discardDraftAction();
      if (res.ok) {
        setChanges(0);
        setMsg("Draft discarded");
        // Editors hold their own state, so reload them from the live version.
        window.location.reload();
      } else setMsg(res.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${changes ? "bg-amber-400/15 text-amber-300" : "bg-emerald-500/10 text-emerald-300"}`}>
        {changes ? `${changes} unpublished change${changes === 1 ? "" : "s"}` : "Live = draft"}
      </span>
      <a href="/preview" target="_blank" rel="noopener" className="a-btn">
        Preview ↗
      </a>
      <input
        className="a-input !min-h-[34px] !w-44 !py-1 text-xs"
        placeholder="Publish note (optional)"
        value={note}
        maxLength={200}
        onChange={(e) => setNote(e.target.value)}
        aria-label="Publish note"
      />
      <button type="button" className="a-btn a-btn-primary" onClick={publish} disabled={pending || !changes}>
        {pending ? "Working…" : "Publish"}
      </button>
      <button type="button" className="a-btn a-btn-danger" onClick={discard} disabled={pending || !changes}>
        Discard
      </button>
      {msg && (
        <span className="text-xs text-muted" role="status">
          {msg}
        </span>
      )}
    </div>
  );
}
