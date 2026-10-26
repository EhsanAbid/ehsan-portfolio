"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mediaUrl } from "@/lib/mediaUrl";
import { UploadForm, uploadFile } from "@/components/admin/MediaPicker";
import { deleteMediaAction, replaceMediaAction, updateMediaAltAction } from "../../actions";
import { useAdmin } from "@/components/admin/AdminContext";

type Row = {
  id: number;
  key: string;
  filename: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number;
  alt: string;
  usedIn: string[];
};

export function MediaLibrary({ items }: { items: Row[] }) {
  const router = useRouter();
  return (
    <div className="grid gap-6">
      <div className="a-card p-4">
        <UploadForm accept="any" onUploaded={() => router.refresh()} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <MediaCard key={m.id} m={m} />
        ))}
        {!items.length && <p className="text-muted">No files yet.</p>}
      </div>
    </div>
  );
}

function MediaCard({ m }: { m: Row }) {
  const router = useRouter();
  const { setChanges, changes } = useAdmin();
  const [alt, setAlt] = useState(m.alt);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const isPdf = m.mime === "application/pdf";

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, touchesDraft = false) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? okMsg : (r.error ?? "Failed"));
      if (r.ok) {
        if (touchesDraft) setChanges(Math.max(changes, 1));
        router.refresh();
      }
    });

  return (
    <div className="a-card flex flex-col overflow-hidden">
      <a href={mediaUrl(m.key)} target="_blank" rel="noreferrer" className="block aspect-video bg-black/40">
        {isPdf ? (
          <span className="flex size-full items-center justify-center text-4xl">📄</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(m.key)} alt={m.alt} className="size-full object-contain" loading="lazy" />
        )}
      </a>
      <div className="grid gap-2 p-3 text-xs">
        <p className="truncate font-medium text-white" title={m.filename}>{m.filename}</p>
        <p className="text-muted">
          {Math.round(m.size / 1024)} KB{m.width ? ` · ${m.width}×${m.height}` : ""} · <code>{m.key.slice(0, 10)}…</code>
        </p>
        <label>
          <span className="a-label">Alt text</span>
          <div className="flex gap-1.5">
            <input className="a-input" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={500} />
            <button className="a-btn" disabled={pending || alt === m.alt} onClick={() => run(() => updateMediaAltAction(m.id, alt), "Alt text saved", true)}>
              Save
            </button>
          </div>
        </label>
        <p className="text-muted">
          {m.usedIn.length ? (
            <>
              Used in: <span className="text-text">{m.usedIn.slice(0, 4).join(", ")}{m.usedIn.length > 4 ? "…" : ""}</span>
            </>
          ) : (
            "Not used anywhere"
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <label className="a-btn cursor-pointer">
            Replace…
            <input
              type="file"
              className="sr-only"
              accept={isPdf ? "application/pdf" : "image/*"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                run(async () => {
                  const n = await uploadFile(f, alt || m.alt);
                  return replaceMediaAction(m.id, n.id);
                }, "Replaced in the draft — publish to go live", true);
              }}
            />
          </label>
          <button className="a-btn a-btn-danger" disabled={pending} onClick={() => window.confirm("Delete this file permanently?") && run(() => deleteMediaAction(m.id), "Deleted")}>
            Delete
          </button>
        </div>
        {msg && <p className="text-cyan" role="status">{msg}</p>}
      </div>
    </div>
  );
}
