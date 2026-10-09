import { AgentSetup } from "@/components/AgentSetup";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Agent setup | Dispute Advisor (concept prototype)" };

export default function AgentStudioPage() {
  return (
    <>
      <PageTitle title="Agent setup">Write your terms once. The advisor reads them with every dispute, but they never count as proof.</PageTitle>
      <AgentSetup />
    </>
  );
}
