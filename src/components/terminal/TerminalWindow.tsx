"use client";

import { useEffect, useRef, useState } from "react";
import type { TerminalCommand } from "@/schema/site";
import { emit } from "@/lib/events";
import { blip } from "@/lib/sound";
import { unlockedIds } from "@/components/achievements/storage";
import { scrollToTarget } from "@/components/space/motion";
import type { TerminalData } from "./types";

type Line = { kind: "in" | "out" | "err"; text: string };
type Result = { out: string[]; err?: boolean; clear?: boolean; close?: boolean; after?: () => void };

/** Fill {name}, {role}, {arg}, {options} placeholders in admin-written replies. */
const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);

/**
 * Executes one command line. Built-in commands have behaviour + an admin-editable reply;
 * custom commands just print their reply. Admins can rename or disable any of them.
 */
function execute(input: string, d: TerminalData, cmds: TerminalCommand[]): Result {
  const [word, ...rest] = input.trim().split(/\s+/);
  const arg = rest.join(" ");
  const cmd = cmds.find((c) => c.name.toLowerCase() === word.toLowerCase());
  const m = d.cfg.messages;
  const vars = { name: d.name, role: d.role, arg };
  if (!cmd) return { out: [d.cfg.notFound], err: true };
  const reply = cmd.reply ? fill(cmd.reply, vars) : "";
  const withReply = (lines: string[]) => (reply ? [reply, ...lines] : lines);

  switch (cmd.builtin) {
    case "help":
      return { out: withReply(cmds.map((c) => `  ${c.name.padEnd(14)} ${c.description}`)) };
    case "whoami":
      return { out: [reply || `${d.name} — ${d.role}`] };
    case "about":
      return { out: withReply(d.about) };
    case "skills": {
      const by = (s: string) => d.skills.filter((k) => k.status === s).map((k) => k.name).join(", ") || "—";
      return { out: withReply([`  ${m.mastered}: ${by("mastered")}`, `  ${m.learning}: ${by("learning")}`, `  ${m.locked2}: ${by("locked")}`]) };
    }
    case "projects":
      return { out: withReply([...d.quests.map((q) => `  [${q.status}] ${q.id} — ${q.title}`), m.openHint]) };
    case "open": {
      if (!arg) return { out: [m.openUsage], err: true };
      const a = arg.toLowerCase();
      const q = d.quests.find((x) => x.id.toLowerCase() === a) ?? d.quests.find((x) => x.title.toLowerCase().includes(a));
      if (!q) return { out: [fill(m.questNotFound, vars)], err: true };
      return {
        out: [reply || q.title],
        close: true,
        after: () => {
          const el = document.getElementById(`quest-${q.id}`);
          if (!el) return;
          scrollToTarget(el);
          el.classList.add("quest-highlight");
          setTimeout(() => el.classList.remove("quest-highlight"), 2400);
        },
      };
    }
    case "cv":
      if (!d.cvUrl) return { out: [m.noCv], err: true };
      return {
        out: [reply],
        after: () => {
          const a = document.createElement("a");
          a.href = d.cvUrl!;
          a.download = "";
          a.click();
        },
      };
    case "contact":
      return {
        out: withReply(d.email ? [`  ${d.email}`] : []),
        close: !!d.contactAnchor,
        after: () => d.contactAnchor && scrollToTarget(`#${d.contactAnchor}`),
      };
    case "socials":
      return { out: withReply(d.socials.map((s) => `  ${s.label.padEnd(10)} ${s.url.replace(/^mailto:/, "")}`)) };
    case "theme": {
      const opts = d.themes.map((t) => t.id).join("|");
      const t = d.themes.find((x) => x.id === arg.toLowerCase() || x.name.toLowerCase() === arg.toLowerCase());
      if (!t) return { out: [fill(m.themeUsage, { ...vars, options: opts })], err: !!arg };
      emit("sky", { id: t.id });
      return { out: [fill(cmd.reply || "{arg}", { ...vars, arg: t.name })] };
    }
    case "sound":
      if (arg !== "on" && arg !== "off") return { out: [m.soundUsage], err: true };
      try {
        localStorage.setItem("ehsan.sound", arg === "on" ? "1" : "0");
      } catch {}
      emit("sound", { on: arg === "on" });
      return { out: [reply] };
    case "achievements": {
      const got = new Set(unlockedIds());
      return {
        out: withReply(
          d.achievements.map((a) =>
            got.has(a.id) ? `  ${m.unlocked} ${a.icon} ${a.name} — ${a.description}` : `  ${m.locked} ${d.hiddenName} — ${d.hiddenHint}`,
          ),
        ),
      };
    }
    case "matrix":
      return { out: [reply], close: true, after: () => emit("matrix", {}) };
    case "sudo": {
      const ok = /^hire\b/i.test(arg) && arg.toLowerCase().includes(d.name.toLowerCase().split(" ")[0]);
      if (!ok) return { out: [fill(m.sudoDenied, vars)], err: true };
      return {
        out: [reply],
        close: !!d.contactAnchor,
        after: () => {
          emit("confetti", {});
          if (d.contactAnchor) setTimeout(() => scrollToTarget(`#${d.contactAnchor}`), 600);
        },
      };
    }
    case "joke":
      return { out: [d.jokes.length ? d.jokes[Math.floor(Math.random() * d.jokes.length)] : m.noJokes] };
    case "clear":
      return { out: [], clear: true };
    case "exit":
      return { out: reply ? [reply] : [], close: true };
    default:
      // coffee and every custom command: just the admin-written reply
      return { out: [reply] };
  }
}

