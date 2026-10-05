import Link from "next/link";
import type { ReactNode } from "react";

const TOP = ["Ray AI", "Payments", "Banking+", "Payroll", "More"];
const SUB = ["Transactions", "Settlements", "Disputes", "Refunds"];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-[#FFF4CC] px-3 py-1.5 text-center text-xs text-[#5C4400]">
        Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product.
      </div>
      <header className="flex h-[60px] items-center justify-between bg-nav px-3 text-white md:px-7">
        <nav aria-label="Main" className="flex gap-5 overflow-x-auto md:gap-[34px]">
          {TOP.map((t) => (
            <span
              key={t}
              className={`relative shrink-0 py-[19px] text-sm font-medium md:text-[15px] ${
                t === "Payments" ? "text-white" : "text-[#E8E8E8]"
              }`}
            >
              {t}
              {t === "Payments" && (
                <span
                  aria-hidden
                  className="absolute -right-4 -bottom-0 -left-4 h-[3px] bg-gradient-to-r from-transparent via-green to-transparent"
                />
              )}
            </span>
          ))}
        </nav>
        <div className="hidden w-[260px] rounded-[10px] border border-[#2a2a2a] bg-[#161616] px-4 py-2 text-sm text-[#8a8a8a] md:block">
          Search in payments
        </div>
      </header>
      <div className="flex gap-[18px] overflow-x-auto border-b border-line bg-white px-3 md:gap-7 md:px-7" role="tablist">
        {SUB.map((t) =>
          t === "Disputes" ? (
            <Link key={t} href="/disputes" className="shrink-0 border-b-2 border-brand px-0.5 py-[13px] font-medium text-brand">
              {t}
            </Link>
          ) : (
            <span key={t} className="shrink-0 px-0.5 py-[13px] font-medium text-[#555]">
              {t}
            </span>
          ),
        )}
      </div>
      <main className="mx-auto max-w-[1180px] px-4 pt-4 pb-10 md:px-6 md:pt-7 md:pb-[60px]">{children}</main>
    </>
  );
}
