"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CallChip } from "@/components/CallChip";
import { Dialog } from "@/components/Dialog";
import { Drawer } from "@/components/Drawer";
import type { AnalyzeResult } from "@/lib/agent";
import { MAX_EVIDENCE_CHARS, MAX_TITLE_CHARS } from "@/lib/limits";
import { DRAFT_LIMIT, citedIds, containsCardNumber, checksBadge, checksSummary, evaluateGuardrails, sentenceHasSource, splitSentences, type Status } from "@/lib/guardrails";
import { formatInrFull, formatOriginal, timeLeft } from "@/lib/format";
import { DEFAULT_EFFORT_COST_INR, VISA_ARBITRATION_FEE_USD, moneyCheck, rateFor, worthFindingCeiling } from "@/lib/money";
import { rateNote, rateWord } from "@/lib/rates";
import { useRates } from "@/components/RatesProvider";
import type { CaseData, CheckView } from "@/lib/types";
import { FILE_TYPES, MAX_FILE_BYTES } from "@/lib/uploadLimits";
import { evidenceHint } from "@/lib/evidenceHints";
import { EvidenceChecklist } from "@/components/EvidenceChecklist";
import { RebuttalPanel } from "@/components/RebuttalPanel";
import { ShortenBox } from "@/components/ShortenBox";
import { KeyFactLines, KeyFactsButton } from "@/components/KeyFactsBox";
import { VERDICT_LABEL, sameDraft } from "@/lib/rebuttalCore";
import { checklistFor } from "@/lib/evidenceChecklist";
import { readProfile } from "@/lib/useProfile";
import { now, useCaseState } from "@/lib/useCaseState";
import { removeLedger, upsertLedger, useLedger } from "@/lib/ledger";
import { track } from "@/lib/track";
import { ODDS_PRIOR_WEIGHT, oddsForCall, fromAction, historyFor, sampleRecords } from "@/lib/results";
import { compareWithChecklist } from "@/lib/vsChecklist";
import { buildMissCase, missKind } from "@/lib/missCase";
import { buildTimeline, daysBetween } from "@/lib/timeline";

const Card = ({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`mb-4 rounded-2xl border border-line bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,.03)] ${className}`}>
    {children}
  </section>
);
const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="mt-4 mb-1.5 text-[12px] font-semibold tracking-[.6px] text-helper uppercase first:mt-0">{children}</h3>
);
const btn = "min-h-11 rounded-[10px] px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";
const CALL_NAME = { fight: "Fight", fold: "Fold", escalate: "Escalate", shield: "Chargeback Shield" } as const;
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

