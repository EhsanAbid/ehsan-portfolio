"use client";

import { useEffect, useState } from "react";

/** Live local time for the top bar, e.g. "17:59". Rendered on the client only (the page is static). */
export function Clock({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    let fmt: Intl.DateTimeFormat;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone });
    } catch {
      fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [timeZone]);
  return <span className="tabular-nums">{time ? `, ${time}` : ""}</span>;
}
