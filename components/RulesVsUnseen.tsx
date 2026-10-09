import type { ReactNode } from "react";
import type { Scoreboard } from "@/lib/ruleScoreboard";

/** "Why not just write smarter rules?" Computed from code and the answer key, so it cannot go stale. */
export function RulesVsUnseen({ s, agentKnown, agentLive }: { s: Scoreboard; agentKnown: { agree: number; n: number }; agentLive?: { name: string; known: { agree: number; n: number }; unseen: { agree: number; n: number } } | null }) {
  const Row = ({ name, sub, known, unseen, strong }: { name: string; sub: string; known: string; unseen: ReactNode; strong?: boolean }) => (
    <tr className="border-t border-line">
      <th scope="row" className="py-2.5 pr-3 text-left font-semibold">
        {name}
        <span className="block text-[13px] font-normal text-helper">{sub}</span>
      </th>
      <td className="px-2 py-2.5 whitespace-nowrap md:px-4">{known}</td>
      <td className={`px-2 py-2.5 whitespace-nowrap md:px-4 ${strong ? "font-semibold" : ""}`}>{unseen}</td>
    </tr>
  );
  const u = s.unseen;
  return (
    <details className="group mb-6 rounded-2xl border border-line bg-white p-4 md:p-5" id="rules-details">
      <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <h2 id="rules" className="text-[16px] font-semibold">Why not just write smarter rules?</h2>
          <span className="mt-1 block max-w-[760px] text-[14px] text-ink-soft">
            Rules written for known cases get {s.known.tuned} of {s.known.n}, then {u.tuned} of {u.n} on cases they had never seen, fewer than the simple checklist ({u.simple} of {u.n}).
          </span>
        </div>
        <span className="mt-1 shrink-0 text-[14px] font-semibold text-brand group-open:hidden">Show details</span>
        <span className="mt-1 hidden shrink-0 text-[14px] font-semibold text-brand group-open:inline">Hide</span>
      </summary>
      <div className="mt-3" />
      <p className="mt-1 mb-3 max-w-[760px] text-[14px] text-ink-soft">
        We wrote the best fixed rules we could by reading the {s.known.n} known cases. {s.rulesAdded} extra rules get {s.known.tuned} of {s.known.n} right. On {u.n} cases they had never seen they get {u.tuned} of {u.n},
        {u.tuned < u.simple ? " fewer than" : u.tuned === u.simple ? " the same as" : " more than"} the simple checklist ({u.simple} of {u.n}).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead className="text-[13px] text-helper">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">System</th>
              <th scope="col" className="px-2 py-2 font-medium md:px-4">{s.known.n} known<span className="hidden md:inline"> cases</span></th>
              <th scope="col" className="px-2 py-2 font-medium md:px-4">{u.n} unseen<span className="hidden md:inline"> cases</span></th>
            </tr>
          </thead>
          <tbody>
            <Row name="Simple checklist" sub="one rule per reason code" known={`${s.known.simple} of ${s.known.n}`} unseen={`${u.simple} of ${u.n}`} />
            <Row name="Tuned rules" sub={`${s.rulesAdded} hand-written rules added, each for a known case`} known={`${s.known.tuned} of ${s.known.n}`} unseen={`${u.tuned} of ${u.n}`} strong />
            <Row name="Agent, prompt v1 (saved)" sub="older ChatGPT run, before the unseen cases existed" known={`${agentKnown.agree} of ${agentKnown.n}`} unseen={<>Not run<span className="hidden md:inline"> on these</span></>} />
            {agentLive && <Row name={`Agent, prompt ${agentLive.name} (live)`} sub="free models, one run" known={`${agentLive.known.agree} of ${agentLive.known.n}`} unseen={`${agentLive.unseen.agree} of ${agentLive.unseen.n}`} strong />}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 max-w-[760px] list-disc space-y-1.5 pl-5 text-[14px] text-ink-soft">
        <li>Be careful with this result: {u.n} cases is small (one case moves a score by 10 points), and the cases were drafted by the builder&apos;s AI assistant. {u.unconfirmed} of the {u.n} answers are still proposed, not confirmed by the builder.</li>
        <li>It shows that fixed rules do not simply get better with more rules.{agentLive ? ` The live agent is shown for comparison, but it is one run on free models, and some of these cases were read while its prompt was revised, so treat it as a rough guide.` : " It does not show that the agent does better: the agent has not been run on these cases yet."}</li>
      </ul>
      <details className="mt-1 max-w-[760px]" data-testid="rules-more">
        <summary className="inline-flex min-h-10 cursor-pointer items-center text-[14px] font-semibold text-brand">How the rules were tested</summary>
        <ul className="list-disc space-y-1.5 pl-5 text-[14px] text-ink-soft">
        <li>
          Tuned rules missed {u.tunedMisses.map((m) => (m.rule ? `${m.id} (rule ${m.rule} fired wrongly)` : m.id)).join(", ")}. The simple checklist missed {u.simpleMisses.join(", ")}.
          A rule written for one case can break another, and a missing rule leaves a gap, so each new trap needs a new rule.
        </li>
        <li>The rules were frozen and committed before the {u.n} unseen cases were written, and were not changed after scoring.</li>
        </ul>
      </details>
    </details>
  );
}