export function CaseView({ c, view: savedView, prev, next }: { c: CaseData; view: CheckView; prev?: string | null; next?: string | null }) {
  const d = c.dispute;
  const { state, update, reset, ready } = useCaseState(c.id);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [dialog, setDialog] = useState<"submit" | "fold" | null>(null);
  const [why, setWhy] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [addError, setAddError] = useState("");
  const [reading, setReading] = useState(false);
  const [readNote, setReadNote] = useState("");
  const [autoTitle, setAutoTitle] = useState(""); // the last title we filled from a file; typing your own keeps it
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const toggleRow = (k: string) => setOpenRows((o) => ({ ...o, [k]: !o[k] }));
  const showRow = (k: string) => setOpenRows((o) => ({ ...o, [k]: true }));

  const view = state.check?.view ?? savedView;
  const allEvidence = [...c.evidence, ...(state.added ?? [])];

  const evidenceIds = allEvidence.map((e) => e.id);
  const evidenceSig = allEvidence.map((e) => `${e.id}:${e.content.length}`).join("|");
  const keyFactsR = state.keyFacts && state.keyFacts.sig === evidenceSig ? state.keyFacts.result : undefined;
  const keyFactsShown = keyFactsR && (keyFactsR.status === "live" || keyFactsR.status === "saved") ? keyFactsR : undefined;
  const timeline = useMemo(
    () => buildTimeline({ raisedOn: d.raised_on, evidence: allEvidence.map((e) => ({ id: e.id, content: e.content })) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d.raised_on, state.added],
  );
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
  const vsChecklist = useMemo(
    () =>
      finalCall === "shield"
        ? null
        : compareWithChecklist(
            { reasonCode: d.reason_code, razorpayFacts: c.razorpay_facts, evidence: allEvidence.map((e) => ({ id: e.id, content: `${"title" in e ? e.title : ""} ${e.content}` })) },
            finalCall,
          ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finalCall, d.reason_code, c.razorpay_facts, allEvidence.length, state.added],
  );
  const rates = useRates();
  // The merchant's record (sample history plus what they did here, never this dispute itself) shifts the AI's odds a little.
  const { recs: myRecs } = useLedger();
  const pool = useMemo(() => [...sampleRecords(rates), ...myRecs.filter((r) => r.id !== c.id)], [rates, myRecs, c.id]);
  const record = useMemo(() => historyFor(pool, d.reason_code), [pool, d.reason_code]);
  const oddsAdj = useMemo(() => oddsForCall(finalCall, view.odds, view.confidence, pool), [view.odds, view.confidence, pool]);
  const money = moneyCheck({ amountSubunits: d.amount, currency: d.currency, contestSubunits, odds: oddsAdj.odds }, rates);
  const miss = useMemo(() => {
    const input = { call: finalCall, action: state.action?.type, outcome: state.outcome };
    const kind = missKind(input);
    if (!kind) return null;
    const file = buildMissCase({
      ...input,
      caseId: c.id,
      reasonCode: d.reason_code,
      reasonDescription: d.reason_description,
      currency: d.currency,
      customerClaim: c.customer_claim,
      razorpayFacts: c.razorpay_facts,
      evidence: allEvidence.map((e) => ({ id: e.id, title: "title" in e ? (e as { title: string }).title : undefined, content: e.content })),
      confidence: view.confidence,
      decidingEvidence: view.decidingEvidence,
      reason: view.reason,
    });
    return file ? { kind, file } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalCall, state.action, state.outcome, view, state.added]);
  const t = timeLeft(d.respond_by_hours_left);
  const showResponse = finalCall !== "shield" && !state.action && !!state.reviewOpen;
  const acted = state.action;
  const checkTheMoney = finalCall === "fight" && !money.worthFighting;

  // Keep the Results page in step with what the merchant did here (Fold is final; a submit waits for Won or Lost).
  useEffect(() => {
    if (!ready) return;
    const a = state.action;
    if (!a || finalCall === "shield") {
      removeLedger(c.id);
      return;
    }
    upsertLedger(
      fromAction({
        id: c.id,
        code: d.reason_code,
        atStakeInr: money.atStakeInr,
        contestInr: money.contestInr,
        call: finalCall,
        confidence: view.confidence,
        actionType: a.type,
        outcome: state.outcome ?? null,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.action, state.outcome]);

  useEffect(() => {
    track("dispute_opened", c.id);
  }, [c.id]);

  // A Deadline rescue message links here with ?review=1: open the response for review (the merchant still has to approve it).
  useEffect(() => {
    if (!ready) return;
    try {
      if (new URLSearchParams(window.location.search).get("review") !== "1") return;
    } catch {
      return;
    }
    if (finalCall !== "fight" || state.action) return;
    if (!state.reviewOpen) update((s) => ({ ...s, reviewOpen: true }));
    setTimeout(() => document.getElementById("response")?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const goToBankTest = () => setTimeout(() => document.getElementById("rebuttal")?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
  const log = (actor: "You" | "Advisor", text: string) =>
    update((s) => ({ ...s, audit: [...s.audit, { at: now(), actor, text }] }));

  /** A short name for a document: the added title, or the first phrase of its text. */
  const docName = (id: string) => {
    const e = allEvidence.find((x) => x.id === id);
    if (!e) return "";
    const title = "title" in e ? (e as { title: string }).title : "";
    const first = e.content.split(/[:.]/)[0].trim();
    const name = title || first;
    return name.length > 48 ? name.slice(0, 45).trimEnd() + "…" : name;
  };
  const focusEvidence = (ids: string[]) => {
    setHighlight(ids);
    showRow("evidence");
    setTimeout(() => document.getElementById(`ev-${ids[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
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

  const readFile = async (file: File | undefined) => {
    if (file) track("upload");
    if (!file) return;
    setAddError("");
    setReadNote("");
    if (!FILE_TYPES.includes(file.type as (typeof FILE_TYPES)[number])) return setAddError("Use a PDF, PNG, JPEG or WebP file.");
    if (file.size > MAX_FILE_BYTES) return setAddError(`Keep the file under ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
    setReading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
        r.onerror = () => reject(new Error("read"));
        r.readAsDataURL(file);
      });
      const res = await fetch("/api/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: file.name, mediaType: file.type, data }) });
      const r = (await res.json()) as { status: string; title?: string; text?: string; truncated?: boolean; message?: string };
      if (r.status === "ok") {
        setNewTitle((t) => (!t.trim() || t === autoTitle ? (r.title ?? "") : t));
        setAutoTitle(r.title ?? "");
        setNewText(r.text ?? "");
        setReadNote(`Read from ${file.name}.${r.truncated ? ` It was long, so only the first ${MAX_EVIDENCE_CHARS.toLocaleString()} characters are kept.` : ""} Check the text before you add it.`);
      } else {
        setAddError(r.message ?? "We couldn't read the file. Paste the text instead.");
      }
    } catch {
      setAddError("We couldn't read the file. Paste the text instead.");
    } finally {
      setReading(false);
    }
  };

  const addEvidence = () => {
    const title = newTitle.trim();
    const content = newText.trim();
    setReadNote("");
    if (!title || !content) return setAddError("Give the document a title and some text.");
    if (title.length > MAX_TITLE_CHARS || content.length > MAX_EVIDENCE_CHARS) return setAddError(`Keep the title under ${MAX_TITLE_CHARS} and the text under ${MAX_EVIDENCE_CHARS.toLocaleString()} characters.`);
    if (containsCardNumber(title) || containsCardNumber(content)) return setAddError("Remove the card number and try again.");
    if ((state.added ?? []).length >= 5) return setAddError("Add at most 5 documents.");
    const id = `E${allEvidence.length + 1}`;
    const next = [...(state.added ?? []), { id, title, content }];
    update((s) => ({
      ...s,
      added: [...(s.added ?? []), { id, title, content }],
      dirty: true,
      rebuttal: undefined,
      audit: [...s.audit, { at: now(), actor: "You", text: `Added evidence ${id}: ${title}` }],
    }));
    setNewTitle("");
    setNewText("");
    setAddError("");
    setAdding(false);
    // Check again on its own: the merchant added the document to see what it changes.
    void rerun(next);
  };
  const removeEvidence = (id: string) => {
    const next = (state.added ?? []).filter((a) => a.id !== id).map((a, i) => ({ ...a, id: `E${c.evidence.length + i + 1}` }));
    update((s) => ({
      ...s,
      // Re-number so IDs stay E1...En in order; the server numbers them the same way.
      added: (s.added ?? []).filter((a) => a.id !== id).map((a, i) => ({ ...a, id: `E${c.evidence.length + i + 1}` })),
      dirty: true,
      rebuttal: undefined,
      audit: [...s.audit, { at: now(), actor: "You", text: `Removed evidence ${id}` }],
    }));
    void rerun(next);
  };

  const steps = [`Reading ${allEvidence.length} documents…`, `Applying Visa rule ${d.reason_code}…`, "Writing the response…"];
  const rerun = async (list?: { id: string; title: string; content: string }[]) => {
    track("rerun");
    const sendAdded = list ?? state.added ?? [];
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
        body: JSON.stringify({ caseId: c.id, added: sendAdded.map((a) => ({ title: a.title, content: a.content })), policy: profile.policy.trim() ? { text: profile.policy, acceptance: profile.acceptance } : undefined }),
      });
      const r = (await res.json()) as AnalyzeResult;
      if (r.status === "live") {
        update((s) => ({
          ...s,
          check: { view: r.view, meta: r.meta },
          prevCall: finalCall,
          dirty: false,
          draft: undefined,
          rebuttal: undefined,
          contestAmount: undefined,
          reviewOpen: false,
          audit: [...s.audit, { at: now(), actor: "Advisor", text: `Live check: ${r.view.call}${r.meta.cached ? " (from cache)" : ""}` }],
        }));
        // Take the merchant to the new answer; the evidence list they were just working in is far below it.
        setTimeout(() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 150);
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
    track(type === "submit" ? "submit" : "fold");
    setDialog(null);
    setWhy("");
  };

  const sentences = splitSentences(draft);
  const blockers = g.submitBlockers;

  // Clear win (F7): a confident Fight whose response leans on Razorpay's own record, with nothing missing or contradicted.
  const clearWin =
    !acted &&
    finalCall === "fight" &&
    view.confidence.toLowerCase() === "high" &&
    view.missingEvidence.length === 0 &&
    view.contradictions.length === 0 &&
    blockers.length === 0 &&
    citedIds(draft).includes("Razorpay");

  // "How can I help you next?" Each option does something real on this dispute. Fewer than three is fine.
  const goTo = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 140);
  const openReview = () => {
    update((s) => ({ ...s, reviewOpen: true }));
    goTo("response");
  };
  const openAdd = () => {
    showRow("evidence");
    setAdding(true);
    goTo("ev-title");
  };

  const HEAD: Record<typeof finalCall, string> = {
    fight: "Fight this dispute",
    fold: "Fold: accept this dispute",
    escalate: "Get one document before you decide",
    shield: "Fraud dispute: Chargeback Shield handles it",
  };
  const EDGE: Record<typeof finalCall, string> = { fight: "border-l-fight", fold: "border-l-fold", escalate: "border-l-escalate", shield: "border-l-shield" };
  const passed = g.lines.filter((l) => l.status === "pass").length;
  const keyDocs = finalCall !== "shield" ? checklistFor(d.reason_code, documentsBySlot) : null;

  return (
    <>
      <div className="mx-auto max-w-[820px]">
      <div className="flex items-center justify-between">
        <Link href="/disputes" className="relative mb-2.5 inline-block font-semibold text-brand after:absolute after:-inset-y-3 after:-inset-x-2 after:content-['']">
          ← All disputes
        </Link>
        <button type="button" onClick={() => window.print()} className="mb-2.5 ml-auto mr-3 min-h-10 text-[12px] font-semibold text-helper underline print:hidden md:min-h-0">
          Print or save as PDF
        </button>
        {(state.action || state.audit.length > 0 || state.draft !== undefined) && (
          <button onClick={reset} className="mb-2.5 text-[12px] font-semibold text-helper underline">
            Reset this demo
          </button>
        )}
      </div>


        <header className="mb-5">
          <p className="text-[12px] text-helper">{c.merchant}</p>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
            <h1 className="text-2xl leading-8 font-semibold">
              {formatOriginal(d.amount, d.currency)} · {d.network} {d.reason_code} {d.reason_description}
            </h1>
            {finalCall === "shield" && (
              <p className={`text-[14px] font-semibold ${t.warn ? "text-warn" : "text-ink-soft"}`}>
              {t.warn && <span aria-hidden>⚠ </span>}
              {t.text} <span className="font-normal text-helper">left to respond</span>
            </p>
            )}
          </div>
          <p className="mt-1 text-[14px] text-[#444]">
            The customer says: &ldquo;{c.customer_claim}&rdquo; <span className="font-mono text-[12px] text-helper">{d.id}</span>
          </p>
          {acted && <p className="mt-1 text-[12px] font-semibold text-green-ink">{acted.type === "submit" ? "Contested (simulated)" : "Folded (simulated)"}</p>}
          {d.respond_by_hours_left < 6 && !acted && (
            <p className="mt-3 rounded-[10px] bg-escalate-soft px-3 py-2 font-semibold text-escalate">Respond now. Less than 6 hours left.</p>
          )}
        </header>

        {state.prevCall && state.prevCall !== finalCall && state.check && (
            <div id="call-changed" className="pop-in mb-4 overflow-hidden rounded-2xl border border-brand bg-[#F4F8FF]" role="status">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3.5">
                <span className="flex flex-wrap items-center gap-2.5">
                  <b className="text-[12px] font-semibold tracking-[.6px] text-brand uppercase">The call changed</b>
                  <span className="flex items-center gap-2" aria-label={`${CALL_NAME[state.prevCall]} to ${CALL_NAME[finalCall]}`}>
                    <span className="opacity-60"><CallChip call={state.prevCall} /></span>
                    <span aria-hidden className="text-[16px] font-semibold text-brand">→</span>
                    <CallChip call={finalCall} size="lg" />
                  </span>
                </span>
                <span className="flex gap-2">
                  {view.decidingEvidence.some((id) => (state.added ?? []).some((a) => a.id === id)) && (
                    <button className={ghost} onClick={() => focusEvidence(view.decidingEvidence.filter((id) => (state.added ?? []).some((a) => a.id === id)))}>
                      Show the document
                    </button>
                  )}
                  <button className={ghost} onClick={() => update((s) => ({ ...s, prevCall: undefined }))}>
                    Dismiss
                  </button>
                </span>
              </div>
              <p className="px-4 pt-2 pb-3.5 text-[14px] text-[#333]">
                {(() => {
                  const addedIds = (state.added ?? []).map((a) => a.id);
                  const decided = view.decidingEvidence.filter((id) => addedIds.includes(id));
                  if (decided.length > 0) return `The new document ${decided.join(", ")} decided it.`;
                  return addedIds.length > 0 ? "Your new evidence changed the answer." : "The AI gave a different answer on this re-run. You added no new evidence.";
                })()}
              </p>
            </div>
          )}
          {clearWin && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-fight bg-fight-soft px-4 py-3" role="status">
              <span>
                <b className="block text-fight">✓ Clear win</b>
                <span className="text-[14px] text-[#333]">Razorpay&apos;s own record backs this response and nothing is missing. You still approve it.</span>
              </span>
              <button className={primary} onClick={() => goTo("response")}>
                Review and submit
              </button>
            </div>
          )}
          {notice && (
            <p role="status" className={`mb-4 rounded-2xl px-4 py-3 font-semibold ${notice.kind === "error" ? "bg-escalate-soft text-escalate" : "bg-shield-soft text-shield"}`}>
              {notice.text}
            </p>
          )}

        <section id="decision" aria-label="The advisor's call" className={`mb-5 rounded-2xl border border-line border-l-4 bg-white p-4 md:p-6 ${EDGE[finalCall]} ${state.prevCall && state.prevCall !== finalCall && !running ? "flash-ring" : ""} ${running ? "opacity-60" : state.dirty && !acted ? "opacity-75" : ""}`}>
          <div id="verdict" className="flex flex-wrap items-center gap-3">
            <CallChip call={finalCall} size="lg" />
            {finalCall !== "shield" && <span className="text-[14px] font-semibold text-[#555]">{view.confidence} confidence</span>}
            {state.dirty && !acted && <span className="rounded-full bg-fold-soft px-2.5 py-0.5 text-[12px] font-semibold text-fold">⚠ Out of date: re-run the check</span>}
            {finalCall !== "shield" && <span className="ml-auto hidden text-[12px] font-semibold tracking-[.6px] text-helper uppercase sm:inline">Fold-or-Fight check</span>}
          </div>
          <h2 className="mt-3 text-2xl leading-8 font-semibold md:text-[28px] md:leading-9">{HEAD[finalCall]}</h2>
          {g.changedReason && finalCall !== "shield" && (
            <p className="mt-2 rounded-[10px] bg-fold-soft px-3 py-1.5 text-[12px] font-semibold text-fold">Changed by safety rule: {g.changedReason}</p>
          )}

          {finalCall === "shield" ? (
            <p className="mt-2 text-[16px] leading-7 text-[#333]">Reason code {d.reason_code} is a fraud code. Dispute Advisor only covers non-fraud disputes, so no check was run and there is nothing to submit here.</p>
          ) : (
            <>
              <p className="mt-2 text-[16px] leading-7 text-[#222]">{view.reason}</p>

              <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-line py-4">
                <div>
                  <dt className="text-[12px] text-helper">At stake</dt>
                  <dd className="text-[16px] font-semibold sm:text-[24px]">{formatInrFull(money.atStakeInr)}</dd>
                  <dd className="text-[12px] text-helper">{formatOriginal(d.amount, d.currency)}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-helper">{oddsAdj.adjusted ? "Chance to win (your record)" : "Chance to win"}</dt>
                  <dd className="text-[16px] font-semibold sm:text-[24px]">{Math.round(oddsAdj.odds * 100)}%</dd>
                  <dd className="text-[12px] text-helper">an estimate</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-helper">Time left</dt>
                  <dd className={`text-[16px] font-semibold sm:text-[24px] ${t.warn ? "text-warn" : ""}`}>{t.text}</dd>
                  <dd className="text-[12px] text-helper">to respond</dd>
                </div>
              </dl>
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
                    return <p className={`mt-4 inline-block rounded-[10px] px-3 py-2 font-semibold ${agrees ? "bg-fight-soft text-green-ink" : "bg-fold-soft text-fold"}`}>{text}</p>;
                  })()
                ) : null}
                {(checkTheMoney || (finalCall === "fold" && money.worthFighting)) && <p className="mt-1 text-[12px] text-helper">The call stays {finalCall === "fight" ? "Fight" : "Fold"}. This is a note, not a change.</p>}

              {(view.missingEvidence.length > 0 || view.contradictions.length > 0) && finalCall !== "escalate" && (
                <p className="mt-3 text-[14px]">
                  {view.missingEvidence.length > 0 && (<><span className="text-helper">Missing: </span>{view.missingEvidence.join("; ")} </>)}
                  {view.contradictions.length > 0 && (<><span className="text-helper">Contradictions: </span>{view.contradictions.join("; ")}</>)}
                </p>
              )}

              {finalCall === "escalate" && !acted && (
                <div id="get-first" className="mt-4 rounded-xl bg-[#FFF8E6] p-4">
                  <p className="text-[12px] font-semibold tracking-[.6px] text-fold uppercase">Get this first</p>
                  <p className="mt-1 text-[16px] font-semibold">{view.getFirst ?? "More evidence is needed before you can decide."}</p>
                  {view.requestText && (
                    <div className="mt-3">
                      <p className="text-[12px] font-semibold text-helper">Message to send</p>
                      <p className="mt-1 rounded-xl bg-white p-3 text-[14px]">{view.requestText}</p>
                    </div>
                  )}
                  <div className="mt-3 space-y-1.5 border-t border-[#F0E3BE] pt-3 text-[14px]">
                    {view.defensibleAmount !== null && (
                      <p className="text-[#555]">Only part is worth contesting: {formatOriginal(view.defensibleAmount, d.currency)} ({formatInrFull(money.contestInr)}).</p>
                    )}
                    {(() => {
                      const ceiling = worthFindingCeiling(money.contestInr, oddsAdj.odds);
                      return (
                        <p data-testid="worth-finding">
                          <b>Worth finding?</b> Up to {formatInrFull(ceiling)} more is still at risk at today&apos;s {Math.round(oddsAdj.odds * 100)}% odds, out of the {formatInrFull(money.contestInr)} you could contest.{" "}
                          {ceiling > DEFAULT_EFFORT_COST_INR ? `More than the ${formatInrFull(DEFAULT_EFFORT_COST_INR)} effort cost we assume, so it is worth asking.` : `Less than the ${formatInrFull(DEFAULT_EFFORT_COST_INR)} effort cost we assume, so chasing it may not pay.`}{" "}
                          <span className="text-helper">A ceiling, not a forecast.</span>
                        </p>
                      );
                    })()}
                    <p>
                      {d.respond_by_hours_left < 6
                        ? "No time to gather more: choose Fight or Fold."
                        : `You have ${t.text}. If you can't get it, choose Fight${view.defensibleAmount !== null ? " for the part worth contesting" : ""} or Fold.`}
                    </p>
                    {view.draft && <p className="text-[12px] text-helper">A draft contest is ready from what you have now. Find it under Fight anyway.</p>}
                  </div>
                </div>
              )}

              {!acted && (
                <div id="primary-action" className="mt-5 flex flex-wrap items-center gap-2.5">
                  {finalCall === "fight" && (
                    <>
                      <button className={primary} onClick={() => update((s) => ({ ...s, reviewOpen: true }))} aria-expanded={showResponse}>Review response</button>
                      <button className={ghost} onClick={() => setDialog("fold")}>Fold</button>
                      <button type="button" data-testid="test-bank-link" className="min-h-11 px-2 text-sm font-semibold text-brand hover:underline" onClick={() => { update((s) => ({ ...s, reviewOpen: true })); goToBankTest(); }}>
                        Test it on the bank first
                      </button>
                    </>
                  )}
                  {finalCall === "fold" && (
                    <>
                      <button className={primary} onClick={() => setDialog("fold")}>Fold</button>
                      <button className={ghost} onClick={() => update((s) => ({ ...s, reviewOpen: true }))}>Fight instead</button>
                    </>
                  )}
                  {finalCall === "escalate" && (
                    <>
                      {view.requestText ? (
                        <button className={primary} onClick={() => copy("request", view.requestText ?? "")}>{copied === "request" ? "Copied" : "Copy the message"}</button>
                      ) : (
                        <button className={primary} onClick={openAdd}>Add the document</button>
                      )}
                      {view.requestText && <button className={ghost} onClick={openAdd}>Add the document</button>}
                      <button className={ghost} onClick={() => update((s) => ({ ...s, reviewOpen: true }))}>Fight anyway</button>
                      <button className={ghost} onClick={() => setDialog("fold")}>Fold</button>
                    </>
                  )}
                </div>
              )}

              {view.decidingEvidence.length > 0 && (
                <p className="mt-5 text-[14px] text-[#555]">
                  <span className="text-helper">Based on </span>
                  {view.decidingEvidence.map((e) => (
                    <button key={e} onClick={() => focusEvidence([e])} className="relative mr-3 inline-flex min-h-6 items-center gap-1.5 rounded-md text-left hover:underline after:absolute after:-inset-2 after:content-['']" aria-label={`Show ${e}`}>
                      <span className="rounded bg-brand-soft px-1.5 text-[12px] font-semibold text-[#2B5BC8]">{e}</span>
                      <span>{docName(e)}</span>
                    </button>
                  ))}
                </p>
              )}
            </>
          )}

          {running && (
            <div className="mt-3" role="status" aria-live="polite">
              <p className="text-[14px] font-semibold text-brand">{steps[step]}</p>
              <p className="mt-0.5 text-[12px] text-helper" data-testid="wait-note">Connecting to the AI model. On this demo it can take up to a minute. If it cannot answer, you will see the saved result.</p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[12px] text-helper">
            <span data-tour="source-label" className="flex flex-wrap items-center gap-2">
              {!view.source.live && <span className="rounded-full bg-fold-soft px-2.5 py-0.5 text-[12px] font-semibold text-fold">Prepared in advance</span>}
              {view.source.label}
            </span>
            <span className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <span>Was this call useful?</span>
              <button
                aria-label="Thumbs up"
                aria-pressed={state.thumbs === "up"}
                className={`min-h-11 min-w-11 rounded-[10px] border text-[16px] ${state.thumbs === "up" ? "border-brand bg-brand-soft" : "border-[#D6D6D6]"}`}
                onClick={() => { update((s) => ({ ...s, thumbs: "up" })); log("You", "Marked the call useful"); }}
              >👍</button>
              <button
                aria-label="Thumbs down"
                aria-pressed={state.thumbs === "down"}
                className={`min-h-11 min-w-11 rounded-[10px] border text-[16px] ${state.thumbs === "down" ? "border-brand bg-brand-soft" : "border-[#D6D6D6]"}`}
                onClick={() => { update((s) => ({ ...s, thumbs: "down" })); log("You", "Marked the call not useful"); }}
              >👎</button>
              {finalCall !== "shield" && !acted && (
                <button className={`${view.source.live ? ghost : primary} whitespace-nowrap`} onClick={() => void rerun()} disabled={running}>{view.source.live ? "Re-run check" : "Run live check"}</button>
              )}
              <button onClick={() => setDrawer(true)} className="relative font-semibold text-brand after:absolute after:-inset-y-3 after:-inset-x-2 after:content-['']">Under the hood ›</button>
            </span>
          </div>
        </section>

        {showResponse && (
        <Card id="response">
          <h2 className="mb-1 text-[16px] font-semibold">Review your response</h2>
          <p className="mb-3 text-[12px] text-helper">Every sentence needs a source. You can edit anything. Nothing is sent until you approve.</p>
          {state.dirty && (
            <p className="mb-3 rounded-xl bg-fold-soft px-3 py-2 text-[14px] font-semibold text-fold">You added or removed evidence after the last check. Re-run it before you submit.</p>
          )}
          {finalCall === "escalate" && (
            <p className="mb-3 rounded-xl bg-[#FFF8E6] px-3 py-2 text-[14px] text-fold">
              {view.draft ? "This draft uses only the documents you have now. Add the missing one and re-run the check before you rely on it." : "No draft yet. Write your own from the documents you have, or add the missing one and re-run the check."}
            </p>
          )}

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
            className="mt-1 w-full rounded-xl border border-line p-3 text-[14px] leading-[1.6] focus:border-brand-focus focus:outline-none"
            aria-describedby="draft-help"
          />
          <div id="draft-help" className="mt-1 flex justify-between text-[12px]">
            <span className="text-helper">Use [E1] style tags to cite a document, or [Razorpay] for Razorpay's records.</span>
            <span className={draft.trim().length > DRAFT_LIMIT ? "font-semibold text-escalate" : "text-helper"}>
              {draft.trim().length} / {DRAFT_LIMIT}
            </span>
          </div>
          {draft.trim().length > DRAFT_LIMIT && !acted && (
            <ShortenBox
              caseId={c.id}
              added={(state.added ?? []).map((a) => ({ title: a.title, content: a.content }))}
              draft={draft}
              onUse={(nd, how) => {
                update((s) => ({ ...s, draft: nd }));
                log("You", how === "ai" ? "Used the AI's shorter version of the draft" : "Used a shorter version made by dropping the last sentences");
              }}
            />
          )}

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
                          <button key={id} onClick={() => id !== "Razorpay" && focusEvidence([id])} className="relative mr-1 inline-flex min-h-8 min-w-8 items-center justify-center rounded-md bg-brand-soft px-1.5 text-[12px] font-semibold text-[#2B5BC8] after:absolute after:-inset-1 after:content-['']">
                            {id}
                          </button>
                        ))
                      ) : (
                        <span className="text-[12px] font-semibold text-escalate">Add a source or remove this sentence</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <RebuttalPanel
            caseId={c.id}
            added={(state.added ?? []).map((a) => ({ title: a.title, content: a.content }))}
            draft={draft}
            result={state.rebuttal}
            onResult={(v) => update((s) => ({ ...s, rebuttal: v }))}
            onApply={(nd) => update((s) => ({ ...s, draft: nd }))}
            onAddDocument={openAdd}
            onFocusEvidence={focusEvidence}
            onLog={(text) => log("You", text)}
          />

          <H3>Documents by slot</H3>
          {documentsBySlot.size === 0 ? (
            <p className="text-[14px] text-escalate">No documents attached. Razorpay needs at least one to submit.</p>
          ) : (
            <ul className="text-[14px]">
              {[...documentsBySlot].map(([slot, ids]) => (
                <li key={slot} className="mb-1.5">
                  <span className="rounded-md bg-[#F6F6F6] px-[7px] py-0.5 font-mono text-[12px]">{slot}</span>
                  {ids.map((id) => (
                    <button key={id} onClick={() => focusEvidence([id])} className="relative ml-2 inline-flex min-h-6 items-center gap-1.5 rounded-md text-left hover:underline after:absolute after:-inset-2 after:content-['']">
                      <span className="rounded bg-brand-soft px-1.5 text-[12px] font-semibold text-[#2B5BC8]">{id}</span>
                      <span className="text-[#333]">{docName(id)}</span>
                    </button>
                  ))}
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
            <span className="text-[12px] text-helper">of {formatOriginal(d.amount, d.currency)}</span>
          </div>
          <p className="mt-1 text-[12px] text-helper">
            {view.defensibleAmount !== null ? "Pre-filled with the part the check found defensible. " : "Full amount by default. "}You can contest a smaller part.
          </p>

          {blockers.length > 0 && (
            <p className="mt-4 rounded-[10px] bg-escalate-soft px-3 py-2 text-[14px] text-escalate" role="status">
              <span className="font-semibold">You can't submit yet:</span> {blockers.join(". ")}.
            </p>
          )}

          {(() => {
            const rb = state.rebuttal;
            const fresh = !!rb && sameDraft(draft, rb.forDraft);
            return (
              <p className="mt-4 rounded-[10px] bg-[#F4F8FF] px-3 py-2 text-[14px]" data-testid="rebuttal-hint">
                {!rb ? (
                  <>Not tested on the bank yet. <button type="button" className="font-semibold text-brand hover:underline" onClick={goToBankTest}>Test it first</button></>
                ) : fresh ? (
                  <>Tested on the bank: <b>{VERDICT_LABEL[rb.verdict]}</b>.</>
                ) : (
                  <>You changed the response since the last bank test. <button type="button" className="font-semibold text-brand hover:underline" onClick={goToBankTest}>Test again</button></>
                )}
              </p>
            );
          })()}

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button className={primary} disabled={blockers.length > 0} onClick={() => setDialog("submit")} title={blockers.length ? blockers.join(". ") : undefined}>
              Approve and submit
            </button>
            <button className={ghost} onClick={() => update((s) => ({ ...s, reviewOpen: false }))}>
              Close
            </button>
            <button className={`${ghost} !border-brand !text-brand ml-auto`} onClick={() => copy("draft", draft)}>
              {copied === "draft" ? "Copied" : "Copy response"}
            </button>
            <p className="w-full text-[12px] text-helper">Simulated: nothing is sent to Razorpay.</p>
          </div>
        </Card>
      )}

        {acted && (
        <Card>
          <h2 className="mb-1 text-[16px] font-semibold">{acted.type === "submit" ? "Response submitted (simulated)" : "Dispute folded (simulated)"}</h2>
          <p className="mb-2 text-[12px] font-semibold text-helper">Simulated: nothing was sent to Razorpay.</p>
          <p className="text-[14px]">
            {acted.type === "submit"
              ? `You contested ${formatOriginal(contestSubunits, d.currency)} of ${formatOriginal(d.amount, d.currency)} with ${[...documentsBySlot.values()].flat().length} documents. In the real app this goes to Razorpay and the bank decides. The status below then moves from Under review to Won or Lost.`
              : `You accepted the dispute. ${formatInrFull(money.atStakeInr)} would be taken from your balance (${formatOriginal(d.amount, d.currency)} at the ${rateWord(rates)} of ₹${rateFor(d.currency, rates).toFixed(2)}).`}
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-[14px] font-semibold text-brand">What would be sent</summary>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-[#0F172A] p-4 text-[12px] leading-[1.6] break-words whitespace-pre-wrap text-[#E2E8F0]">{acted.request}</pre>
          </details>

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
              <span className="text-[12px] text-helper">Demo: set the outcome</span>
              {(["won", "lost"] as const).map((o) => (
                <button
                  key={o}
                  className={ghost}
                  aria-pressed={state.outcome === o}
                  onClick={() => {
                    update((s) => ({ ...s, outcome: o }));
                    track(o === "won" ? "outcome_won" : "outcome_lost");
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
              <p className="text-[14px]">
                Reason {d.reason_code}
                {documentsBySlot.size > 0 && <> with {[...documentsBySlot.keys()].join(" + ")}</>}: <b>{state.outcome}</b>. In the real product this feeds the odds for the next dispute like this one.
              </p>
              {miss && (
                <div className="mt-3 rounded-xl border border-line bg-[#F7F8FA] px-3.5 py-3 text-[14px]" data-testid="miss-case">
                  <b>{miss.kind === "wrong_fight" ? "The advisor said Fight and it was lost." : "The advisor said Fold and you won."}</b> That is the kind of case an eval set needs.
                  In the real product it would be queued for review. Here you can download it as a candidate case: names, emails and long numbers are masked, and the proposed answer ({miss.file.proposed_label}) must be confirmed by a person before it is added.
                  <div className="mt-2">
                    <button
                      className={ghost}
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(miss.file, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `eval-candidate-${c.id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        log("You", "Downloaded this dispute as an eval candidate (demo)");
                      }}
                    >
                      Download as eval case
                    </button>
                  </div>
                </div>
              )}
              {view.tip && (
                <>
                  <H3>Next time</H3>
                  <p className="text-[14px]">{view.tip}</p>
                </>
              )}
              {state.outcome === "lost" && (
                <>
                  <H3>Next steps</H3>
                  <p className="text-[12px] text-helper">Things to confirm, not advice.</p>
                  <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-[14px]">
                    <li>Ask your bank about reducing the export value recorded for this payment. Razorpay can supply the dispute documents.</li>
                    <li>Ask your accountant whether a GST credit note applies.</li>
                  </ol>
                </>
              )}
            </>
          )}
        </Card>
      )}

        <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-white" aria-label="More detail">
          <Row id="evidence" title="Your evidence" summary={`${allEvidence.length} documents${keyDocs ? ` · ${keyDocs.keyCovered} of ${keyDocs.keyTotal} key documents for ${d.reason_code} in place` : ""}${state.dirty && !acted ? " · changed since the last check" : ""}`} open={!!openRows.evidence} onToggle={() => toggleRow("evidence")}
              badge={keyDocs ? { text: `${keyDocs.keyCovered} of ${keyDocs.keyTotal} key`, tone: keyDocs.keyCovered >= keyDocs.keyTotal ? "ok" : "warn" } : undefined}>
            <>
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
                  <div className="flex h-[26px] items-center justify-center rounded-lg bg-shield-soft text-[12px] font-semibold">{e.id}</div>
                  <div>
                    {addedItem && (
                      <p className="text-[12px] font-semibold text-helper">
                        Added by you · {(e as { title: string }).title}
                        {state.prevCall && state.prevCall !== finalCall && view.decidingEvidence.includes(e.id) && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-brand">Decided the call</span>}
                      </p>
                    )}
                    <p className="text-sm text-[#555]">{e.content}</p>
                    {keyFactsShown && <KeyFactLines docs={keyFactsShown.docs} id={e.id} />}
                    {slots.map((s) => (
                      <span key={s.slot} className="mt-1.5 mr-1 inline-block rounded-md bg-[#F6F6F6] px-[7px] py-0.5 font-mono text-[12px] text-[#555]">
                        {s.slot}
                      </span>
                    ))}
                    {flags.map((f) => (
                      <span key={f.flag} className="mt-1.5 mr-1 inline-block rounded-md bg-fold-soft px-[7px] py-0.5 text-[12px] font-semibold text-fold">
                        {f.flag === "instruction_like" ? "⚠ Looks like instructions" : f.flag === "unreadable" ? "⚠ Couldn't read" : "⚠ Contradiction"}
                      </span>
                    ))}
                    {addedItem && !acted && (
                      <button onClick={() => removeEvidence(e.id)} className="relative after:absolute after:-inset-2 after:content-['']  mt-1.5 block min-h-6 text-[12px] font-semibold text-escalate underline">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {finalCall !== "shield" && (
              <EvidenceChecklist code={d.reason_code} documentsBySlot={documentsBySlot} stale={!!state.dirty && !acted} docName={docName} />
            )}
            {finalCall !== "shield" && (
              <KeyFactsButton
                caseId={c.id}
                added={(state.added ?? []).map((a) => ({ title: a.title, content: a.content }))}
                result={keyFactsShown ? state.keyFacts?.result : undefined}
                onResult={(r) => {
                  update((s) => ({ ...s, keyFacts: { sig: evidenceSig, result: r } }));
                  log("Advisor", r.status === "live" ? "Read key facts from the documents" : "Showed saved key facts");
                }}
              />
            )}
            {!acted && !adding && finalCall !== "shield" && (
              <button className={`${ghost} mt-3 !border-brand !text-brand`} onClick={() => setAdding(true)}>
                + Add evidence
              </button>
            )}
            {state.dirty && !acted && !adding && (
              <div className="mt-3 rounded-xl border border-brand bg-[#F4F8FF] p-3" role="status">
                <p className="text-[14px] font-semibold">Your evidence changed.</p>
                <p className="text-[12px] text-[#555]">Re-run the check to see if it changes the call.</p>
                <button className={`${primary} mt-2`} onClick={() => void rerun()} disabled={running}>
                  {running ? "Checking…" : "Re-run check"}
                </button>
              </div>
            )}
            {adding && (
              <div className="mt-3 rounded-xl border border-line p-3">
                {(evidenceHint(d.reason_code) || view.missingEvidence.length > 0) && (
                  <div className="mb-3 rounded-xl bg-[#F4F8FF] px-3 py-2 text-[12px] text-[#333]">
                    {view.missingEvidence.length > 0 && finalCall === "escalate" && (
                      <p>
                        <b>The advisor asked for:</b> {view.getFirst ?? view.missingEvidence.join("; ")}
                      </p>
                    )}
                    {evidenceHint(d.reason_code) && (
                      <p>
                        <b>What helps for {d.reason_code}:</b> {evidenceHint(d.reason_code)}
                      </p>
                    )}
                  </div>
                )}
                <input id="ev-file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" disabled={reading} onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} className="peer sr-only" aria-describedby="ev-file-help" />
                <label htmlFor="ev-file" className={`${ghost} cursor-pointer !border-brand !text-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand peer-disabled:opacity-50`}>
                  {reading ? "Reading…" : "Upload a PDF or image"}
                </label>
                <p id="ev-file-help" className="mt-1 text-[12px] text-helper" role="status">{reading ? "Reading the file…" : readNote || "Up to 3 MB. We read it into text for you to check. Or paste the text below."}</p>
                <label htmlFor="ev-title" className="mt-3 block text-sm font-semibold">
                  Title
                </label>
                <input id="ev-title" value={newTitle} maxLength={MAX_TITLE_CHARS + 20} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Billing audit log" className="mt-1 w-full rounded-[10px] border border-line px-3 py-2 focus:border-brand-focus focus:outline-none" />
                <label htmlFor="ev-text" className="mt-3 block text-sm font-semibold">
                  What it says
                </label>
                <textarea id="ev-text" rows={4} value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Paste the text of the document." className="mt-1 w-full rounded-xl border border-line p-3 text-[14px] focus:border-brand-focus focus:outline-none" aria-describedby="ev-help" />
                <div id="ev-help" className="mt-1 flex justify-between text-[12px]">
                  <span className="text-helper">Made-up or masked text only. No card numbers.</span>
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

            </>
          </Row>
          {timeline.length >= 3 && (
            <Row id="timeline" title="Timeline from your documents" summary={`${timeline.length} dates, in order. Click a tag to jump to its document.`} open={!!openRows.timeline} onToggle={() => toggleRow("timeline")}>
              <ol className="relative ml-1.5 border-l border-line pl-4">
                {timeline.map((ev, i) => {
                  const prevEv = timeline[i - 1];
                  const gap = prevEv ? daysBetween(prevEv.iso, ev.iso) : 0;
                  const isDispute = ev.evidenceId === null;
                  return (
                    <li key={`${ev.iso}-${ev.evidenceId ?? "d"}-${i}`} className="relative pb-3 last:pb-0">
                      <span aria-hidden className={`absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full border-2 border-white ${isDispute ? "bg-escalate" : "bg-brand"}`} />
                      <p className="text-[12px] font-semibold">
                        {ev.label}
                        {i > 0 && gap > 0 && <span className="ml-2 font-normal text-helper">+{gap} day{gap === 1 ? "" : "s"}</span>}
                      </p>
                      <p className="text-[12px] text-[#555]">
                        {ev.evidenceId ? (
                          <>
                            <button type="button" onClick={() => focusEvidence([ev.evidenceId as string])} className="mr-1.5 inline-flex min-h-10 min-w-10 items-center justify-center rounded-md bg-shield-soft px-1.5 text-[12px] font-semibold text-brand hover:underline md:min-h-6 md:min-w-0 md:py-0.5">
                              {ev.evidenceId}
                            </button>
                            {ev.text}
                          </>
                        ) : (
                          <b>{ev.text}</b>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </Row>
          )}
          {finalCall !== "shield" && (
            <Row id="money" title="The money" summary={`If you lose: ${formatInrFull(money.atStakeInr)} back, plus a possible fee of ${formatInrFull(money.feesAtRiskInr)}`} open={!!openRows.money} onToggle={() => toggleRow("money")}>
              <div className="mt-1">
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                  <Stat label="At stake" value={formatInrFull(money.atStakeInr)} sub={`${formatOriginal(d.amount, d.currency)} · ${rateWord(rates)} ₹${rateFor(d.currency, rates).toFixed(2)}`} />
                  <Stat label="Taken back if you lose" value={formatInrFull(money.atStakeInr)} sub={`at today's ${rateWord(rates)}`} />
                  <Stat label="Possible fee if you fight and lose" value={formatInrFull(money.feesAtRiskInr)} sub={`Visa arbitration, USD ${VISA_ARBITRATION_FEE_USD}. Only if the bank escalates.`} />
                  <Stat
                    label={oddsAdj.adjusted ? "Odds, adjusted by your record" : "AI estimate of odds"}
                    value={`${Math.round(oddsAdj.odds * 100)}%`}
                    sub={oddsAdj.adjusted ? `AI said ${Math.round(oddsAdj.ai * 100)}%. Estimate, not a promise.` : "estimate, not a promise"}
                  />
                </div>
                {view.defensibleAmount !== null && (
                  <p className="mt-2 text-[12px] text-[#555]">
                    Only part is worth contesting: {formatOriginal(view.defensibleAmount, d.currency)} ({formatInrFull(money.contestInr)}).
                  </p>
                )}
                <p className="mt-2 text-[12px] text-helper">{view.oddsNote}</p>
                {oddsAdj.adjusted && (
                  <p className="mt-1 text-[12px] text-helper" data-testid="odds-adjusted">
                    Adjusted by your record: {oddsAdj.won} of {oddsAdj.n} fights the advisor called Fight at {view.confidence} confidence were won. The AI&apos;s estimate counts as {ODDS_PRIOR_WEIGHT} past fights, so a few results move it a little and many take over. The money check uses this number.
                  </p>
                )}
                {record.fights > 0 && (
                  <p className="mt-2 text-[14px]" data-testid="own-record">
                    <b>Your record on {d.reason_code}:</b> fought {record.fights}, won {record.won} ({Math.round((record.won / record.fights) * 100)}%). <Link href="/results" className="relative font-semibold text-brand after:absolute after:-inset-x-2 after:-inset-y-3 after:content-[''] hover:underline">See Results</Link>
                  </p>
                )}
                {view.economicsNote && <p className="mt-2 text-[14px] text-[#333]">{view.economicsNote}</p>}

              </div>
            </Row>
          )}
          <Row id="rule" title="What Visa's rule means" summary={`${d.reason_code} ${d.reason_description}`} open={!!openRows.rule} onToggle={() => toggleRow("rule")}>
            {view.ruleText && <p className="text-[14px] leading-6 text-[#444]">{view.ruleText}</p>}
            <p className="mt-3 text-[12px] font-semibold tracking-[.6px] text-helper uppercase">What Razorpay knows</p>
            <p className="mt-1 text-[14px] leading-6 text-[#444]">{c.razorpay_facts}</p>
          </Row>
        </div>
        {(vsChecklist || finalCall !== "shield") && (
          <>
            <p className="mb-2 text-[12px] font-semibold tracking-[.6px] text-helper uppercase">For reviewers: how this answer was checked</p>
            <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-white" aria-label="How this answer was checked">
          {vsChecklist && (
            <Row id="checklist" title="Why AI, not a fixed checklist?" summary={`A checklist would say ${vsChecklist.checklist === "Fight" ? "Fight" : "Fold"}${vsChecklist.agree ? ", the same" : ", which differs"}`} open={!!openRows.checklist} onToggle={() => toggleRow("checklist")}
              badge={vsChecklist.agree ? { text: "Same call", tone: "ok" } : { text: "Differs", tone: "info" }}>
              <div className="rounded-xl bg-[#F7F8FA] px-3.5 py-3 text-[14px]" data-testid="vs-checklist">
                    
                    {vsChecklist.agree ? (
                      <>
                        A fixed checklist would also say <b>{vsChecklist.checklist === "Fight" ? "Fight" : "Fold"}</b> here ({vsChecklist.basis.toLowerCase()}) The agent adds the reasons, the money check and the cited draft.
                      </>
                    ) : (
                      <>
                        A fixed checklist would say <b>{vsChecklist.checklist === "Fight" ? "Fight" : "Fold"}</b> ({vsChecklist.basis.toLowerCase()}) It only sees which documents are attached. The agent read what they say and says <b>{vsChecklist.agentWord}</b>.
                      </>
                    )}
                  </div>
            </Row>
          )}
          {finalCall !== "shield" && (
            <Row id="safety" title="Safety checks" summary={`${checksSummary(g.lines)}. These run in code on every answer.`} open={!!openRows.safety} onToggle={() => toggleRow("safety")}
              badge={{ text: checksBadge(g.lines), tone: g.lines.some((l) => l.status === "changed" || l.status === "blocked") ? "warn" : "ok" }}>
              <ul className="space-y-1.5">
                {g.lines.map((l) => (
                  <li key={l.id} className={`text-[14px] ${STATUS_CLS[l.status]}`}>
                    <span aria-hidden>{STATUS_ICON[l.status]} </span>
                    <span className="font-semibold">{l.id} · {STATUS_WORD[l.status]}:</span> <span className="text-[#333]">{l.message}</span>
                  </li>
                ))}
              </ul>
            </Row>
          )}
            </div>
          </>
        )}
      {(prev || next) && (
        <nav aria-label="Other disputes" className="mb-4 flex items-center justify-between gap-3 text-[14px] font-semibold print:hidden">
          {prev ? <Link href={`/disputes/${prev}`} className="rounded-lg border border-line bg-white px-3 py-2.5 text-brand hover:border-brand">← Previous: {prev}</Link> : <span />}
          {next ? <Link href={`/disputes/${next}`} className="rounded-lg border border-line bg-white px-3 py-2.5 text-brand hover:border-brand">Next: {next} →</Link> : <span />}
        </nav>
      )}
      </div>

      <Dialog open={dialog === "fold"} onClose={() => setDialog(null)} title="Fold this dispute?">
        <p className="text-[14px]">
          {formatInrFull(money.atStakeInr)} will be taken from your balance ({formatOriginal(d.amount, d.currency)} at the {rateWord(rates)} of ₹{rateFor(d.currency, rates).toFixed(2)}; the real rate is the one on the day the dispute was created). You can&apos;t undo this.
        </p>
        <p className="mt-2 text-[14px] text-helper">Why the advisor says {finalCall}: {view.reason}</p>
        <p className="mt-2 rounded-lg bg-shield-soft px-3 py-2 text-[12px] font-semibold text-shield">Simulated: nothing leaves this demo.</p>
        {finalCall === "fight" && <OverrideWhy why={why} setWhy={setWhy} />}
        <DialogButtons onCancel={() => setDialog(null)} onYes={confirmAction} yes="Yes, fold" />
      </Dialog>
      <Dialog open={dialog === "submit"} onClose={() => setDialog(null)} title="Submit your response?">
        <p className="text-[14px]">In the real app, this sends your response to the customer&apos;s bank and you can&apos;t edit it afterwards.</p>
        <p className="mt-2 rounded-lg bg-shield-soft px-3 py-2 text-[12px] font-semibold text-shield">Simulated: nothing leaves this demo.</p>
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
            {state.check.meta.skipped && state.check.meta.skipped.length > 0 && (
              <p className="mt-1 text-[12px] text-helper">Tried first, did not answer: {state.check.meta.skipped.join("; ")}. The next model in the list answered.</p>
            )}
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
            <p className="mt-1 text-[12px] text-helper">Cost uses the token prices in the repo and the rate below.</p>
          </>
        ) : (
          <>
            <p>
              <b>Saved result</b>, not a live call. {view.source.model}, prompt {view.source.promptVersion}, run on {view.source.date}.
            </p>
            <p className="mt-1 text-[12px] text-helper">Tokens, response time and cost appear here after a live check.</p>
            <p className="mt-1 text-[12px] text-helper">Odds, the defensible amount, the request text and the prevention tip on saved results come from the builder&apos;s supplement file, not the model.</p>
          </>
        )}
        <p className="mt-1 text-[12px] text-helper">{rateNote(rates)}</p>

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
      <span className="block text-[12px] text-helper">{label}</span>
      <b className="block text-[16px] font-semibold">{value}</b>
      <em className="text-[12px] text-helper not-italic">{sub}</em>
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

const BADGE_CLS = { ok: "bg-[#E3F5EC] text-fight", warn: "bg-fold-soft text-fold", info: "bg-brand-soft text-brand" } as const;
function Row({ id, title, summary, open, onToggle, children, badge }: { id: string; title: string; summary: string; open: boolean; onToggle: () => void; children: ReactNode; badge?: { text: string; tone: keyof typeof BADGE_CLS } }) {
  return (
    <div data-row={id} className="border-b border-line last:border-0">
      <button type="button" aria-expanded={open} aria-controls={`row-${id}`} onClick={onToggle} className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#FAFAFA]">
        <span className="min-w-0 flex-1">
          <b className="block text-[14px] font-semibold">{title}</b>
          <span className="block text-[12px] text-helper">{summary}</span>
        </span>
        {badge && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold ${BADGE_CLS[badge.tone]}`}>{badge.text}</span>}
        <span aria-hidden className={`text-brand transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </button>
      {open && <div id={`row-${id}`} className="px-5 pb-5">{children}</div>}
    </div>
  );
}
