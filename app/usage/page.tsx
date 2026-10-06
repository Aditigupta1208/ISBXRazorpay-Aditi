import { UsageReport } from "@/components/UsageReport";

export const metadata = { title: "Usage | Dispute Advisor (concept prototype)", robots: { index: false, follow: false } };

export default function UsagePage() {
  return (
    <>
      <h1 className="mb-1 text-2xl leading-8 font-semibold">Usage</h1>
      <p className="mb-4 max-w-[760px] text-[14px] text-ink-soft">Builder only. Anonymous counts of what reviewers did in this demo. Needs the admin token.</p>
      <UsageReport />
    </>
  );
}
