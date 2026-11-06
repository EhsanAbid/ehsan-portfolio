"use client";

import { useEffect, useRef, useState } from "react";
import type { Site } from "@/schema/site";

type Labels = Site["copy"]["contact"];

export function ContactForm({ labels }: { labels: Labels }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "rate">("idle");
  // When the form became usable (set after hydration; the page itself is prerendered).
  const renderedAt = useRef(0);
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          message: f.get("message"),
          website: f.get("website"),
          t: renderedAt.current,
        }),
      });
      if (res.status === 429) return setState("rate");
      if (!res.ok) return setState("error");
      setState("sent");
      (e.target as HTMLFormElement).reset();
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="s-field-label">{labels.name}</span>
          <input name="name" required maxLength={100} autoComplete="name" className="s-field" />
        </label>
        <label>
          <span className="s-field-label">{labels.email}</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" className="s-field" />
        </label>
      </div>
      <label>
        <span className="s-field-label">{labels.message}</span>
        <textarea name="message" required minLength={5} maxLength={5000} rows={5} className="s-field resize-y" />
      </label>
      {/* Honeypot: hidden from people (and screen readers), irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button className="s-btn" disabled={state === "sending"}>
          {state === "sending" ? labels.sending : labels.send}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {state === "sent" ? labels.success : state === "error" ? labels.error : state === "rate" ? labels.rateLimited : ""}
        </p>
      </div>
    </form>
  );
}
