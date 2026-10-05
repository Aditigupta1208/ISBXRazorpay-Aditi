import { AgentSetup } from "@/components/AgentSetup";

export const metadata = { title: "Agent setup | Dispute Advisor (concept prototype)" };

export default function AgentStudioPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl leading-8 font-semibold">Agent setup</h1>
      <p className="mb-4 max-w-[760px] text-[15px] text-ink-soft">Set up Dispute Advisor once. This is our own design of the setup screen, based on how Razorpay describes Agent Studio. It is not a screenshot of the real one.</p>
      <AgentSetup />
    </>
  );
}
