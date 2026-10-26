"use client";

import { useState } from "react";
import type { Site } from "@/schema/site";
import { AreaEditor } from "./AreaEditor";
import { LivePreview } from "./LivePreview";

/** An area editor with the draft preview next to it, reloaded after every save. */
export function AreaWithPreview<K extends keyof Site>({ area, initial }: { area: K; initial: Site[K] }) {
  const [version, setVersion] = useState(0);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
      <AreaEditor area={area} initial={initial} onSaved={() => setVersion((v) => v + 1)} />
      <div className="xl:sticky xl:top-16 xl:self-start">
        <LivePreview version={version} />
      </div>
    </div>
  );
}
