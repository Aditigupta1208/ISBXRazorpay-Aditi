"use client";
import { useState } from "react";
import { policyPatchFor } from "@/lib/policyPatch";

/** Wording and records for the next customer, by reason code. Copy only; nothing is sent or changed. */
export function PolicyPatch({ code }: { code: string }) {
  const blocks = policyPatchFor(code);
  const [copied, setCopied] = useState<string | null>(null);
  if (!blocks) return null;
  const copy = async (title: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(title);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore: the text is on screen */
    }
  };
  return (
    <details data-testid="policy-patch" className="mt-3 rounded-xl border border-line px-3 py-2">
      <summary className="min-h-8 cursor-pointer text-[14px] font-semibold text-brand">Policy patch: wording for your next customer</summary>
      <p className="mt-2 text-[13px] text-helper">Fill in the [blanks] and use what fits. A starting point, not legal advice. Nothing is sent or changed for you.</p>
      <ul className="mt-2 space-y-3">
        {blocks.map((b) => (
          <li key={b.title} className="rounded-xl bg-[#F7F9FC] p-3 text-[14px]">
            <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">{b.kind}</p>
            <p className="font-semibold">{b.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-[#333]">{b.text}</p>
            {b.kind !== "Keep this record" && (
              <button type="button" onClick={() => copy(b.title, b.text)} className="mt-2 min-h-8 text-[13px] font-semibold text-brand underline">
                {copied === b.title ? "Copied" : "Copy this wording"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
