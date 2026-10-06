import { ResultsView } from "@/components/ResultsView";
import { getRates } from "@/lib/fx";
import { rateNote } from "@/lib/rates";
import { getReasonTip } from "@/lib/data";

export const metadata = { title: "Results | Dispute Advisor (concept prototype)" };

const REASONS: Record<string, string> = {
  "13.1": "Services not provided or merchandise not received",
  "13.2": "Cancelled recurring transaction",
  "13.3": "Not as described or defective",
  "13.6": "Credit not processed",
  "13.7": "Cancelled merchandise or services",
};

export default async function ResultsPage() {
  const rates = await getRates();
  const tips = Object.fromEntries(Object.keys(REASONS).map((c) => [c, getReasonTip(c)]));
  return (
    <>
      <h1 className="mb-1 text-2xl leading-8 font-semibold">Results</h1>
      <p className="mb-4 max-w-[760px] text-[15px] text-ink-soft">
        What happened to the disputes you acted on, and whether the advisor was right. The numbers start from 24 made-up past disputes so the page is not empty, and add whatever you record in this demo.
      </p>
      <ResultsView rates={rates} tips={tips} reasonNames={REASONS} />
      <p className="mt-6 text-[13px] text-helper">{rateNote(rates)} Sample history is not real data and not Razorpay data. What you record stays in this browser.</p>
    </>
  );
}
