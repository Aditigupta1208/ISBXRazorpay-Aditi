import { CallChip } from "@/components/CallChip";
import type { ReadingRow } from "@/lib/readingVsRules";

/** Same documents, different call: the checklist next to the agent's latest call and the human answer. Honest about misses. */
export function ReadingVsRules({ rows, runName }: { rows: ReadingRow[]; runName: string | null }) {
  return (
    <div className="grid gap-3 md:grid-cols-2" data-testid="reading-vs-rules">
      {rows.map((r) => {
        const agentRight = r.agent !== null && r.agent === r.human;
        return (
          <div key={r.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">{r.id}</p>
            <h3 className="text-[14px] font-semibold">{r.title}</h3>
            <p className="mt-1 text-[13px] text-ink-soft">{r.why}</p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
              <div><dt className="text-helper">Human answer</dt><dd className="mt-1"><CallChip call={r.human} short /></dd></div>
              <div><dt className="text-helper">Checklist</dt><dd className="mt-1"><CallChip call={r.checklist} short /></dd></div>
              <div>
                <dt className="text-helper">Agent{runName ? ` ${runName}` : ""}</dt>
                <dd className="mt-1">{r.agent ? <CallChip call={r.agent} short /> : <span className="text-helper">Not run</span>}</dd>
              </div>
            </dl>
            <p className={`mt-3 text-[13px] font-semibold ${agentRight ? "text-green-ink" : "text-danger"}`}>
              {r.agent === null ? "No agent run for this case yet." : agentRight ? "The agent matched the human answer; the checklist did not." : "The agent also missed this one. We show it, not hide it."}
            </p>
          </div>
        );
      })}
    </div>
  );
}
