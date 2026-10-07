"use client";
import { useEffect, useRef, useState } from "react";
import type { RebuttalResult } from "@/lib/rebuttal";
import { VERDICT_LABEL, applyFix, sameDraft, type RebuttalView, type Verdict } from "@/lib/rebuttalCore";
import { TOUR_BANK_EVENT } from "@/lib/tourSteps";
import { readProfile } from "@/lib/useProfile";

const btn = "min-h-11 rounded-[10px] px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";
const ghost = `${btn} border border-[#D6D6D6] bg-white text-[#111]`;
const ghostBrand = `${btn} border border-brand bg-white text-brand`;

const VERDICT_CHIP: Record<Verdict, string> = {
  holds_up: "bg-fight-soft text-fight",
  weak_spot: "bg-fold-soft text-fold",
  likely_to_lose: "bg-escalate-soft text-escalate",
};
const VERDICT_LINE: Record<Verdict, string> = {
  holds_up: "A reviewer would probably accept this.",
  weak_spot: "One gap a reviewer could use against you.",
  likely_to_lose: "The documents don't meet the rule, so better wording won't fix this.",
};
const CHECK_ICON = { pass: "✓", changed: "↻", na: "–" } as const;
const CHECK_CLS = { pass: "text-green-ink", changed: "text-fold", na: "text-helper" } as const;

/**
 * Bank's rebuttal: a practice run where a second AI pass plays the cardholder's bank and attacks the draft.
 * It never changes the call and never edits the draft by itself. Every step is a click.
 */
