import Link from "next/link";
import { Breadcrumb, ReviewerNav, SubTabs } from "./SubTabs";
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
      <div className="bg-[#FFF4CC] px-3 print:hidden py-1.5 text-center text-[12px] text-[#5C4400]">
        Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product.{" "}
        <TourLink className="-my-3 inline-block py-3 font-semibold underline" />
      </div>
      <header className="flex flex-wrap items-center gap-x-4 bg-nav px-3 text-white md:px-7 lg:flex-nowrap lg:gap-x-6 print:hidden">
        <Link href="/" className="flex min-h-14 items-center gap-2.5 whitespace-nowrap">
          <span className="text-[17px] font-semibold">Dispute Advisor</span>
          <span className="hidden rounded-full bg-white/15 px-2 py-0.5 sm:inline text-[12px] font-semibold text-[#D5DAE3]">Concept</span>
        </Link>
        <SubTabs />
        <div className="ml-auto lg:border-l lg:border-white/15 lg:pl-5">
          <ReviewerNav />
        </div>
      </header>
      <Tour />
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 pt-4 pb-10 outline-none md:px-6 md:pt-7 md:pb-[60px]"><Breadcrumb />{children}</main>
    </>
  );
}
