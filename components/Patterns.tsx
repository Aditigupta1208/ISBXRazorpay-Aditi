import { formatInr } from "@/lib/format";
import type { Pattern } from "@/lib/patterns";

export function Patterns({ patterns, tips }: { patterns: Pattern[]; tips: Record<string, string> }) {
  const total = patterns.reduce((s, p) => s + p.count, 0);
  return (
    <section aria-labelledby="patterns" className="mt-6">
      <h2 id="patterns" className="text-[16px] font-semibold">What is causing your disputes</h2>
      <p className="mb-3 text-[12px] text-helper">
        The {total} demo disputes that are not fraud, grouped by reason. The fix on each line is a tip written for this demo, not model output. Rupee amounts use the rate under the table above.
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {patterns.map((p) => {
          const parts = [
            p.calls.fight ? `${p.calls.fight} fight` : null,
            p.calls.fold ? `${p.calls.fold} fold` : null,
            p.calls.escalate ? `${p.calls.escalate} escalate` : null,
          ].filter(Boolean);
          return (
            <li key={p.code} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-baseline justify-between gap-3">
                <b className="text-[14px]">{p.code} {p.reason}</b>
                <span className="shrink-0 text-[14px] font-semibold">{formatInr(p.inr)}</span>
              </div>
              <p className="text-[12px] text-helper">
                {p.count} {p.count === 1 ? "dispute" : "disputes"}{parts.length ? ` · advisor says ${parts.join(", ")}` : ""}
              </p>
              {tips[p.code] && (
                <p className="mt-2 text-[14px]"><span className="font-semibold text-green-ink">Fix: </span>{tips[p.code]}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
