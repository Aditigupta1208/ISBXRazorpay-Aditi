"use client";
import Link from "next/link";
import { useState } from "react";
import { ACCEPTANCE_OPTIONS, MAX_POLICY_CHARS, type Acceptance } from "@/lib/limits";
import { containsCardNumber } from "@/lib/guardrails";
import { useProfile } from "@/lib/useProfile";
import { policyBlock } from "@/lib/policyBlock";
import { Card } from "@/components/ui";

const CODES = ["13.1", "13.2", "13.3", "13.6", "13.7"];
const REASONS: [string, string][] = [
  ["13.1", "Service not provided"],
  ["13.2", "Cancelled subscription"],
  ["13.3", "Not as described"],
  ["13.6", "Refund not processed"],
  ["13.7", "Cancelled service"],
];
const STEPS: [string, string, string][] = [
  ["1", "You brief it", "Add your terms once, on this page."],
  ["2", "It checks each dispute", "Reads the record and your documents, applies Visa's rules, recommends Fight, Fold or Escalate and drafts the response."],
  ["3", "You decide", "Edit, override, approve. Nothing is sent without your click."],
];
const STEP_BADGE = "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold";
const FIELD = "w-full rounded-lg border border-line bg-white p-2.5 text-[14px] focus:border-brand-focus focus:outline-none focus:ring-2 focus:ring-brand-soft";