export function RebuttalPanel({
  caseId,
  added,
  draft,
  result,
  onResult,
  onApply,
  onAddDocument,
  onFocusEvidence,
  onLog,
}: {
  caseId: string;
  added: { title: string; content: string }[];
  draft: string;
  result: RebuttalView | undefined;
  onResult: (v: RebuttalView) => void;
  onApply: (newDraft: string) => void;
  onAddDocument: () => void;
  onFocusEvidence: (ids: string[]) => void;
  onLog: (text: string) => void;
}) {
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const hasDraft = draft.trim().length > 0;
  const stale = !!result && !sameDraft(draft, result.forDraft);
  const rewrite = result ? applyFix(draft, result) : null;
  const changedChecks = result?.checks.filter((c) => c.status === "changed").length ?? 0;

  const run = async (demo = false) => {
    const profile = readProfile();
    if (!profile.enabled && !demo) {
      setNotice({ kind: "info", text: "Dispute Advisor is off in Agent setup. Turn it on to test your response." });
      return;
    }
    setRunning(true);
    setNotice(null);
    try {
      const res = await fetch("/api/rebuttal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseId,
          added,
          draft,
          demo: demo || undefined,
          policy: profile.policy.trim() ? { text: profile.policy, acceptance: profile.acceptance } : undefined,
        }),
      });
      const r = (await res.json()) as RebuttalResult;
      if (r.status === "live" || r.status === "saved") {
        onResult(r.view);
        onLog(`Tested the response against a bank reviewer: ${VERDICT_LABEL[r.view.verdict]}${r.status === "saved" ? " (saved example)" : ""}`);
      } else {
        setNotice({ kind: "error", text: r.message });
      }
    } catch {
      setNotice({ kind: "error", text: "We couldn't run the test. Check the response against the documents yourself." });
    } finally {
      setRunning(false);
    }
  };

  // The guided tour asks for the saved example so the reviewer sees a result. It never calls the model.
  const runRef = useRef(run);
  runRef.current = run;
  const hasResult = useRef(false);
  hasResult.current = !!result;
  useEffect(() => {
    const onTour = () => {
      if (!hasResult.current) void runRef.current(true);
    };
    window.addEventListener(TOUR_BANK_EVENT, onTour);
    return () => window.removeEventListener(TOUR_BANK_EVENT, onTour);
  }, []);

  return (
    <div id="rebuttal" data-testid="rebuttal" className="mt-5 scroll-mt-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-72">
          <h3 className="text-[16px] font-semibold">Test it on the bank first</h3>
          <p className="mt-0.5 text-[12px] text-helper">
            A practice run, not a real bank decision. A second AI pass reads your response like the cardholder&apos;s bank and tells you where it is weakest. It never changes your call or edits your draft.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {!hasDraft && <span className="text-[12px] text-helper">Write a response first.</span>}
          <button className={ghostBrand} onClick={() => run()} disabled={running || !hasDraft} data-testid="rebuttal-run">
            {running ? "Testing…" : result ? "Test again" : "Test this response"}
          </button>
        </div>
      </div>
      {running && (
        <div className="mt-3" role="status" aria-live="polite">
          <p className="text-[14px] font-semibold text-brand">Reading it as the bank would…</p>
          <p className="mt-0.5 text-[12px] text-helper" data-testid="wait-note">Connecting to the AI model. On this demo it can take up to a minute. If it cannot answer, you will see the saved result.</p>
        </div>
      )}

      {notice && (
        <p className={`mt-3 rounded-[10px] px-3 py-2 text-[14px] ${notice.kind === "error" ? "bg-escalate-soft text-escalate" : "bg-[#F4F8FF] text-[#2B5BC8]"}`} role="status">
          {notice.text}
        </p>
      )}

      {result && (
        <div className={`mt-4 rounded-xl border border-line bg-[#F7F8FA] p-4 ${stale ? "opacity-70" : ""}`} data-testid="rebuttal-result" aria-label="The bank reviewer's pushback">
          {stale && (
            <p className="mb-3 rounded-[10px] bg-fold-soft px-3 py-2 text-[14px] font-semibold text-fold" data-testid="rebuttal-stale">
              You changed the response after this test. Test again to check the new version.
            </p>
          )}

          <div data-tour="bank-body">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${VERDICT_CHIP[result.verdict]}`} data-testid="rebuttal-verdict">
              {VERDICT_LABEL[result.verdict]}
            </span>
            <span className="text-[14px]">{VERDICT_LINE[result.verdict]}</span>
          </div>

          <p className="mt-3 text-[14px]">
            <b>{result.verdict === "holds_up" ? "What a reviewer might still ask. " : "The bank's strongest objection. "}</b>
            {result.objection}
            {result.evidenceIds.map((id) => (
              <button
                key={id}
                onClick={() => onFocusEvidence([id])}
                className="relative ml-1.5 inline-flex min-h-8 min-w-8 items-center justify-center rounded-md bg-brand-soft px-1.5 text-[12px] font-semibold text-[#2B5BC8] after:absolute after:-inset-1 after:content-['']"
                aria-label={`Show ${id}`}
              >
                {id}
              </button>
            ))}
          </p>

          {result.weakSentence && (
            <div className="mt-3" data-testid="rebuttal-weak">
              <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">Weakest sentence in your response</p>
              <blockquote className="mt-1 border-l-4 border-fold bg-white px-3 py-2 text-[14px]">{result.weakSentence}</blockquote>
              {result.whyWeak && <p className="mt-1 text-[12px] text-helper">{result.whyWeak}</p>}
            </div>
          )}

          {result.fix?.kind === "reword" && (
            <div className="mt-3" data-testid="rebuttal-fix">
              <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">Suggested rewrite</p>
              <p className="mt-1 rounded-[10px] border border-line bg-white px-3 py-2 text-[14px]">{result.fix.sentence}</p>
              <p className="mt-1 text-[12px] text-helper">Built from your documents. Check every fact before you use it.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <button
                  className={`${btn} bg-brand text-white`}
                  disabled={!rewrite}
                  data-testid="rebuttal-apply"
                  onClick={() => {
                    if (!rewrite) return;
                    onApply(rewrite);
                    onLog("Used the suggested rewrite from the practice run");
                  }}
                >
                  Use this rewrite
                </button>
                {!rewrite && <span className="text-[12px] text-helper">Test again to get a rewrite for the current draft.</span>}
              </div>
            </div>
          )}

          {result.fix?.kind === "add_document" && (
            <div className="mt-3" data-testid="rebuttal-fix">
              <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">A document that would answer it</p>
              <p className="mt-1 rounded-[10px] border border-line bg-white px-3 py-2 text-[14px]">{result.fix.document}</p>
              <div className="mt-2">
                <button className={ghost} onClick={onAddDocument}>
                  Add the document
                </button>
              </div>
            </div>
          )}

          </div>

          <details className="mt-4" data-testid="rebuttal-checks">
            <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-semibold text-brand">
              Safety checks on this answer{changedChecks > 0 && <span className="ml-2 text-fold">{changedChecks} changed</span>}
            </summary>
            <ul className="mt-2 space-y-1 text-[14px]">
              {result.checks.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <span className={`w-5 shrink-0 font-semibold ${CHECK_CLS[c.status]}`} aria-hidden>
                    {CHECK_ICON[c.status]}
                  </span>
                  <span>
                    <span className="font-semibold">{c.rule}.</span> <span className="text-[#333]">{c.message}</span>
                  </span>
                </li>
              ))}
            </ul>
          </details>

          <p className="mt-3 text-[12px] text-helper">{result.source.label}</p>
        </div>
      )}
    </div>
  );
}
