"use client";

import { useEffect, useState } from "react";
import type { Achievement } from "@/schema/site";
import { emit, on } from "@/lib/events";
import { chime } from "@/lib/sound";
import { bump, markUnlocked } from "./storage";

type Toast = { key: number; a: Achievement };

const sendStat = (key: string) =>
  fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }), keepalive: true }).catch(() => {});

/** "00-05" → is the visitor's local hour inside [0, 5)? Ranges may wrap midnight ("22-03"). */
function inWindow(param: string, hour: number) {
  const m = /^(\d{1,2})\s*-\s*(\d{1,2})$/.exec(param.trim());
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a <= b ? hour >= a && hour < b : hour >= a || hour < b;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * The achievements engine. Definitions come from the database (admin → Game); this component
 * turns each trigger type into a listener. Progress is saved in localStorage only.
 */
export function AchievementEngine({ achievements, toastTitle }: { achievements: Achievement[]; toastTitle: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const list = achievements.filter((a) => a.enabled);
    const unlock = (a: Achievement) => {
      if (!markUnlocked(a.id)) return;
      chime();
      sendStat(`unlock:${a.id}`);
      emit("unlocked", { id: a.id });
      const key = Date.now() + Math.random();
      setToasts((t) => [...t, { key, a }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 4500);
    };
    /** Count progress for "N times" triggers; `uniq` counts distinct things (5 different stars). */
    const progress = (a: Achievement, uniq?: string) => {
      if (a.count <= 1) return unlock(a);
      if (bump(a.id, uniq) >= a.count) unlock(a);
    };
    const offs: (() => void)[] = [];

    // visit + time-window: checked once on load
    const hour = new Date().getHours();
    for (const a of list) {
      if (a.trigger === "visit") unlock(a);
      if (a.trigger === "time-window" && inWindow(a.param, hour)) unlock(a);
    }

    // visits counter: once per browser session
    try {
      if (!sessionStorage.getItem("ehsan.visit")) {
        sessionStorage.setItem("ehsan.visit", "1");
        sendStat("visits");
      }
    } catch {}

    // scroll-to-section: unlock when that element scrolls into view
    const scrollAs = list.filter((a) => a.trigger === "scroll-to-section");
    if (scrollAs.length) {
      const io = new IntersectionObserver((entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          scrollAs.filter((a) => a.param === e.target.id).forEach(unlock);
        }),
      );
      scrollAs.forEach((a) => {
        const el = document.getElementById(a.param);
        if (el) io.observe(el);
      });
      offs.push(() => io.disconnect());
    }

    // key-sequence: keep the last N keys and compare
    const seqs = list.filter((a) => a.trigger === "key-sequence").map((a) => ({ a, keys: a.param.split(/\s+/).map((k) => k.toLowerCase()) }));
    if (seqs.length) {
      const maxLen = Math.max(...seqs.map((s) => s.keys.length));
      let buf: string[] = [];
      const onKey = (e: KeyboardEvent) => {
        buf = [...buf, e.key.toLowerCase()].slice(-maxLen);
        for (const s of seqs) if (buf.slice(-s.keys.length).join(" ") === s.keys.join(" ")) unlock(s.a);
      };
      addEventListener("keydown", onKey);
      offs.push(() => removeEventListener("keydown", onKey));
    }

    // everything else arrives as "trigger" events from the rest of the site
    offs.push(
      on("trigger", ({ type, param, key }) => {
        for (const a of list) {
          if (type === "form-sent" && a.trigger === "form-sent") progress(a);
          else if (type === "custom-event" && param === "email-click" && a.trigger === "form-sent") progress(a);
          else if (type === "terminal-command" && a.trigger === "terminal-command" && param && norm(param) === norm(a.param)) progress(a);
          else if (type === a.trigger && a.param === param) progress(a, key);
        }
      }),
    );
    return () => offs.forEach((o) => o());
  }, [achievements]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map(({ key, a }) => (
        <div key={key} className="achievement-toast glass flex items-center gap-3 !rounded-2xl px-4 py-3" role="status">
          <span className="text-2xl" aria-hidden>
            {a.icon}
          </span>
          <div>
            <p className="mono text-[0.68rem] tracking-widest text-gold uppercase">{toastTitle}</p>
            <p className="font-semibold text-white">{a.name}</p>
            {a.description && <p className="text-xs text-muted">{a.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
