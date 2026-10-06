"use client";
import Link from "next/link";
import { useState } from "react";
import { ACCEPTANCE_OPTIONS, MAX_POLICY_CHARS, type Acceptance } from "@/lib/limits";
import { containsCardNumber } from "@/lib/guardrails";
import { useProfile } from "@/lib/useProfile";
import { policyBlock } from "@/lib/policyBlock";

const CODES = [
  ["13.1", "Services not provided or merchandise not received"],
  ["13.2", "Cancelled recurring transaction"],
  ["13.3", "Not as described or defective"],
  ["13.6", "Credit not processed"],
  ["13.7", "Cancelled merchandise or services"],
];

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

  return (
    <div className={ready ? "" : "opacity-60"} aria-busy={!ready}>
      <section id="purpose" aria-labelledby="purpose-h" className="mb-4 rounded-2xl border border-line bg-white p-5">
        <h2 id="purpose-h" className="text-[17px] font-semibold">What this screen is for</h2>
        <ol className="mt-3 grid gap-3 text-[14px] md:grid-cols-3">
          <li className="rounded-xl bg-[#F7F8FA] p-3"><b className="block">1. You write your terms once</b>Your refund, cancellation and renewal rules, in your own words.</li>
          <li className="rounded-xl bg-[#F7F8FA] p-3"><b className="block">2. The advisor reads them</b>On every live check it reads them next to the evidence for that dispute. The panel on the right shows exactly what it is told.</li>
          <li className="rounded-xl bg-[#F7F8FA] p-3"><b className="block">3. They never count as proof</b>Only a document the customer actually saw or agreed to does. Your terms are your claim.</li>
        </ol>
        <p className="mt-3 text-[13px] text-helper">Without an API key this demo shows saved results, so your terms take effect on a live check. This is our own design of the setup screen, based on how Razorpay describes Agent Studio.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Card title="Your terms" help="Your refund, cancellation and renewal terms. The check reads them with every dispute. They are your own words, so they never count as proof. A document the customer actually saw or agreed to does that.">
          <label htmlFor="policy" className="mb-1 block text-sm font-medium">Refund, cancellation and renewal terms</label>
          <textarea
            id="policy"
            value={profile.policy}
            onChange={(e) => onPolicy(e.target.value)}
            rows={6}
            aria-describedby="policy-help"
            placeholder="Example: Plans renew every year. You can cancel any time before the renewal date. Refunds within 14 days of purchase."
            className="w-full rounded-lg border border-line p-3 text-[15px] focus:border-brand-focus focus:outline-none focus:ring-2 focus:ring-brand-soft"
          />
          <div id="policy-help" className="mt-1 flex justify-between text-[13px]">
            <span className={error ? "text-escalate" : "text-helper"}>{error ?? "Plain text. No card numbers."}</span>
            <span className={over ? "text-escalate" : "text-helper"}>{profile.policy.length} / {MAX_POLICY_CHARS.toLocaleString()}</span>
          </div>
          <label htmlFor="acceptance" className="mt-4 mb-1 block text-sm font-medium">How do customers accept these terms?</label>
          <select
            id="acceptance"
            value={profile.acceptance}
            onChange={(e) => set("acceptance", e.target.value as Acceptance)}
            className="w-full rounded-lg border border-line bg-white p-2.5 text-[15px] focus:border-brand-focus focus:outline-none focus:ring-2 focus:ring-brand-soft"
          >
            {ACCEPTANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="mt-1 text-[13px] text-helper">For cancelled services (13.7), Visa wants the terms shown and agreed at the time of sale. A footer link alone usually does not count.</p>
          <p role="status" className={`mt-4 text-sm ${over || error ? "text-escalate" : saved ? "text-fight" : "text-helper"}`}>
            {over || error
              ? "Not used yet: fix the terms above."
              : saved
                ? "✓ Saved in this browser."
                : "Everything on this page saves as you change it, in this browser only."}
          </p>
        </Card>

        <Card title="Try it on a dispute" help="Your terms are read on every live check.">
          <p className="text-[15px]">
            Open <Link href="/disputes/C13" className="font-medium text-brand hover:underline">dispute C13</Link> (a cancelled service, reason 13.7), add a document, and re-run the check. The call can change when your terms or how customers accept them change.
          </p>
          <p className="mt-2 text-[13px] text-helper">Without an API key the demo shows a saved result, so the terms only take effect on a live check.</p>
        </Card>

        <Card title="What the agent can do" help="Modelled on how Razorpay describes Agent Studio: you decide what it may touch.">
          <ul className="space-y-2 text-[15px]">
            <li className="flex items-start gap-2"><span aria-hidden>🔒</span><span><b>Every submit and fold needs your approval.</b> This is always on in the prototype.</span></li>
            <li className="flex items-start gap-2"><span aria-hidden>👁</span><span>It reads the dispute record and the documents you add.</span></li>
            <li className="flex items-start gap-2"><span aria-hidden>✍️</span><span>It drafts a response and recommends Fight, Fold or Escalate. You can edit or override both.</span></li>
          </ul>
          <h3 className="mt-4 mb-2 text-sm font-semibold">What it will never do</h3>
          <ul className="space-y-2 text-[15px] text-ink-soft">
            <li className="flex items-start gap-2"><span aria-hidden>✕</span><span>Send anything to Razorpay, Visa or your customer without your click.</span></li>
            <li className="flex items-start gap-2"><span aria-hidden>✕</span><span>Treat your own terms as proof.</span></li>
            <li className="flex items-start gap-2"><span aria-hidden>✕</span><span>Handle fraud disputes. Those go to Chargeback Shield.</span></li>
          </ul>
        </Card>
      </div>

      <div className="space-y-4">
        <section id="advisor-told" aria-labelledby="told-h" className="rounded-2xl border border-brand bg-[#F4F8FF] p-[22px]">
          <h2 id="told-h" className="text-[17px] font-semibold">What the advisor is told</h2>
          <p className="mt-1 mb-3 text-[13px] text-helper">Added to every live check, beside the dispute record and the documents.</p>
          {policyBlock({ text: profile.policy, acceptance: profile.acceptance }).length === 0 ? (
            <p className="rounded-xl bg-white p-3 text-[14px] text-ink-soft">No terms yet. The advisor will rely on the documents alone.</p>
          ) : (
            <div className="rounded-xl bg-white p-3 text-[13px] leading-5 text-[#333]">
              <p className="font-semibold">Your terms (your claim, not proof)</p>
              <p className="mt-1 break-words whitespace-pre-wrap">{profile.policy.trim()}</p>
              <p className="mt-2 font-semibold">How customers accept them</p>
              <p className="mt-1">{ACCEPTANCE_OPTIONS.find((o) => o.value === profile.acceptance)?.label ?? "Not sure"}</p>
            </div>
          )}
          <p className="mt-3 text-[12px] text-helper">The advisor is also told that these terms are what you say, and that only a document can show what the customer saw or agreed to.</p>
        </section>
        <Card title="Agent status">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <b className="block text-[15px]">{profile.enabled ? "Dispute Advisor is on" : "Dispute Advisor is off"}</b>
              <span className="text-[13px] text-helper">{profile.enabled ? "New checks can run." : "Checks are paused. Saved results still show."}</span>
            </span>
            <input type="checkbox" role="switch" checked={profile.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-5 w-5 accent-[#407AEA]" />
          </label>
        </Card>
        <Card title="Tell me when" help="Demo only: your choice is saved in this browser, but no email or WhatsApp is ever sent.">
          <label className="mb-2 flex items-center gap-2 text-[15px]"><input type="checkbox" checked={profile.notifyEmail} onChange={(e) => set("notifyEmail", e.target.checked)} className="h-4 w-4 accent-[#407AEA]" /> A dispute needs my decision (email)</label>
          <label className="flex items-center gap-2 text-[15px]"><input type="checkbox" checked={profile.notifyWhatsapp} onChange={(e) => set("notifyWhatsapp", e.target.checked)} className="h-4 w-4 accent-[#407AEA]" /> A deadline is under 24 hours (WhatsApp)</label>
        </Card>
        <Card title="Reasons it covers" help="Fraud reasons (10.x) go to Chargeback Shield.">
          <ul className="space-y-1.5 text-[14px]">
            {CODES.map(([c, n]) => (
              <li key={c}><b>{c}</b> <span className="text-ink-soft">{n}</span></li>
            ))}
          </ul>
        </Card>
      </div>
      </div>
    </div>
  );
}

function Card({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {help && <p className="mt-1 mb-3 text-[13px] text-helper">{help}</p>}
      {!help && <div className="mb-3" />}
      {children}
    </section>
  );
}
