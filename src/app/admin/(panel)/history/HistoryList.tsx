"use client";

import { useState, useTransition } from "react";
import { importBackupAction, loadVersionAction, restoreVersionAction } from "../../actions";

type V = { id: number; status: string; note: string | null; createdAt: string; updatedAt: string; publishedAt: string | null };

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-GB") : "—");

export function HistoryList({ versions }: { versions: V[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? ok : (r.error ?? "Failed"));
      if (r.ok) window.location.reload();
    });

  return (
    <div className="grid gap-5">
      <div className="a-card flex flex-wrap items-center gap-3 p-4">
        <a href="/api/admin/export" className="a-btn a-btn-primary">
          ⭳ Export backup (JSON)
        </a>
        <label className="a-btn cursor-pointer">
          ⭱ Import backup…
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (!window.confirm("Replace the current draft with this backup? (The live site is not touched until you Publish.)")) return;
              const text = await f.text();
              run(() => importBackupAction(text), "Backup imported into the draft — preview, then Publish.");
            }}
          />
        </label>
        {msg && <span className="text-xs text-cyan" role="status">{msg}</span>}
      </div>

      <div className="a-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-white/10">
              <th className="p-3">#</th>
              <th className="p-3">Status</th>
              <th className="p-3">Published / saved</th>
              <th className="p-3">Note</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id} className="border-b border-white/5 last:border-0">
                <td className="p-3 font-mono text-muted">{v.id}</td>
                <td className="p-3">
                  <span className={`chip ${v.status === "published" ? "!text-emerald-300" : v.status === "draft" ? "!text-amber-300" : ""}`}>{v.status}</span>
                </td>
                <td className="p-3 whitespace-nowrap">{fmt(v.publishedAt ?? v.updatedAt)}</td>
                <td className="p-3 text-muted">{v.note ?? ""}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1.5">
                    <a href={`/preview?version=${v.id}`} target="_blank" rel="noopener" className="a-btn">Preview</a>
                    {v.status === "archived" && (
                      <>
                        <button className="a-btn" disabled={pending} onClick={() => run(() => loadVersionAction(v.id), "Loaded into the draft")}>
                          Edit as draft
                        </button>
                        <button
                          className="a-btn a-btn-primary"
                          disabled={pending}
                          onClick={() => window.confirm(`Make version #${v.id} live again?`) && run(() => restoreVersionAction(v.id), "Restored")}
                        >
                          Restore
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
