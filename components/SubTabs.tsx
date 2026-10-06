"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Disputes", href: "/disputes" },
  { label: "Results", href: "/results" },
  { label: "Agent setup", href: "/agent-studio" },
];

const REVIEWER = [
  { label: "Evals", href: "/evals" },
  { label: "How it works", href: "/how-it-works" },
];

/** The merchant's own screens. Only places a merchant would actually go. */
export function SubTabs() {
  const path = usePathname() ?? "";
  return (
    <nav aria-label="Sections" className="flex gap-6 overflow-x-auto border-b border-line bg-white px-4 md:gap-8 md:px-7">
      {TABS.map((t) => {
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

/** For judges and curious readers: the proof and the method. Kept apart from the merchant tabs on purpose. */
export function ReviewerNav() {
  const path = usePathname() ?? "";
  return (
    <nav aria-label="For reviewers" className="flex items-center gap-1 text-[13px]">
      <span className="mr-1 hidden text-[#9a9a9a] md:inline">For reviewers</span>
      {REVIEWER.map((t) => {
        const on = path === t.href;
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-lg px-3 font-medium ${on ? "bg-white/15 text-white" : "text-[#d8d8d8] hover:bg-white/10 hover:text-white"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
