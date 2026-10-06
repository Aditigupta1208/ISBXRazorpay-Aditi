import { SubTabs } from "./SubTabs";
import type { ReactNode } from "react";

const TOP = ["Ray AI", "Payments", "Banking+", "Payroll", "More"];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-brand focus:shadow-lg"
      >
        Skip to content
      </a>
      <div className="bg-[#FFF4CC] px-3 print:hidden py-1.5 text-center text-xs text-[#5C4400]">
        Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product.
      </div>
      <header className="flex h-[60px] items-center justify-between bg-nav px-3 text-white md:px-7">
        <nav aria-label="Main" className="scroll-fade flex gap-5 overflow-x-auto md:gap-[34px]">
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
      <SubTabs />
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 pt-4 pb-10 outline-none md:px-6 md:pt-7 md:pb-[60px]">{children}</main>
    </>
  );
}
