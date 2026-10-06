import type { Scoreboard } from "@/lib/ruleScoreboard";

/** "Why not just write smarter rules?" Computed from code and the answer key, so it cannot go stale. */
export function RulesVsUnseen({ s, agentKnown }: { s: Scoreboard; agentKnown: { agree: number; n: number } }) {
  const Row = ({ name, sub, known, unseen, strong }: { name: string; sub: string; known: string; unseen: string; strong?: boolean }) => (
    <tr className="border-t border-line">
      <th scope="row" className="py-2.5 pr-3 text-left font-semibold">
        {name}
        <span className="block text-[12px] font-normal text-helper">{sub}</span>
      </th>
      <td className="px-2 py-2.5 md:px-4">{known}</td>
      <td className={`px-2 py-2.5 md:px-4 ${strong ? "font-semibold" : ""}`}>{unseen}</td>
    </tr>
  );
  const u = s.unseen;
  return (
    <section className="mb-6 rounded-2xl border border-line bg-white p-4 md:p-5" aria-labelledby="rules">
      <h2 id="rules" className="text-[16px] font-semibold">Why not just write smarter rules?</h2>
      <p className="mt-1 mb-3 max-w-[760px] text-[14px] text-ink-soft">
        We wrote the best fixed rules we could by reading the {s.known.n} known cases. {s.rulesAdded} extra rules get {s.known.tuned} of {s.known.n} right. On {u.n} cases they had never seen they get {u.tuned} of {u.n},
        {u.tuned < u.simple ? " fewer than" : u.tuned === u.simple ? " the same as" : " more than"} the simple checklist ({u.simple} of {u.n}).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[14px]">
          <thead className="text-[12px] text-helper">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">System</th>
              <th scope="col" className="px-2 py-2 font-medium md:px-4">{s.known.n} known cases</th>
              <th scope="col" className="px-2 py-2 font-medium md:px-4">{u.n} unseen cases</th>
            </tr>
          </thead>
          <tbody>
            <Row name="Simple checklist" sub="one rule per reason code" known={`${s.known.simple} of ${s.known.n}`} unseen={`${u.simple} of ${u.n}`} />
            <Row name="Tuned rules" sub={`${s.rulesAdded} hand-written rules added, each for a known case`} known={`${s.known.tuned} of ${s.known.n}`} unseen={`${u.tuned} of ${u.n}`} strong />
            <Row name="Agent, prompt v1 (saved)" sub="older ChatGPT run; the Claude agent is not run yet" known={`${agentKnown.agree} of ${agentKnown.n}`} unseen="Not run (needs the API key)" />
          </tbody>
        </table>
      </div>
      <ul className="mt-3 max-w-[760px] list-disc space-y-1.5 pl-5 text-[14px] text-ink-soft">
        <li>
          Tuned rules missed {u.tunedMisses.map((m) => (m.rule ? `${m.id} (rule ${m.rule} fired wrongly)` : m.id)).join(", ")}. The simple checklist missed {u.simpleMisses.join(", ")}.
          A rule written for one case can break another, and a missing rule leaves a gap, so each new trap needs a new rule.
        </li>
        <li>The rules were frozen and committed before the {u.n} unseen cases were written, and were not changed after scoring.</li>
        <li>Be careful with this result: {u.n} cases is small (one case moves a score by 10 points), and the cases were drafted by the builder&apos;s AI assistant. {u.unconfirmed} of the {u.n} answers are still proposed, not confirmed by the builder.</li>
        <li>It shows that fixed rules do not simply get better with more rules. It does not show that the agent does better: the agent has not been run on these cases yet.</li>
      </ul>
    </section>
  );
}
