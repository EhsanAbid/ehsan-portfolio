"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MagicProps } from "./Magic";

// The magic layer (achievements, terminal launcher, cursor, shooting stars…) is not needed for
// the first paint, so its code is downloaded and started only when the browser is idle.
const Magic = dynamic(() => import("./Magic").then((m) => m.Magic), { ssr: false });

export function MagicLazy(props: MagicProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const go = () => setReady(true);
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 2000 });
    else setTimeout(go, 800);
  }, []);
  return ready ? <Magic {...props} /> : null;
}
