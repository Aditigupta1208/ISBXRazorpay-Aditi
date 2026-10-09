"use client";
import Link from "next/link";
import { useState } from "react";
import { ACCEPTANCE_OPTIONS, MAX_POLICY_CHARS, type Acceptance } from "@/lib/limits";
import { containsCardNumber } from "@/lib/guardrails";
import { useProfile } from "@/lib/useProfile";
import { policyBlock } from "@/lib/policyBlock";
import { Card, SettingRow } from "@/components/ui";

const CODES = ["13.1", "13.2", "13.3", "13.6", "13.7"];
const FIELD = "w-full rounded-lg border border-line bg-white p-2.5 text-[14px] focus:border-brand-focus focus:outline-none focus:ring-2 focus:ring-brand-soft";

/** What the Deadline rescue preview is written about. Built on the server from a demo dispute. */
export interface RescueSample {
  caseId: string;
  amount: string;
  inr: string;
  code: string;
  reason: string;
  hoursLeft: number;
  call: string;
  confidence: string;
  draftReady: boolean;
}

export function AgentSetup({ rescue }: { rescue: RescueSample | null }) {
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
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card label="Your terms">
            <h2 className="text-[16px] font-semibold">Your terms</h2>
            <p className="mb-3 text-[13px] text-helper">Your refund, cancellation and renewal rules, in your own words.</p>
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
            <p role="status" className={`mt-4 text-[14px] ${over || error ? "text-danger" : saved ? "text-fight" : "text-helper"}`}>
              {over || error
                ? "Not used yet: fix the terms above."
                : saved
                  ? "✓ Saved in this browser."
                  : "Everything on this page saves as you change it, in this browser only."}
            </p>
          </Card>

          <Card label="Agent settings">
            <h2 className="text-[16px] font-semibold">Agent settings</h2>
            <p className="mb-3 text-[13px] text-helper">Demo only: your choices are saved in this browser, but no email or WhatsApp is ever sent.</p>
            <SettingRow title={profile.enabled ? "Dispute Advisor is on" : "Dispute Advisor is off"} caption={profile.enabled ? "New checks can run." : "Checks are paused. Saved results still show."} htmlFor="agent-on">
              <input id="agent-on" type="checkbox" role="switch" checked={profile.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-5 w-5 shrink-0 accent-[#2F63C8]" />
            </SettingRow>
            <SettingRow title="Email me when a dispute needs my decision" htmlFor="n-email">
              <input id="n-email" type="checkbox" checked={profile.notifyEmail} onChange={(e) => set("notifyEmail", e.target.checked)} className="h-5 w-5 shrink-0 accent-[#2F63C8]" />
            </SettingRow>
            <SettingRow title="Deadline rescue: WhatsApp me when a deadline is under 24 hours" caption="Sent with your response already drafted. You still review and approve." htmlFor="n-wa">
              <input id="n-wa" type="checkbox" checked={profile.notifyWhatsapp} onChange={(e) => set("notifyWhatsapp", e.target.checked)} className="h-5 w-5 shrink-0 accent-[#2F63C8]" />
            </SettingRow>
          </Card>

          <Card label="What the agent does">
            <h2 className="text-[16px] font-semibold">What the agent does</h2>
            <p className="mb-3 text-[13px] text-helper">You decide what it may touch. Every submit and fold needs your approval, always.</p>
            <div className="grid gap-4 text-[14px] md:grid-cols-2">
              <div>
                <h3 className="mb-1.5 font-semibold">It will</h3>
                <ul className="space-y-1.5 text-ink-soft">
                  <li>Read the dispute record and the documents you add.</li>
                  <li>Draft a response and recommend Fight, Fold or Escalate. You can edit or override both.</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-1.5 font-semibold">What it will never do</h3>
                <ul className="space-y-1.5 text-ink-soft">
                  <li>Send anything to Razorpay, Visa or your customer without your click.</li>
                  <li>Refund your customer, or accept (Fold) a dispute for you. A Fold is always your click.</li>
                  <li>Treat your own terms as proof.</li>
                  <li>Handle fraud disputes. Those go to Chargeback Shield.</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-3 text-[13px] text-helper">
              Covers Visa reasons {CODES.join(", ")}. Fraud reasons (10.x) go to Chargeback Shield.
            </p>
          </Card>
        </div>

        <div className="space-y-4 md:sticky md:top-4">
          <Card id="advisor-told" label="What the advisor is told" className="!border-brand !bg-[#F4F8FF]">
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
          {rescue && (
            <Card id="deadline-rescue" label="Deadline rescue">
              <h2 className="flex items-center gap-2 text-[16px] font-semibold">Deadline rescue <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-semibold text-brand">Preview</span></h2>
              <p className="mb-3 text-[13px] text-helper">
                {profile.notifyWhatsapp ? "What you would get with 24 hours left." : "Off. Turn on Deadline rescue to get this. The message below is a preview."} Nothing is sent in this demo.
              </p>
              <div className={`rounded-xl border border-line bg-white p-3 text-[14px] leading-5 ${profile.notifyWhatsapp ? "" : "opacity-60"}`} data-testid="rescue-message" aria-label="Sample message">
                <p className="text-[13px] font-semibold text-helper">Dispute Advisor · WhatsApp</p>
                <p className="mt-1">
                  <b>{rescue.hoursLeft} hours left.</b> A {rescue.amount} dispute ({rescue.code}, {rescue.reason}) closes soon. If you do nothing it is treated as accepted and {rescue.inr} is taken back.
                </p>
                <p className="mt-2">
                  The advisor says <b>{rescue.call}</b>, {rescue.confidence} confidence.{rescue.draftReady ? " Your response is drafted and every sentence cites a document." : ""}
                </p>
                <Link href={`/disputes/${rescue.caseId}?review=1`} className="mt-3 inline-flex min-h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-focus" data-testid="rescue-link">
                  Review and approve
                </Link>
              </div>
              <p className="mt-2 text-[13px] text-helper">The link opens the response for review. Nothing is submitted until you approve it there.</p>
            </Card>
          )}
          <Card label="Try it">
            <p className="text-[14px]">
              <span className="font-semibold">See it work.</span> Open <Link href="/disputes/C13" className="font-semibold text-brand hover:underline">dispute C13</Link> (a cancelled service, reason 13.7), add a document and re-run the check. The call can change when your terms change.
            </p>
            <p className="mt-2 text-[13px] text-helper">Without an API key the demo shows a saved result, so your terms only take effect on a live check.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
