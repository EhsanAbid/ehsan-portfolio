"use client";

import { useEffect, useState } from "react";
import type { MediaRef } from "@/schema/fields";
import { mediaUrl } from "@/lib/mediaUrl";
import { listMediaAction } from "@/app/admin/actions";

type Item = Awaited<ReturnType<typeof listMediaAction>>[number];

export async function uploadFile(file: File, alt: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("alt", alt);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({ error: "Upload failed" }));
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.media as Item;
}

export function UploadForm({ accept, onUploaded }: { accept: "image" | "pdf" | "any"; onUploaded: (m: Item) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const acceptAttr = accept === "pdf" ? "application/pdf" : accept === "image" ? "image/jpeg,image/png,image/webp,image/gif,image/avif" : "image/*,application/pdf";

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return setError("Choose a file first.");
        if (!alt.trim()) return setError("Alt text is required.");
        setBusy(true);
        setError("");
        try {
          const m = await uploadFile(file, alt.trim());
          onUploaded(m);
          setFile(null);
          setAlt("");
          (e.target as HTMLFormElement).reset();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="flex-1">
        <span className="a-label">File ({accept === "pdf" ? "PDF ≤ 5 MB" : "image ≤ 4 MB, auto WebP"})</span>
        <input type="file" accept={acceptAttr} className="a-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <label className="flex-1">
        <span className="a-label">Alt text (required)</span>
        <input className="a-input" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe what's in it" maxLength={500} />
      </label>
      <button className="a-btn a-btn-primary" disabled={busy}>
        {busy ? "Uploading…" : "Upload"}
      </button>
      {error && <p className="a-error sm:basis-full">{error}</p>}
    </form>
  );
}

/** Field widget: shows the chosen file and opens a library dialog to pick/upload another. */
export function MediaPicker({ value, onChange, accept = "image" }: { value: MediaRef; onChange: (v: MediaRef) => void; accept?: "image" | "pdf" | "any" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    if (open && !items) listMediaAction().then(setItems);
  }, [open, items]);

  const visible = (items ?? []).filter((m) =>
    accept === "any" ? true : accept === "pdf" ? m.mime === "application/pdf" : m.mime.startsWith("image/"),
  );
  const choose = (m: Item) => {
    onChange({ key: m.key, alt: m.alt, width: m.width ?? 0, height: m.height ?? 0 });
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        {value.key ? (
          value.key.endsWith(".pdf") ? (
            <a href={mediaUrl(value)} target="_blank" className="a-btn" rel="noreferrer">📄 PDF</a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(value)} alt={value.alt} className="size-14 rounded-lg border border-white/10 object-cover" />
          )
        ) : (
          <span className="flex size-14 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-muted">none</span>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="a-btn" onClick={() => setOpen(true)}>
            {value.key ? "Change" : "Choose"}
          </button>
          {value.key && (
            <button type="button" className="a-btn a-btn-danger" onClick={() => onChange({ key: "", alt: "", width: 0, height: 0 })}>
              Remove
            </button>
          )}
        </div>
      </div>
      {value.key && (
        <label className="mt-2 block">
          <span className="a-label">Alt text here</span>
          <input className="a-input" value={value.alt} maxLength={500} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
        </label>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Media library">
          <div className="a-card flex max-h-[85vh] w-full max-w-3xl flex-col p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Media library</h2>
              <button type="button" className="a-btn" onClick={() => setOpen(false)}>Close</button>
            </div>
            <UploadForm accept={accept} onUploaded={(m) => { setItems((x) => [m, ...(x ?? [])]); choose(m); }} />
            <div className="mt-4 grid grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-5">
              {items === null && <p className="text-muted">Loading…</p>}
              {visible.map((m) => (
                <button key={m.id} type="button" onClick={() => choose(m)} className="group rounded-lg border border-white/10 p-1 text-left hover:border-cyan">
                  {m.mime === "application/pdf" ? (
                    <span className="flex aspect-square items-center justify-center text-3xl">📄</span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(m.key)} alt={m.alt} className="aspect-square w-full rounded object-cover" loading="lazy" />
                  )}
                  <span className="mt-1 block truncate text-[0.7rem] text-muted">{m.filename}</span>
                </button>
              ))}
              {items && !visible.length && <p className="col-span-full text-muted">No files yet — upload one above.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
