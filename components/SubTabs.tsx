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

/** The merchant's own screens, inside the black bar like the dashboard's own top navigation. */
export function SubTabs() {
  const path = usePathname() ?? "";
  return (
    <nav aria-label="Sections" className="order-last -mb-px flex w-full gap-1 overflow-x-auto px-1 lg:order-none lg:w-auto lg:self-stretch">
      {TABS.map((t) => {
        const on = path === t.href || path.startsWith(t.href + "/");
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center px-3 text-[14px] font-semibold lg:min-h-[56px] ${on ? "text-white shadow-[inset_0_-3px_0_#4BA66F]" : "text-[#B9BEC7] hover:text-white"} min-h-11`}
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
      <span className="mr-1 hidden text-[#8B919C] lg:inline">For reviewers</span>
      {REVIEWER.map((t) => {
        const on = path === t.href;
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-lg px-3 font-semibold ${on ? "bg-white/15 text-white" : "text-[#C9CED6] hover:bg-white/10 hover:text-white"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Where this sits in the Razorpay dashboard, so a reader is never unsure. */
export function Breadcrumb() {
  const path = usePathname() ?? "";
  const trail: [string, string?][] | null =
    path === "/disputes" ? [["Razorpay Dashboard", "/"], ["Dispute Advisor", "/disputes"], ["Disputes"]]
    : path.startsWith("/disputes/") ? [["Razorpay Dashboard", "/"], ["Dispute Advisor", "/disputes"], ["Disputes", "/disputes"], [path.split("/")[2].toUpperCase()]]
    : path === "/results" ? [["Razorpay Dashboard", "/"], ["Dispute Advisor", "/disputes"], ["Results"]]
    : path === "/agent-studio" ? [["Razorpay Dashboard", "/"], ["Dispute Advisor", "/disputes"], ["Agent setup"]]
    : null;
  if (!trail) return null;
  return (
    <nav aria-label="Breadcrumb" className={`mb-3 flex flex-wrap items-center gap-x-1.5 text-[13px] text-helper print:hidden ${path.startsWith("/disputes/") ? "mx-auto max-w-[820px]" : ""}`}>
      {trail.map(([label, href], i) => (
        <span key={label} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>›</span>}
          {href ? <Link href={href} className="-my-3 inline-block py-3 font-semibold text-brand hover:underline">{label}</Link> : <span className={i === trail.length - 1 ? "font-semibold text-ink" : ""}>{label}</span>}
        </span>
      ))}
    </nav>
  );
}
