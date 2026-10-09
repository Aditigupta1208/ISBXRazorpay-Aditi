import { AgentSetup } from "@/components/AgentSetup";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Agent setup | Dispute Advisor (concept prototype)" };

export default function AgentStudioPage() {
  return (
    <>
      <PageTitle title="Agent setup">Brief your Dispute Advisor once. It reads your terms with every dispute, as your claim and never as proof.</PageTitle>
      <AgentSetup />
    </>
  );
}
