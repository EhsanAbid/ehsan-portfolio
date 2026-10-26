"use client";

import { useState } from "react";

/**
 * The real website rendered from the draft, inside an iframe, scaled down to fit the panel.
 * `version` changes after every save, which reloads the frame.
 */
export function LivePreview({ version, hash = "" }: { version: number; hash?: string }) {
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const w = device === "desktop" ? 1280 : 390;
  const h = device === "desktop" ? 800 : 780;
  const scale = device === "desktop" ? 0.42 : 0.6;
  return (
    <div className="a-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-white">Live preview (draft)</p>
        <div className="flex gap-1">
          {(["desktop", "phone"] as const).map((d) => (
            <button key={d} type="button" className={`a-btn !min-h-7 text-xs ${device === d ? "!border-cyan !text-cyan" : ""}`} onClick={() => setDevice(d)}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto overflow-hidden rounded-lg border border-white/10" style={{ width: w * scale, height: h * scale }}>
        <iframe
          key={`${version}-${device}`}
          title="Draft preview"
          src={`/preview?embed=1${hash}`}
          style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "0 0", border: 0 }}
        />
      </div>
    </div>
  );
}
