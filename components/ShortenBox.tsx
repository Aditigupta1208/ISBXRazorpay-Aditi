"use client";
import { useState } from "react";
import type { ShortenResult } from "@/lib/assistCore";
import { DRAFT_LIMIT } from "@/lib/guardrails";
import { readProfile } from "@/lib/useProfile";

const btn = "min-h-11 rounded-[10px] px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Shown when the response is over Razorpay's 1,000 character limit. The AI proposes a shorter version,
 * code checks it (sources kept, nothing invented), and the merchant chooses whether to use it.
 */
export function ShortenBox({
  caseId,
  added,
  draft,
  onUse,
}: {
  caseId: string;
  added: { title: string; content: string }[];
  draft: string;
  onUse: (newDraft: string, how: "ai" | "trim") => void;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ r: ShortenResult; forDraft: string } | null>(null);
  const [error, setError] = useState("");
  const length = draft.trim().length;
  const shown = result && result.forDraft === draft ? result.r : null; // a proposal belongs to the draft it was made for

  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const profile = readProfile();
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "shorten", caseId, added, draft, policy: profile.policy.trim() ? { text: profile.policy, acceptance: profile.acceptance } : undefined }),
      });
      const r = (await res.json()) as ShortenResult;
      if (r.status === "ok") setResult({ r, forDraft: draft });
      else setError(r.message);
    } catch {
      setError("That didn't work just now. Try again, or cut it by hand.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-[#F0D9A8] bg-[#FFF8E6] p-3" data-testid="shorten-box">
      <p className="text-[14px] font-semibold text-fold">
        This is {length - DRAFT_LIMIT} characters too long. Razorpay accepts up to {DRAFT_LIMIT.toLocaleString()}.
      </p>
      {!shown && (
        <>
          <p className="mt-0.5 text-[12px] text-[#555]">The advisor can write a shorter version that keeps a source on every sentence. You see it first, and nothing changes until you choose it.</p>
          <button className={`${btn} mt-2 border border-brand bg-white text-brand`} onClick={run} disabled={running}>
            {running ? "Shortening…" : "Shorten it for me"}
          </button>
          {running && (
            <p className="mt-2 text-[13px] text-helper" data-testid="wait-note">
              Connecting to the AI model. On this demo it can take up to a minute. If it cannot answer, the last sentences are dropped instead.
            </p>
          )}
          {error && <p className="mt-2 text-[14px] text-danger" role="alert">{error}</p>}
        </>
      )}
      {shown && shown.status === "ok" && (
        <div className="mt-2" data-testid="shorten-result">
          <p className="text-[13px] font-semibold text-helper">
            {shown.method === "ai" ? `Shorter version by AI (${shown.model}${shown.cached ? ", from the cache" : ""}). ${shown.draft.length} characters.` : `Shorter version made by code, no AI. ${shown.draft.length} characters.`}
          </p>
          <p className="mt-1 rounded-lg bg-white p-2.5 text-[14px] leading-[1.6]">{shown.draft}</p>
          <p className="mt-1 text-[12px] text-[#555]">
            {shown.method === "ai" ? "Every sentence keeps a source, and no new numbers were added. Read it before you use it." : `${shown.message} Sentences dropped: ${shown.dropped}.`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className={`${btn} bg-brand text-white`} onClick={() => { onUse(shown.draft, shown.method); setResult(null); }}>
              Use this version
            </button>
            <button className={`${btn} border border-[#D6D6D6] bg-white text-[#111]`} onClick={() => setResult(null)}>
              Keep mine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
