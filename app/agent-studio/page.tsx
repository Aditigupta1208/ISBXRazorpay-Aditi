import { AgentSetup, type RescueSample } from "@/components/AgentSetup";
import { PageTitle } from "@/components/ui";
import { getCase, getCheckView } from "@/lib/data";
import { formatInrFull, formatOriginal } from "@/lib/format";
import { getRates } from "@/lib/fx";
import { moneyCheck } from "@/lib/money";

export const metadata = { title: "Agent setup | Dispute Advisor (concept prototype)" };

/** The dispute the Deadline rescue preview is written about: a Fight call with a draft ready and under a day left. */
async function rescueSample(): Promise<RescueSample | null> {
  const c = getCase("C06");
  const v = getCheckView("C06");
  if (!c || !v) return null;
  const rates = await getRates();
  const m = moneyCheck({ amountSubunits: c.dispute.amount, currency: c.dispute.currency, odds: v.odds }, rates);
  return {
    caseId: c.id,
    amount: formatOriginal(c.dispute.amount, c.dispute.currency),
    inr: formatInrFull(m.atStakeInr),
    code: c.dispute.reason_code,
    reason: c.dispute.reason_description.toLowerCase(),
    hoursLeft: c.dispute.respond_by_hours_left,
    call: v.call === "fight" ? "Fight" : v.call === "fold" ? "Fold" : "Escalate",
    confidence: v.confidence.toLowerCase(),
    draftReady: v.draft.trim().length > 0,
  };
}

export default async function AgentStudioPage() {
  const sample = await rescueSample();
  return (
    <>
      <PageTitle title="Agent setup">Write your terms once. The advisor reads them with every dispute, but they never count as proof.</PageTitle>
      <AgentSetup rescue={sample} />
    </>
  );
}
