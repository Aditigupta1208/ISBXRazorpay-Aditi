"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Transactions", href: null },
  { label: "Settlements", href: null },
  { label: "Disputes", href: "/disputes" },
  { label: "Refunds", href: null },
  { label: "Results", href: "/results" },
  { label: "Agent setup", href: "/agent-studio" },
  { label: "Evals", href: "/evals" },
  { label: "How it works", href: "/how-it-works" },
];

export function SubTabs() {
  const path = usePathname() ?? "";
  return (
    <nav aria-label="Sections" className="scroll-fade flex gap-[18px] overflow-x-auto border-b border-line bg-white px-3 md:gap-7 md:px-7">
      {TABS.map((t) => {
        if (!t.href) {
          return (
            <span key={t.label} className="shrink-0 px-0.5 py-[13px] font-medium text-[#555]">
              {t.label}
            </span>
          );
        }
        const on = path === t.href || path.startsWith(t.href + "/");
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 border-b-2 px-0.5 py-[13px] font-medium ${on ? "border-brand text-brand" : "border-transparent text-[#555] hover:text-brand"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
