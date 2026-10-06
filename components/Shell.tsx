import Link from "next/link";
import { ReviewerNav, SubTabs } from "./SubTabs";
import { Tour } from "./Tour";
import { TourLink } from "./TourLink";
import type { ReactNode } from "react";

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
        Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product.{" "}
        <TourLink className="-my-3 inline-block py-3 font-semibold underline" />
      </div>
      <header className="flex h-[60px] items-center justify-between bg-nav px-3 text-white md:px-7 print:hidden">
        <Link href="/disputes" className="flex min-h-10 items-center gap-3">
          <span className="text-[17px] font-semibold">Dispute Advisor</span>
          <span className="hidden text-xs text-[#9a9a9a] md:inline">Payments · Disputes</span>
        </Link>
        <ReviewerNav />
      </header>
      <SubTabs />
      <Tour />
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 pt-4 pb-10 outline-none md:px-6 md:pt-7 md:pb-[60px]">{children}</main>
    </>
  );
}