export function AgentSetup() {
  const { profile, save, ready } = useProfile();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof profile>(k: K, v: (typeof profile)[K]) => {
    setSaved(true);
    save({ ...profile, [k]: v });
  };
  const over = profile.policy.length > MAX_POLICY_CHARS;

  const onPolicy = (v: string) => {
    setError(containsCardNumber(v) ? "That looks like a card number. Remove it." : null);
    set("policy", v);
  };

  const told = policyBlock({ text: profile.policy, acceptance: profile.acceptance }).length > 0;

  return (
    <div className={ready ? "" : "opacity-60"} aria-busy={!ready}>
      {/* Who the agent is, and where this page fits in the flow */}
      <Card label="Your Dispute Advisor" className="mb-5 !border-[#C9D7F5] !bg-gradient-to-br from-[#EEF3FF] via-white to-white !p-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 md:px-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-white" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
          </span>
          <div className="min-w-0 flex-1 basis-60">
            <h2 className="text-[18px] font-semibold">Dispute Advisor</h2>
            <p className="text-[14px] text-ink-soft">Handles card disputes that are not fraud: it reads, recommends and drafts. You approve every step.</p>
          </div>
          <label htmlFor="agent-on" className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full bg-white py-1.5 pr-4 pl-3 ring-1 ring-line">
            <input
              id="agent-on"
              type="checkbox"
              role="switch"
              checked={profile.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
              className="relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-[#9AA0A8] transition-colors before:absolute before:top-0.5 before:left-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:transition-transform before:content-[''] checked:bg-fight checked:before:translate-x-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            />
            <span>
              <span className="block text-[14px] leading-5 font-semibold">{profile.enabled ? "Dispute Advisor is on" : "Dispute Advisor is off"}</span>
              <span className="block text-[12px] leading-4 text-ink-soft">{profile.enabled ? "New checks can run." : "Checks are paused. Saved results still show."}</span>
            </span>
          </label>
        </div>
        <ol className="grid divide-y divide-line border-t border-line bg-white md:grid-cols-3 md:divide-x md:divide-y-0" aria-label="Where this page fits">
          {STEPS.map(([n, t, d]) => (
            <li key={n} className={`flex gap-3 px-4 py-3.5 md:px-5 ${n === "1" ? "bg-[#EAF1FE]" : ""}`}>
              <span className={`${STEP_BADGE} ${n === "1" ? "bg-brand text-white" : "bg-white text-ink-soft ring-1 ring-line"}`} aria-hidden>{n}</span>
              <span className="text-[13px] text-ink-soft">
                <b className="block text-[14px] font-semibold text-ink">{t}{n === "1" && <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#2B5BC8] ring-1 ring-[#C9D7F5]">You are here</span>}</b>
                {d}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card label="Your terms">
            <div className="mb-3 flex gap-3">
              <span className={`${STEP_BADGE} bg-brand text-white`} aria-hidden>1</span>
              <div>
                <h2 className="text-[16px] font-semibold">Your terms</h2>
                <p className="text-[13px] text-helper">Your refund, cancellation and renewal rules, in your own words. The advisor uses them to see what you promised the customer.</p>
              </div>
            </div>
            <label htmlFor="policy" className="mb-1 block text-[14px] font-semibold">Refund, cancellation and renewal terms</label>
            <textarea
              id="policy"
              value={profile.policy}
              onChange={(e) => onPolicy(e.target.value)}
              rows={5}
              aria-describedby="policy-help"
              placeholder="Example: Plans renew every year. You can cancel any time before the renewal date. Refunds within 14 days of purchase."
              className={FIELD}
            />
            <div id="policy-help" className="mt-1 flex justify-between text-[12px]">
              <span className={error ? "text-danger" : "text-helper"}>{error ?? "Plain text. No card numbers."}</span>
              <span className={over ? "text-danger" : "text-helper"}>{profile.policy.length} / {MAX_POLICY_CHARS.toLocaleString()}</span>
            </div>
            <label htmlFor="acceptance" className="mt-4 mb-1 block text-[14px] font-semibold">How do customers accept these terms?</label>
            <select id="acceptance" value={profile.acceptance} onChange={(e) => set("acceptance", e.target.value as Acceptance)} className={FIELD}>
              {ACCEPTANCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="mt-1 text-[13px] text-helper">For cancelled services (13.7), Visa wants the terms shown and agreed at the time of sale. A footer link alone usually does not count.</p>
            <p role="status" className={`mt-4 rounded-lg px-3 py-2 text-[14px] ${over || error ? "bg-danger-soft text-danger" : saved ? "bg-fight-soft text-fight" : "bg-[#F6F7F9] text-ink-soft"}`}>
              {over || error
                ? "Not used yet: fix the terms above."
                : saved
                  ? "✓ Saved in this browser."
                  : "Everything on this page saves as you change it, in this browser only."}
            </p>
          </Card>

          <Card label="What the agent does">
            <div className="mb-3 flex gap-3">
              <span className={`${STEP_BADGE} bg-[#EEF2F6] text-shield`} aria-hidden><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span>
              <div>
                <h2 className="text-[16px] font-semibold">What the agent does</h2>
                <p className="text-[13px] text-helper">Its limits are fixed. Every submit and fold needs your approval, always.</p>
              </div>
            </div>
            <div className="grid gap-3 text-[14px] md:grid-cols-2">
              <div className="rounded-xl bg-fight-soft p-3.5">
                <h3 className="mb-2 font-semibold text-fight">It will</h3>
                <ul className="space-y-2 text-[#1F3A2E]">
                  {["Read the dispute record and the documents you add.", "Draft a response and recommend Fight, Fold or Escalate. You can edit or override both."].map((t) => (
                    <li key={t} className="flex gap-2"><span className="font-bold text-fight" aria-hidden>✓</span><span>{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-danger-soft p-3.5">
                <h3 className="mb-2 font-semibold text-danger">What it will never do</h3>
                <ul className="space-y-2 text-[#4A1A15]">
                  {[
                    "Send anything to Razorpay, Visa or your customer without your click.",
                    "Refund your customer, or accept (Fold) a dispute for you. A Fold is always your click.",
                    "Treat your own terms as proof.",
                    "Handle fraud disputes. Those go to Chargeback Shield.",
                  ].map((t) => (
                    <li key={t} className="flex gap-2"><span className="font-bold text-danger" aria-hidden>✕</span><span>{t}</span></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-2 text-[13px] font-semibold text-ink-soft">Covers these Visa reasons (not fraud)</p>
              <ul className="flex flex-wrap gap-2">
                {REASONS.map(([code, name]) => (
                  <li key={code} className="rounded-full bg-[#F1F3F6] px-3 py-1 text-[13px]"><b className="font-semibold">{code}</b> {name}</li>
                ))}
              </ul>
              <p className="mt-2 text-[13px] text-helper">Fraud reasons (10.x) go to Chargeback Shield.</p>
            </div>
          </Card>

          <Card label="Alerts" className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold">Where alerts go, and which disputes alert you</h2>
              <p className="text-[13px] text-helper">Slack, WhatsApp or email, with your own rules. Set on the Alerts page.</p>
            </div>
            <Link href="/alerts" className="inline-flex min-h-10 shrink-0 items-center rounded-[10px] border border-brand px-3.5 text-[14px] font-semibold text-brand hover:bg-brand-soft">Open Alerts</Link>
          </Card>
        </div>

        <div className="space-y-4 md:sticky md:top-4">
          <Card id="advisor-told" label="What the advisor is told" className="!border-brand !bg-[#F4F8FF]">
            <p className="mb-1 text-[12px] font-semibold tracking-[.6px] text-[#2B5BC8] uppercase">Live preview</p>
            <h2 className="text-[16px] font-semibold">What the advisor is told</h2>
            <p className="mb-3 text-[13px] text-helper">Added to every live check, beside the dispute record and the documents.</p>
            {!told ? (
              <p className="rounded-xl bg-white p-3 text-[14px] text-ink-soft">No terms yet. The advisor will rely on the documents alone.</p>
            ) : (
              <div className="rounded-xl bg-white p-3 text-[14px] leading-5">
                <p className="font-semibold">Your terms (your claim, not proof)</p>
                <p className="mt-1 break-words whitespace-pre-wrap text-ink-soft">{profile.policy.trim()}</p>
                <p className="mt-3 font-semibold">How customers accept them</p>
                <p className="mt-1 text-ink-soft">{ACCEPTANCE_OPTIONS.find((o) => o.value === profile.acceptance)?.label ?? "Not sure"}</p>
              </div>
            )}
            <p className="mt-3 text-[13px] text-helper">It is also told that these terms are what you say, and that only a document can show what the customer saw or agreed to.</p>
          </Card>
          <Card label="Try it" className="!bg-[#FBFBFC]">
            <p className="text-[14px]">
              <span className="font-semibold">See it work.</span> Open <Link href="/disputes/C13" className="font-semibold text-brand hover:underline">dispute C13</Link> (a cancelled service, reason 13.7), add a document and re-run the check. The call can change when your terms change.
            </p>
            <Link href="/disputes/C13" className="mt-3 inline-flex min-h-10 items-center rounded-[10px] bg-brand px-4 text-[14px] font-semibold text-white">Try it on C13</Link>
            <p className="mt-2 text-[13px] text-helper">Without an API key the demo shows a saved result, so your terms only take effect on a live check.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