export default function TerminalWindow({ data, onClose }: { data: TerminalData; onClose: () => void }) {
  const cmds = data.cfg.commands.filter((c) => c.enabled);
  const [lines, setLines] = useState<Line[]>(() => data.cfg.welcome.split("\n").map((text) => ({ kind: "out" as const, text })));
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // Focus the prompt; give focus back to where it was when the terminal closes.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);

  function submit() {
    const text = value.trim();
    setValue("");
    setHIndex(-1);
    if (!text) return;
    setHistory((h) => [...h, text].slice(-50));
    emit("trigger", { type: "terminal-command", param: text });
    const r = execute(text, data, cmds);
    if (r.clear) setLines([]);
    else setLines((l) => [...l, { kind: "in", text }, ...r.out.filter(Boolean).map((t) => ({ kind: (r.err ? "err" : "out") as Line["kind"], text: t }))]);
    if (r.close) setTimeout(onClose, 700);
    if (r.after) setTimeout(r.after, r.close ? 750 : 0);
  }

  /** Tab completion: command names first, then arguments for open/theme/sound. */
  function complete() {
    const parts = value.split(" ");
    if (parts.length === 1) {
      const hits = cmds.map((c) => c.name).filter((n) => n.startsWith(parts[0].toLowerCase()));
      if (hits.length === 1) setValue(hits[0] + " ");
      else if (hits.length > 1) setLines((l) => [...l, { kind: "out", text: hits.join("  ") }]);
      return;
    }
    const cmd = cmds.find((c) => c.name === parts[0]);
    const pool =
      cmd?.builtin === "open" ? data.quests.map((q) => q.id) : cmd?.builtin === "theme" ? data.themes.map((t) => t.id) : cmd?.builtin === "sound" ? ["on", "off"] : [];
    const hits = pool.filter((p) => p.startsWith(parts.slice(1).join(" ").toLowerCase()));
    if (hits.length === 1) setValue(`${parts[0]} ${hits[0]}`);
    else if (hits.length > 1) setLines((l) => [...l, { kind: "out", text: hits.join("  ") }]);
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50 p-2 backdrop-blur-sm sm:items-center sm:p-6" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={data.cfg.title} className="terminal glass flex h-[70vh] w-full max-w-3xl flex-col overflow-hidden !rounded-xl !bg-[#05060f]/90">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <span className="size-3 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="size-3 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-3 rounded-full bg-[#28c840]" aria-hidden />
          <p className="mono flex-1 text-center text-xs text-muted">{data.cfg.title}</p>
          <button type="button" onClick={onClose} className="mono rounded px-2 text-muted hover:text-white" aria-label={data.closeLabel}>
            ✕
          </button>
        </div>
        <div ref={scroller} className="mono flex-1 overflow-y-auto p-4 text-[0.85rem] leading-relaxed" onClick={() => input.current?.focus()} aria-live="polite">
          {lines.map((l, i) => (
            <p key={i} className={`whitespace-pre-wrap ${l.kind === "in" ? "text-white" : l.kind === "err" ? "text-pink" : "text-cyan/90"}`}>
              {l.kind === "in" ? `${data.cfg.prompt} ${l.text}` : l.text}
            </p>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label htmlFor="term-input" className="shrink-0 text-gold">
              {data.cfg.prompt}
            </label>
            <input
              id="term-input"
              ref={input}
              value={value}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-white caret-cyan outline-none"
              onChange={(e) => {
                setValue(e.target.value);
                blip();
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  complete();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const i = hIndex < 0 ? history.length - 1 : Math.max(0, hIndex - 1);
                  if (history[i] !== undefined) {
                    setHIndex(i);
                    setValue(history[i]);
                  }
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const i = hIndex < 0 ? -1 : hIndex + 1;
                  if (i >= history.length || i < 0) {
                    setHIndex(-1);
                    setValue("");
                  } else {
                    setHIndex(i);
                    setValue(history[i]);
                  }
                } else if (e.key === "`" || e.key === "~" || e.code === "Backquote") {
                  e.preventDefault(); // the toggle key closes rather than types
                  onClose();
                }
              }}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
