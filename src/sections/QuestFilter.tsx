"use client";

import { useState } from "react";

/**
 * Filter tabs for the quest log. The cards are server-rendered; we only toggle their
 * `hidden` attribute, so the quest content is in the HTML for search engines and no-JS.
 */
export function QuestFilter({ categories, allLabel, label, children }: { categories: string[]; allLabel: string; label: string; children: React.ReactNode }) {
  const [cat, setCat] = useState<string | null>(null);
  return (
    <div>
      {categories.length > 1 && (
        <div role="tablist" aria-label={label} className="mb-6 flex flex-wrap gap-2" data-reveal>
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "__all"}
              type="button"
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={`chip !px-3 !py-1.5 !text-xs transition ${cat === c ? "!border-cyan !text-cyan" : "hover:!text-text"}`}
            >
              {c ?? allLabel}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* A tiny generated rule hides the cards of other categories. */}
        {cat !== null && (
          <style>{`[data-quest-grid] > [data-category]:not([data-category="${CSS.escape(cat)}"]){display:none}`}</style>
        )}
        <div className="contents" data-quest-grid>
          {children}
        </div>
      </div>
    </div>
  );
}
