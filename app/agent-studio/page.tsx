import { AgentSetup } from "@/components/AgentSetup";

export const metadata = { title: "Agent setup | Dispute Advisor (concept prototype)" };

export default function AgentStudioPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl leading-8 font-semibold">Agent setup</h1>
      <p className="mb-4 max-w-[760px] text-[15px] text-ink-soft">Teach the advisor how your business works, once.</p>
      <AgentSetup />
    </>
  );
}
