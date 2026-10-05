"use client";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CallChip } from "@/components/CallChip";
import { Dialog } from "@/components/Dialog";
import { Drawer } from "@/components/Drawer";
import type { AnalyzeResult } from "@/lib/agent";
import { MAX_EVIDENCE_CHARS, MAX_TITLE_CHARS } from "@/lib/limits";
import { DRAFT_LIMIT, citedIds, containsCardNumber, evaluateGuardrails, sentenceHasSource, splitSentences, type Status } from "@/lib/guardrails";
import { formatInrFull, formatOriginal, timeLeft } from "@/lib/format";
import { DEMO_RATE_INR_PER_USD, VISA_ARBITRATION_FEE_USD, moneyCheck, rateFor } from "@/lib/money";
import type { CaseData, CheckView } from "@/lib/types";
import { readProfile } from "@/lib/useProfile";
import { now, useCaseState } from "@/lib/useCaseState";

const Card = ({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`mb-4 rounded-2xl border border-line bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,.03)] ${className}`}>
    {children}
  </section>
);
const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="mt-4 mb-1.5 text-xs font-semibold tracking-[.6px] text-helper uppercase first:mt-0">{children}</h3>
);
const btn = "min-h-11 rounded-[10px] px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";
const primary = `${btn} bg-brand text-white`;
const ghost = `${btn} border border-[#D6D6D6] bg-white text-[#111]`;

const STATUS_ICON: Record<Status, string> = { pass: "✓", changed: "↻", blocked: "✕", na: "–" };
const STATUS_CLS: Record<Status, string> = {
  pass: "text-green-ink",
  changed: "text-fold",
  blocked: "text-escalate",
  na: "text-helper",
};
const STATUS_WORD: Record<Status, string> = { pass: "Passed", changed: "Changed the call", blocked: "Blocked", na: "Not needed" };

