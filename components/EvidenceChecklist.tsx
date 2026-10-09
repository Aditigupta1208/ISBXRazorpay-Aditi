import { SLOT_INFO, SOURCES, checklistFor, type Row } from "@/lib/evidenceChecklist";

function Line({ r, docName }: { r: Row; docName: (id: string) => string }) {
  return (
    <li className="flex items-start gap-2 py-1.5">
      <span aria-hidden className={`mt-0.5 w-4 shrink-0 text-center ${r.covered ? "text-fight" : "text-helper"}`}>{r.covered ? "✓" : "○"}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">
          {r.need}
          <span className="sr-only">{r.covered ? ", in place" : ", not yet"}</span>
        </span>
        {r.covered ? (
          <span className="block text-[12px] text-ink-soft">{r.evidenceIds.map((id) => `${id} ${docName(id)}`).join(", ")}</span>
        ) : (
          <span className="block text-[13px] text-helper">
            Not yet. Goes in: {r.slots.map((s) => SLOT_INFO[s]?.label ?? s).join(" or ")}.
          </span>
        )}
        <span className="block text-[13px] text-helper">{r.why}</span>
      </span>
    </li>
  );
}

export function EvidenceChecklist({ code, documentsBySlot, stale, docName }: { code: string; documentsBySlot: Map<string, string[]>; stale: boolean; docName: (id: string) => string }) {
  const c = checklistFor(code, documentsBySlot);
  if (!c) return null;
  return (
    <details className="group mt-3 rounded-xl border border-line">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[14px] font-semibold">
        <span>
          What {code} needs: <span className={c.keyCovered === c.keyTotal ? "text-fight" : "text-danger"}>{c.keyCovered} of {c.keyTotal} key documents in place</span>
        </span>
        <span aria-hidden className="text-brand transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="border-t border-line px-3 pb-3">
        {stale && <p className="mt-2 rounded-lg bg-fold-soft px-2.5 py-1.5 text-[12px] text-fold">New documents are placed here after you re-run the check.</p>}
        <h4 className="mt-2 text-[12px] font-semibold text-ink-soft">Usually decides it</h4>
        <ul>{c.key.map((r) => <Line key={r.need} r={r} docName={docName} />)}</ul>
        <h4 className="mt-2 text-[12px] font-semibold text-ink-soft">Helps</h4>
        <ul>{c.helpful.map((r) => <Line key={r.need} r={r} docName={docName} />)}</ul>
        <p className="mt-2 text-[13px] text-helper">
          A checklist, not a guarantee. From <a className="relative text-brand underline after:absolute after:-inset-x-1 after:-inset-y-3 after:content-['']" href={SOURCES.visa.url} target="_blank" rel="noreferrer">Visa&apos;s merchant dispute guide</a> and <a className="relative text-brand underline after:absolute after:-inset-x-1 after:-inset-y-3 after:content-['']" href={SOURCES.razorpay.url} target="_blank" rel="noreferrer">Razorpay&apos;s contest API</a>.
        </p>
      </div>
    </details>
  );
}
