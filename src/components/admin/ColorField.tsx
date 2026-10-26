"use client";

import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";

/** Hex text input + swatch that opens a colour wheel. */
export function ColorField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const box = useRef<HTMLDivElement>(null);

  // Keep the text box in sync when the value changes from outside (e.g. a preset).
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(value);
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className="relative flex items-center gap-2" ref={box}>
      <button
        type="button"
        aria-label="Pick colour"
        className="size-9 shrink-0 rounded-lg border border-white/20"
        style={{ background: value }}
        onClick={() => setOpen((o) => !o)}
      />
      <input
        id={id}
        className="a-input font-mono uppercase"
        value={text}
        maxLength={9}
        onChange={(e) => {
          const v = e.target.value.trim();
          setText(v);
          if (/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) onChange(v.toUpperCase());
        }}
      />
      {open && (
        <div className="absolute top-11 left-0 z-50 rounded-xl border border-white/10 bg-[#0d1122] p-3 shadow-2xl">
          <HexColorPicker color={value} onChange={(v) => onChange(v.toUpperCase())} />
        </div>
      )}
    </div>
  );
}