export function CaseView({ c, view: savedView }: { c: CaseData; view: CheckView }) {
  const d = c.dispute;
  const { state, update, reset } = useCaseState(c.id);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [dialog, setDialog] = useState<"submit" | "fold" | null>(null);
  const [why, setWhy] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [addError, setAddError] = useState("");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState<{ kind: "info" | "error"; text: string } | null>(null);

  const view = state.check?.view ?? savedView;
  const allEvidence = [...c.evidence, ...(state.added ?? [])];

  const evidenceIds = allEvidence.map((e) => e.id);
  const draft = state.draft ?? view.draft;
  const contestSubunits = Math.min(state.contestAmount ?? view.defensibleAmount ?? d.amount, d.amount);
  const documentCount = view.slots.filter((s) => evidenceIds.includes(s.evidenceId)).length;

  const g = useMemo(
    () =>
      evaluateGuardrails({
        reasonCode: d.reason_code,
        call: view.call,
        confidence: view.confidence,
        decidingEvidence: view.decidingEvidence,
        missingEvidence: view.missingEvidence,
        evidenceIds,
        evidenceTexts: allEvidence.map((e) => `${"title" in e ? e.title : ""} ${e.content}`),
        draft,
        documentCount,
        schemaOk: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, view, d.reason_code, documentCount],
  );
  const finalCall = g.finalCall;
  const money = moneyCheck({ amountSubunits: d.amount, currency: d.currency, contestSubunits, odds: view.odds });
  const t = timeLeft(d.respond_by_hours_left);
  const showResponse = finalCall !== "shield" && !state.action && (finalCall === "fight" || state.reviewOpen);
  const acted = state.action;
  const checkTheMoney = finalCall === "fight" && !money.worthFighting;

  const log = (actor: "You" | "Advisor", text: string) =>
    update((s) => ({ ...s, audit: [...s.audit, { at: now(), actor, text }] }));

  const focusEvidence = (ids: string[]) => {
    setHighlight(ids);
    document.getElementById(`ev-${ids[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied("Couldn't copy. Select the text and copy it.");
    }
  };

  const documentsBySlot = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of view.slots) if (evidenceIds.includes(s.evidenceId)) m.set(s.slot, [...(m.get(s.slot) ?? []), s.evidenceId]);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.slots]);

  const contestRequest = () =>
    `PATCH /v1/disputes/${d.id}/contest\n` +
    JSON.stringify(
      {
        action: "submit",
        amount: contestSubunits,
        summary: draft.trim(),
        documents: Object.fromEntries([...documentsBySlot].map(([slot, ids]) => [slot, ids.map((i) => `<id of ${i} from Razorpay's Documents API>`)])),
      },
      null,
      2,
    );
  const foldRequest = () => `POST /v1/disputes/${d.id}/accept`;

  const addEvidence = () => {
    const title = newTitle.trim();
    const content = newText.trim();
    if (!title || !content) return setAddError("Give the document a title and some text.");
    if (title.length > MAX_TITLE_CHARS || content.length > MAX_EVIDENCE_CHARS) return setAddError(`Keep the title under ${MAX_TITLE_CHARS} and the text under ${MAX_EVIDENCE_CHARS.toLocaleString()} characters.`);
    if (containsCardNumber(title) || containsCardNumber(content)) return setAddError("Remove the card number and try again.");
    if ((state.added ?? []).length >= 5) return setAddError("Add at most 5 documents.");
    const id = `E${allEvidence.length + 1}`;
    update((s) => ({
      ...s,
      added: [...(s.added ?? []), { id, title, content }],
      dirty: true,
      audit: [...s.audit, { at: now(), actor: "You", text: `Added evidence ${id}: ${title}` }],
    }));
    setNewTitle("");
    setNewText("");
    setAddError("");
    setAdding(false);
  };
  const removeEvidence = (id: string) =>
    update((s) => ({
      ...s,
      // Re-number so IDs stay E1...En in order; the server numbers them the same way.
      added: (s.added ?? []).filter((a) => a.id !== id).map((a, i) => ({ ...a, id: `E${c.evidence.length + i + 1}` })),
      dirty: true,
      audit: [...s.audit, { at: now(), actor: "You", text: `Removed evidence ${id}` }],
    }));

  const steps = [`Reading ${allEvidence.length} documents…`, `Applying Visa rule ${d.reason_code}…`, "Writing the response…"];
  const rerun = async () => {
    const profile = readProfile();
    if (!profile.enabled) {
      setNotice({ kind: "info", text: "Dispute Advisor is off in Agent setup. Turn it on to run a new check." });
      return;
    }
    setRunning(true);
    setStep(0);
    setNotice(null);
    const timer = setInterval(() => setStep((n) => Math.min(n + 1, 2)), 3500);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: c.id, added: (state.added ?? []).map((a) => ({ title: a.title, content: a.content })), policy: profile.policy.trim() ? { text: profile.policy, acceptance: profile.acceptance } : undefined }),
      });
      const r = (await res.json()) as AnalyzeResult;
      if (r.status === "live") {
        update((s) => ({
          ...s,
          check: { view: r.view, meta: r.meta },
          dirty: false,
          draft: undefined,
          contestAmount: undefined,
          reviewOpen: false,
          audit: [...s.audit, { at: now(), actor: "Advisor", text: `Live check: ${r.view.call}${r.meta.cached ? " (from cache)" : ""}` }],
        }));
      } else if (r.status === "saved") {
        update((s) => ({ ...s, dirty: false, audit: [...s.audit, { at: now(), actor: "Advisor", text: `Live check not available (${r.reason}); showing the saved result` }] }));
        setNotice({ kind: "info", text: r.message });
      } else if (r.status === "unavailable") {
        setNotice({ kind: "error", text: r.message });
        update((s) => ({ ...s, audit: [...s.audit, { at: now(), actor: "Advisor", text: `Check unavailable (${r.reason})` }] }));
      } else if (r.status === "rejected") {
        setNotice({ kind: "error", text: r.message });
      } else {
        update((s) => ({ ...s, dirty: false }));
      }
    } catch {
      setNotice({ kind: "error", text: "We couldn't run the check. Decide manually." });
    } finally {
      clearInterval(timer);
      setRunning(false);
    }
  };

  const confirmAction = () => {
    const type = dialog;
    if (!type) return;
    const request = type === "submit" ? contestRequest() : foldRequest();
    const override = (type === "submit" && finalCall !== "fight") || (type === "fold" && finalCall === "fight");
    update((s) => ({
      ...s,
      action: { type, at: now(), request },
      outcome: type === "fold" ? "lost" : s.outcome,
      audit: [
        ...s.audit,
        ...(override ? [{ at: now(), actor: "You" as const, text: `Overrode the call (${finalCall}) and chose ${type === "submit" ? "Fight" : "Fold"}${why.trim() ? `. Reason: ${why.trim()}` : ""}` }] : []),
        { at: now(), actor: "You" as const, text: type === "submit" ? "Approved and submitted the response (simulated)" : "Folded: accepted the dispute (simulated)" },
      ],
    }));
    setDialog(null);
    setWhy("");
  };

  const sentences = splitSentences(draft);
  const blockers = g.submitBlockers;

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href="/disputes" className="mb-2.5 inline-block font-semibold text-brand">
          ← All disputes
        </Link>
        {(state.action || state.audit.length > 0 || state.draft !== undefined) && (
          <button onClick={reset} className="mb-2.5 text-[13px] font-semibold text-helper underline">
            Reset this demo
          </button>
        )}
      </div>

      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-[13px] text-[#555]">{d.id}</p>
            <h1 className="my-1 text-xl leading-[26px] font-semibold md:text-2xl md:leading-8">
              {formatOriginal(d.amount, d.currency)} · {d.network} {d.reason_code} {d.reason_description}
            </h1>
            <p className="text-[13px] text-helper">
              {c.merchant} Raised {d.raised_on}. {formatInrFull(money.atStakeInr)} at the demo rate.
            </p>
          </div>
          <div className="md:text-right">
            <div className={`text-[28px] font-semibold ${t.warn ? "text-warn" : ""}`}>
              {t.warn && <span aria-hidden>⚠ </span>}
              {t.text}
            </div>
            <div className="text-[13px] text-helper">left to respond</div>
            {acted && (
              <div className="mt-1 text-[13px] font-semibold text-green-ink">
                {acted.type === "submit" ? "Contested (simulated)" : "Folded (simulated)"}
              </div>
            )}
          </div>
        </div>
        {d.respond_by_hours_left < 6 && !acted && (
          <p className="mt-3 rounded-[10px] bg-escalate-soft px-3 py-2 font-semibold text-escalate">Respond now. Less than 6 hours left.</p>
        )}
      </Card>

      <div className="grid items-start gap-4 md:grid-cols-[5fr_6fr]">
        <div className="order-2 md:order-none">
          <Card>
            <H3>What the customer says</H3>
            <p className="mt-1 text-[17px]">&ldquo;{c.customer_claim}&rdquo;</p>
            {view.ruleText && (
              <>
                <H3>What this means</H3>
                <p>{view.ruleText}</p>
              </>
            )}
            <H3>What Razorpay knows</H3>
            <p>{c.razorpay_facts}</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <H3>Your evidence</H3>
              <span className="text-[13px] text-helper">{allEvidence.length} documents</span>
            </div>
            {allEvidence.map((e) => {
              const on = highlight.includes(e.id);
              const slots = view.slots.filter((s) => s.evidenceId === e.id);
              const flags = (view.evidenceFlags ?? []).filter((f) => f.evidenceId === e.id);
              const addedItem = "title" in e;
              return (
                <div
                  key={e.id}
                  id={`ev-${e.id}`}
                  className={`mt-2.5 grid grid-cols-[34px_1fr] gap-2.5 rounded-xl border p-3 ${on ? "border-brand bg-[#F4F8FF]" : "border-[#F1F1F1]"}`}
                >
                  <div className="flex h-[26px] items-center justify-center rounded-lg bg-shield-soft text-xs font-semibold">{e.id}</div>
                  <div>
                    {addedItem && <p className="text-xs font-semibold text-helper">Added by you · {(e as { title: string }).title}</p>}
                    <p className="text-sm text-[#555]">{e.content}</p>
                    {slots.map((s) => (
                      <span key={s.slot} className="mt-1.5 mr-1 inline-block rounded-md bg-[#F6F6F6] px-[7px] py-0.5 font-mono text-[11.5px] text-[#555]">
                        {s.slot}
                      </span>
                    ))}
                    {flags.map((f) => (
                      <span key={f.flag} className="mt-1.5 mr-1 inline-block rounded-md bg-fold-soft px-[7px] py-0.5 text-[11.5px] font-semibold text-fold">
                        {f.flag === "instruction_like" ? "⚠ Looks like instructions" : f.flag === "unreadable" ? "⚠ Couldn't read" : "⚠ Contradiction"}
                      </span>
                    ))}
                    {addedItem && !acted && (
                      <button onClick={() => removeEvidence(e.id)} className="mt-1.5 block min-h-6 text-[13px] font-semibold text-escalate underline">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!acted && !adding && finalCall !== "shield" && (
              <button className={`${ghost} mt-3 !border-brand !text-brand`} onClick={() => setAdding(true)}>
                + Add evidence
              </button>
            )}
            {adding && (
              <div className="mt-3 rounded-xl border border-line p-3">
                <label htmlFor="ev-title" className="text-sm font-semibold">
                  Title
                </label>
                <input id="ev-title" value={newTitle} maxLength={MAX_TITLE_CHARS + 20} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Billing audit log" className="mt-1 w-full rounded-[10px] border border-line px-3 py-2 focus:border-brand-focus focus:outline-none" />
                <label htmlFor="ev-text" className="mt-3 block text-sm font-semibold">
                  What it says
                </label>
                <textarea id="ev-text" rows={4} value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Paste the text of the document." className="mt-1 w-full rounded-xl border border-line p-3 text-[14px] focus:border-brand-focus focus:outline-none" aria-describedby="ev-help" />
                <div id="ev-help" className="mt-1 flex justify-between text-[13px]">
                  <span className="text-helper">Don&apos;t paste full card numbers.</span>
                  <span className={newText.length > MAX_EVIDENCE_CHARS ? "font-semibold text-escalate" : "text-helper"}>
                    {newText.length} / {MAX_EVIDENCE_CHARS.toLocaleString()}
                  </span>
                </div>
                {addError && (
                  <p role="alert" className="mt-2 text-[14px] font-semibold text-escalate">
                    {addError}
                  </p>
                )}
                <div className="mt-3 flex gap-2.5">
                  <button className={primary} onClick={addEvidence}>
                    Add evidence
                  </button>
                  <button
                    className={ghost}
                    onClick={() => {
                      setAdding(false);
                      setAddError("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="order-1 md:order-none">
          {state.dirty && !acted && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand bg-[#F4F8FF] px-4 py-3" role="status">
              <span className="font-semibold">Evidence changed.</span>
              <button className={primary} onClick={rerun} disabled={running}>
                Re-run check
              </button>
            </div>
          )}
          {notice && (
            <p role="status" className={`mb-4 rounded-2xl px-4 py-3 font-semibold ${notice.kind === "error" ? "bg-escalate-soft text-escalate" : "bg-shield-soft text-shield"}`}>
              {notice.text}
            </p>
          )}
          <Card className={running ? "opacity-60" : ""}>
            <div className="flex flex-wrap items-center gap-3">
              <CallChip call={finalCall} size="lg" />
              {finalCall !== "shield" && <span className="font-medium text-[#555]">{view.confidence} confidence</span>}
              <span className="ml-auto text-xs text-helper">{view.source.label}</span>
            </div>
            {g.changedReason && finalCall !== "shield" && (
              <p className="mt-2 rounded-[10px] bg-fold-soft px-3 py-1.5 text-[13px] font-semibold text-fold">Changed by safety rule: {g.changedReason}</p>
            )}

            {finalCall === "shield" ? (
              <>
                <p className="mt-3 text-[17px] font-semibold">This is a fraud dispute. Chargeback Shield handles it.</p>
                <p className="mt-1 text-[15px]">Reason code {d.reason_code} is a fraud code. Dispute Advisor only covers non-fraud disputes, so no check was run and there is nothing to submit here.</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-[17px] leading-[1.4] font-semibold">{view.reason}</p>

                {view.decidingEvidence.length > 0 && <H3>Deciding evidence</H3>}
                <p>
                  {view.decidingEvidence.map((e) => (
                    <button
                      key={e}
                      onClick={() => focusEvidence([e])}
                      className="mr-1.5 min-h-6 rounded-md bg-brand-soft px-1.5 text-xs font-semibold text-[#2B5BC8]"
                      aria-label={`Show ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </p>
                <p className="mt-2 text-[14px]">
                  <span className="text-helper">Missing: </span>
                  {view.missingEvidence.length ? view.missingEvidence.join("; ") : "nothing"}
                  <span className="ml-3 text-helper">Contradictions: </span>
                  {view.contradictions.length ? view.contradictions.join("; ") : "none"}
                </p>

                <H3>Money</H3>
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                  <Stat label="At stake" value={formatInrFull(money.atStakeInr)} sub={`${formatOriginal(d.amount, d.currency)} · demo rate ₹${rateFor(d.currency)}`} />
                  <Stat label="Taken back if you lose" value={formatInrFull(money.atStakeInr)} sub="rate on dispute day" />
                  <Stat label="Fees at risk" value={formatInrFull(money.feesAtRiskInr)} sub={`Visa arbitration USD ${VISA_ARBITRATION_FEE_USD}`} />
                  <Stat label="AI estimate of odds" value={`${Math.round(view.odds * 100)}%`} sub="estimate, not a promise" />
                </div>
                {view.defensibleAmount !== null && (
                  <p className="mt-2 text-[13px] text-[#555]">
                    Only part is worth contesting: {formatOriginal(view.defensibleAmount, d.currency)} ({formatInrFull(money.contestInr)}).
                  </p>
                )}
                <p className="mt-2 text-xs text-helper">{view.oddsNote}</p>
                {view.economicsNote && <p className="mt-2 text-[14px] text-[#333]">{view.economicsNote}</p>}
                {finalCall === "fight" || finalCall === "fold" ? (
                  (() => {
                    const agrees = finalCall === "fight" ? money.worthFighting : !money.worthFighting;
                    const text =
                      finalCall === "fight"
                        ? money.worthFighting
                          ? "✓ Fighting is worth it"
                          : "⚠ Check the money: the fees at risk are high for this amount"
                        : money.worthFighting
                          ? "⚠ Check the money: the numbers say fighting could pay"
                          : "✓ The numbers agree: fighting is not worth it here";
                    return <p className={`mt-2 inline-block rounded-[10px] px-3 py-2 font-semibold ${agrees ? "bg-fight-soft text-green-ink" : "bg-fold-soft text-fold"}`}>{text}</p>;
                  })()
                ) : null}
                {(checkTheMoney || (finalCall === "fold" && money.worthFighting)) && <p className="mt-1 text-[13px] text-helper">The call stays {finalCall === "fight" ? "Fight" : "Fold"}. This is a note, not a change.</p>}
              </>
            )}

            {finalCall !== "shield" && (
              <details className="mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer font-semibold text-green-ink">
                  Safety checks ({g.lines.filter((l) => l.status === "pass").length} of {g.lines.length} passed)
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {g.lines.map((l) => (
                    <li key={l.id} className={`text-[14px] ${STATUS_CLS[l.status]}`}>
                      <span aria-hidden>{STATUS_ICON[l.status]} </span>
                      <span className="font-semibold">
                        {l.id} · {STATUS_WORD[l.status]}:
                      </span>{" "}
                      <span className="text-[#333]">{l.message}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {!acted && finalCall !== "shield" && (
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {finalCall === "fight" && (
                  <>
                    <button className={primary} onClick={() => update((s) => ({ ...s, reviewOpen: true }))} aria-expanded={showResponse}>
                      Review response
                    </button>
                    <button className={ghost} onClick={() => setDialog("fold")}>
                      Fold
                    </button>
                  </>
                )}
                {finalCall === "fold" && (
                  <>
                    <button className={primary} onClick={() => setDialog("fold")}>
                      Fold
                    </button>
                    <button className={ghost} onClick={() => update((s) => ({ ...s, reviewOpen: true }))}>
                      Fight instead
                    </button>
                  </>
                )}
                {finalCall === "escalate" && (
                  <>
                    <button className={ghost} onClick={() => update((s) => ({ ...s, reviewOpen: true }))}>
                      Fight anyway
                    </button>
                    <button className={ghost} onClick={() => setDialog("fold")}>
                      Fold
                    </button>
                  </>
                )}
              </div>
            )}

            {running && (
              <p className="mt-3 text-[14px] font-semibold text-brand" role="status" aria-live="polite">
                {steps[step]}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
              <span className="text-[13px] text-helper">Was this call useful?</span>
              <button
                aria-label="Thumbs up"
                aria-pressed={state.thumbs === "up"}
                className={`min-h-11 min-w-11 rounded-[10px] border text-lg ${state.thumbs === "up" ? "border-brand bg-brand-soft" : "border-[#D6D6D6]"}`}
                onClick={() => {
                  update((s) => ({ ...s, thumbs: "up" }));
                  log("You", "Marked the call useful");
                }}
              >
                👍
              </button>
              <button
                aria-label="Thumbs down"
                aria-pressed={state.thumbs === "down"}
                className={`min-h-11 min-w-11 rounded-[10px] border text-lg ${state.thumbs === "down" ? "border-brand bg-brand-soft" : "border-[#D6D6D6]"}`}
                onClick={() => {
                  update((s) => ({ ...s, thumbs: "down" }));
                  log("You", "Marked the call not useful");
                }}
              >
                👎
              </button>
              {finalCall !== "shield" && !acted && (
                <button className={ghost} onClick={rerun} disabled={running}>
                  Re-run check
                </button>
              )}
              <button onClick={() => setDrawer(true)} className="ml-auto text-[14px] font-semibold text-brand">
                Under the hood ›
              </button>
            </div>
          </Card>

          {finalCall === "escalate" && !acted && (
            <Card>
              <H3>Get this first</H3>
              <p className="text-[17px] font-semibold">{view.getFirst ?? "More evidence is needed before you can decide."}</p>
              <p className="mt-2 text-[15px]">
                {d.respond_by_hours_left < 6
                  ? "No time to gather more: choose Fight or Fold."
                  : `You have ${t.text}. If you can't get it, choose Fight${view.defensibleAmount !== null ? ` for the part worth contesting (${formatInrFull(money.contestInr)})` : ""} or Fold.`}
              </p>
              {view.requestText && (
                <>
                  <H3>Message to send</H3>
                  <p className="rounded-xl bg-[#FAFAFA] p-3 text-[14px]">{view.requestText}</p>
                  <button className={`${ghost} mt-3 !border-brand !text-brand`} onClick={() => copy("request", view.requestText ?? "")}>
                    {copied === "request" ? "Copied" : "Copy"}
                  </button>
                </>
              )}
            </Card>
          )}
        </div>
      </div>

      {showResponse && (
        <Card id="response">
          <h2 className="mb-1 text-lg font-semibold">Review your response</h2>
          <p className="mb-3 text-[13px] text-helper">Every sentence needs a source. You can edit anything. Nothing is sent until you approve.</p>

          <label htmlFor="draft" className="text-sm font-semibold">
            Explanation for the bank
          </label>
          <textarea
            id="draft"
            value={draft}
            rows={6}
            onChange={(e) => {
              const v = e.target.value;
              update((s) => ({
                ...s,
                draft: v,
                audit: s.audit.some((a) => a.text === "Edited the draft") ? s.audit : [...s.audit, { at: now(), actor: "You", text: "Edited the draft" }],
              }));
            }}
            className="mt-1 w-full rounded-xl border border-line p-3 text-[15px] leading-[1.6] focus:border-brand-focus focus:outline-none"
            aria-describedby="draft-help"
          />
          <div id="draft-help" className="mt-1 flex justify-between text-[13px]">
            <span className="text-helper">Use [E1] style tags to cite a document, or [Razorpay] for Razorpay's records.</span>
            <span className={draft.trim().length > DRAFT_LIMIT ? "font-semibold text-escalate" : "text-helper"}>
              {draft.trim().length} / {DRAFT_LIMIT}
            </span>
          </div>

          {sentences.length > 0 && (
            <>
              <H3>Sources by sentence</H3>
              <ul className="space-y-1.5">
                {sentences.map((s, i) => {
                  const ids = citedIds(s);
                  const ok = sentenceHasSource(s);
                  return (
                    <li key={i} className="text-[14px]">
                      <span className={ok ? "" : "underline decoration-escalate decoration-wavy"}>{s.replace(/\s*\[[^\]]*\]/g, "")}</span>{" "}
                      {ok ? (
                        ids.map((id) => (
                          <button key={id} onClick={() => id !== "Razorpay" && focusEvidence([id])} className="mr-1 rounded-md bg-brand-soft px-1.5 text-xs font-semibold text-[#2B5BC8]">
                            {id}
                          </button>
                        ))
                      ) : (
                        <span className="text-[13px] font-semibold text-escalate">Add a source or remove this sentence</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <H3>Documents by slot</H3>
          {documentsBySlot.size === 0 ? (
            <p className="text-[14px] text-escalate">No documents attached. Razorpay needs at least one to submit.</p>
          ) : (
            <ul className="text-[14px]">
              {[...documentsBySlot].map(([slot, ids]) => (
                <li key={slot}>
                  <span className="rounded-md bg-[#F6F6F6] px-[7px] py-0.5 font-mono text-[12px]">{slot}</span> {ids.join(", ")}
                </li>
              ))}
            </ul>
          )}

          <H3>Amount to contest</H3>
          <div className="flex items-center gap-2">
            <label htmlFor="amt" className="sr-only">
              Contest amount in {d.currency}
            </label>
            <span className="text-sm">{d.currency}</span>
            <input
              id="amt"
              type="number"
              min={1}
              max={d.amount / 100}
              step="0.01"
              value={contestSubunits / 100}
              onChange={(e) => {
                const v = Math.round(Number(e.target.value) * 100);
                if (!Number.isFinite(v) || v < 1) return;
                update((s) => ({ ...s, contestAmount: Math.min(v, d.amount) }));
              }}
              className="w-32 rounded-[10px] border border-line px-3 py-2 focus:border-brand-focus focus:outline-none"
            />
            <span className="text-[13px] text-helper">of {formatOriginal(d.amount, d.currency)}</span>
          </div>
          <p className="mt-1 text-[13px] text-helper">
            {view.defensibleAmount !== null ? "Pre-filled with the part the check found defensible. " : "Full amount by default. "}You can contest a smaller part.
          </p>

          {blockers.length > 0 && (
            <p className="mt-4 rounded-[10px] bg-escalate-soft px-3 py-2 text-[14px] text-escalate" role="status">
              <span className="font-semibold">You can't submit yet:</span> {blockers.join(". ")}.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button className={primary} disabled={blockers.length > 0} onClick={() => setDialog("submit")} title={blockers.length ? blockers.join(". ") : undefined}>
              Approve and submit
            </button>
            <button className={ghost} onClick={() => update((s) => ({ ...s, reviewOpen: false }))}>
              Close
            </button>
            <button className={`${ghost} !border-brand !text-brand ml-auto`} onClick={() => copy("draft", draft)}>
              {copied === "draft" ? "Copied" : "Copy"}
            </button>
            <p className="w-full text-xs text-helper">Simulated: nothing is sent to Razorpay.</p>
          </div>
        </Card>
      )}

      {acted && (
        <Card>
          <h2 className="mb-1 text-lg font-semibold">{acted.type === "submit" ? "Response submitted (simulated)" : "Dispute folded (simulated)"}</h2>
          <p className="mb-2 text-[13px] font-semibold text-helper">Simulated: not sent to Razorpay. This is the request the real app would send.</p>
          <pre className="overflow-x-auto rounded-xl bg-[#0F172A] p-4 text-[12.5px] leading-[1.6] text-[#E2E8F0]">{acted.request}</pre>

          <H3>Status</H3>
          <ol className="flex flex-wrap items-center gap-2 text-[14px]">
            <li className="rounded-full bg-shield-soft px-3 py-1">Open</li>
            <li aria-hidden>→</li>
            <li className="rounded-full bg-shield-soft px-3 py-1">Under review</li>
            <li aria-hidden>→</li>
            <li className={`rounded-full px-3 py-1 font-semibold ${state.outcome === "won" ? "bg-fight-soft text-fight" : state.outcome === "lost" ? "bg-escalate-soft text-escalate" : "bg-shield-soft"}`}>
              {state.outcome === "won" ? "Won" : state.outcome === "lost" ? (acted.type === "fold" ? "Lost (accepted)" : "Lost") : "Won or lost"}
            </li>
          </ol>
          {acted.type === "submit" && (
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <span className="text-[13px] text-helper">Demo: set the outcome</span>
              {(["won", "lost"] as const).map((o) => (
                <button
                  key={o}
                  className={ghost}
                  aria-pressed={state.outcome === o}
                  onClick={() => {
                    update((s) => ({ ...s, outcome: o }));
                    log("You", `Marked the dispute ${o} (demo)`);
                  }}
                >
                  Mark as {o}
                </button>
              ))}
            </div>
          )}

          {state.outcome && (
            <>
              <H3>What the agent learns</H3>
              <p className="text-[15px]">
                Reason {d.reason_code}
                {documentsBySlot.size > 0 && <> with {[...documentsBySlot.keys()].join(" + ")}</>}: <b>{state.outcome}</b>. In the real product this feeds the odds for the next dispute like this one.
              </p>
              {view.tip && (
                <>
                  <H3>Next time</H3>
                  <p className="text-[15px]">{view.tip}</p>
                </>
              )}
              {state.outcome === "lost" && (
                <>
                  <H3>Next steps</H3>
                  <p className="text-[13px] text-helper">Things to confirm, not advice.</p>
                  <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-[15px]">
                    <li>Ask your bank about reducing the export value recorded for this payment. Razorpay can supply the dispute documents.</li>
                    <li>Ask your accountant whether a GST credit note applies.</li>
                  </ol>
                </>
              )}
            </>
          )}
        </Card>
      )}

      <Dialog open={dialog === "fold"} onClose={() => setDialog(null)} title="Fold this dispute?">
        <p className="text-[15px]">
          {formatInrFull(money.atStakeInr)} will be taken from your balance ({formatOriginal(d.amount, d.currency)} at the demo rate of ₹{rateFor(d.currency)}; the real rate is the one on the day the dispute was created). You can&apos;t undo this.
        </p>
        <p className="mt-2 text-[14px] text-helper">Why the advisor says {finalCall}: {view.reason}</p>
        {finalCall === "fight" && <OverrideWhy why={why} setWhy={setWhy} />}
        <DialogButtons onCancel={() => setDialog(null)} onYes={confirmAction} yes="Yes, fold" />
      </Dialog>
      <Dialog open={dialog === "submit"} onClose={() => setDialog(null)} title="Submit your response?">
        <p className="text-[15px]">This sends your response to the customer&apos;s bank. You can&apos;t edit it afterwards.</p>
        <p className="mt-2 text-[14px] text-helper">
          Contesting {formatOriginal(contestSubunits, d.currency)} of {formatOriginal(d.amount, d.currency)}.
        </p>
        {finalCall !== "fight" && <OverrideWhy why={why} setWhy={setWhy} />}
        <DialogButtons onCancel={() => setDialog(null)} onYes={confirmAction} yes="Yes, submit" />
      </Dialog>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Under the hood">
        <H3>Result</H3>
        {state.check ? (
          <>
            <p>
              <b>Live</b> check. {state.check.meta.model}, prompt {state.check.meta.promptVersion}
              {state.check.meta.cached ? ", served from the cache (no new cost)" : ""}.
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[14px]">
              <dt className="text-helper">Tokens in / out</dt>
              <dd>
                {state.check.meta.tokensIn.toLocaleString()} / {state.check.meta.tokensOut.toLocaleString()}
              </dd>
              <dt className="text-helper">Response time</dt>
              <dd>{(state.check.meta.ms / 1000).toFixed(1)} s</dd>
              <dt className="text-helper">Cost</dt>
              <dd>
                ${state.check.meta.costUsd.toFixed(4)} · ₹{state.check.meta.costInr.toFixed(2)}
              </dd>
            </dl>
            <p className="mt-1 text-[13px] text-helper">Cost uses the token prices in the repo and the demo rate.</p>
          </>
        ) : (
          <>
            <p>
              <b>Saved result</b>, not a live call. {view.source.model}, prompt {view.source.promptVersion}, run on {view.source.date}.
            </p>
            <p className="mt-1 text-[13px] text-helper">Tokens, response time and cost appear here after a live check.</p>
            <p className="mt-1 text-[13px] text-helper">Odds, the defensible amount, the request text and the prevention tip on saved results come from the builder&apos;s supplement file, not the model.</p>
          </>
        )}
        <p className="mt-1 text-[13px] text-helper">Demo rate ₹{DEMO_RATE_INR_PER_USD} per USD is a placeholder.</p>

        <H3>Safety checks</H3>
        <ul className="space-y-1.5">
          {g.lines.map((l) => (
            <li key={l.id} className={`text-[14px] ${STATUS_CLS[l.status]}`}>
              <span aria-hidden>{STATUS_ICON[l.status]} </span>
              <span className="font-semibold">
                {l.id} {l.rule}:
              </span>{" "}
              <span className="text-[#333]">{l.message}</span>
            </li>
          ))}
        </ul>

        <H3>Raw output</H3>
        <pre className="max-h-64 overflow-auto rounded-xl bg-[#0F172A] p-3 text-[12px] text-[#E2E8F0]">{JSON.stringify(view.raw, null, 2)}</pre>

        <H3>Audit trail</H3>
        <ol className="space-y-1 text-[14px]">
          <li>
            <span className="text-helper">Advisor ·</span> Loaded the saved check ({savedView.call})
          </li>
          {state.audit.map((a, i) => (
            <li key={i}>
              <span className="text-helper">
                {a.actor} · {new Date(a.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·
              </span>{" "}
              {a.text}
            </li>
          ))}
        </ol>
      </Drawer>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[#F1F1F1] bg-[#FAFAFA] px-3 py-2.5">
      <span className="block text-xs text-helper">{label}</span>
      <b className="block text-[17px] font-semibold">{value}</b>
      <em className="text-xs text-helper not-italic">{sub}</em>
    </div>
  );
}

function OverrideWhy({ why, setWhy }: { why: string; setWhy: (v: string) => void }) {
  return (
    <div className="mt-3">
      <label htmlFor="why" className="text-sm font-semibold">
        You are choosing differently from the advisor. Why? (optional)
      </label>
      <textarea id="why" value={why} onChange={(e) => setWhy(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-line p-2 text-[14px] focus:border-brand-focus focus:outline-none" />
    </div>
  );
}

function DialogButtons({ onCancel, onYes, yes }: { onCancel: () => void; onYes: () => void; yes: string }) {
  return (
    <div className="mt-5 flex justify-end gap-2.5">
      <button className={ghost} onClick={onCancel}>
        Cancel
      </button>
      <button className={primary} onClick={onYes}>
        {yes}
      </button>
    </div>
  );
}
