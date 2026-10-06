"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";

export interface HowTab {
  id: string;
  label: string;
  note: string;
  content: ReactNode;
}

/** Tabs for a long page. Every panel stays in the page, so links to a section inside another tab (#rules, #learning) open that tab first. */
export function HowTabs({ tabs }: { tabs: HowTab[] }) {
  const [active, setActive] = useState(tabs[0].id);

  const openHash = useCallback(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    const panel = el?.closest<HTMLElement>("[role=tabpanel]");
    if (!el || !panel) return;
    setActive(panel.dataset.tab ?? tabs[0].id);
    setTimeout(() => el.scrollIntoView({ block: "start" }), 30);
  }, [tabs]);

  useEffect(() => {
    openHash();
    window.addEventListener("hashchange", openHash);
    return () => window.removeEventListener("hashchange", openHash);
  }, [openHash]);

  return (
    <div>
      <div role="tablist" aria-label="How it works" className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            type="button"
            onClick={() => setActive(t.id)}
            className={`-mb-px min-h-11 shrink-0 border-b-2 px-3 text-left text-[14px] font-semibold md:px-4 ${active === t.id ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} data-tab={t.id} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>
          <p className="mb-5 max-w-[720px] text-[14px] text-ink-soft">{t.note}</p>
          {t.content}
        </div>
      ))}
    </div>
  );
}
