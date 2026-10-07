import type { ReactNode } from "react";

/** The one container every page uses: white, hairline border, rounded. Type scale across the app: 24 title, 16 heading, 14 body, 12 caption. */
export function Card({ children, className = "", id, label }: { children: ReactNode; className?: string; id?: string; label?: string }) {
  return (
    <section id={id} aria-label={label} className={`overflow-hidden rounded-2xl border border-line bg-white p-4 md:p-5 ${className}`}>
      {children}
    </section>
  );
}

export function Section({ id, title, note, children }: { id?: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-6 scroll-mt-4">
      <h2 className="text-[16px] font-semibold">{title}</h2>
      {note && <p className="mb-2 text-[12px] text-helper">{note}</p>}
      <div className={note ? "" : "mt-2"}>{children}</div>
    </section>
  );
}

export function PageTitle({ title, children, eyebrow }: { title: string; children?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-5">
      {eyebrow && <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">{eyebrow}</p>}
      <h1 className="text-2xl leading-8 font-semibold">{title}</h1>
      {children && <p className="mt-1 max-w-[720px] text-[14px] text-ink-soft">{children}</p>}
    </header>
  );
}

/** A label and a caption on the left, a control on the right. Rows are divided by hairlines. */
export function SettingRow({ title, caption, children, htmlFor }: { title: string; caption?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0">
      <label htmlFor={htmlFor} className="min-w-0 cursor-pointer">
        <span className="block text-[14px] font-semibold">{title}</span>
        {caption && <span className="block text-[12px] text-helper">{caption}</span>}
      </label>
      {children}
    </div>
  );
}

export function Stat({ label, value, note, muted }: { label: string; value: string; note?: string; muted?: boolean }) {
  return (
    <div className="px-3 py-3 md:px-5 md:py-4">
      <div className="text-[12px] text-helper">{label}</div>
      <div className={`font-semibold ${value.length > 6 ? "text-[16px] leading-6 sm:text-[24px] sm:leading-8" : "text-[24px] leading-8"} ${muted ? "text-helper" : ""}`}>{value}</div>
      {note && <div className="text-[12px] text-helper">{note}</div>}
    </div>
  );
}
