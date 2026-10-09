"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CallChip } from "@/components/CallChip";
import { Card } from "@/components/ui";
import { CHANNEL_LABEL, DEFAULT_RULES, alertText, decide, digestText, type AlertRow, type AlertRules, type Channel } from "@/lib/alertRules";

const KEY = "da:alerts:v1";
const REASONS: { code: string; label: string }[] = [
  { code: "13.1", label: "13.1 Service not received" },
  { code: "13.2", label: "13.2 Cancelled subscription" },
  { code: "13.3", label: "13.3 Not as described" },
  { code: "13.6", label: "13.6 Refund not processed" },
  { code: "13.7", label: "13.7 Cancelled service" },
];
const FRAME: Record<Channel, string> = {
  slack: "border-l-4 border-l-[#4A154B] bg-white",
  whatsapp: "rounded-tl-none bg-[#DCF8C6]",
  email: "bg-white",
};

/** The front door: a preview of the alerts a merchant would get, and the rules that decide them. Nothing is sent. */
export function AlertsView({ rows }: { rows: AlertRow[] }) {
  const [rules, setRules] = useState<AlertRules>(DEFAULT_RULES);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setRules({ ...DEFAULT_RULES, ...JSON.parse(raw) });
    } catch {
      /* storage unavailable: use the defaults */
    }
  }, []);
  const set = <K extends keyof AlertRules>(k: K, v: AlertRules[K]) =>
    setRules((r) => {
      const n = { ...r, [k]: v };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(n));
      } catch {
        /* ignore */
      }
      return n;
    });

  const decided = useMemo(() => rows.map((r) => ({ r, d: decide(r, rules) })), [rows, rules]);
  const alerts = decided.filter((x) => x.d.route === "alert");
  const digest = decided.filter((x) => x.d.route === "digest").map((x) => x.r);
  const inApp = decided.filter((x) => x.d.route === "app");
  const ch = CHANNEL_LABEL[rules.channel];

  return (
    <>
      <h1 className="mb-1 text-2xl leading-8 font-semibold">Alerts</h1>
      <p className="mb-3 text-[14px] text-ink-soft">Disputes come to you, where you already work. You choose which ones.</p>
      <p className="mb-4 rounded-xl bg-[#F4F8FF] px-3 py-2 text-[13px]" data-testid="alerts-disclaimer">
        <b>Preview only.</b> Nothing is sent to Slack, WhatsApp or email, and no channel is connected. This shows what you would get under your rules. Folding is always your click.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-[16px] font-semibold">Where should alerts go?</h2>
          <fieldset className="mt-2 space-y-1">
            <legend className="sr-only">Channel</legend>
            {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => (
              <label key={c} className="flex min-h-10 items-center gap-2 text-[15px]">
                <input type="radio" name="channel" checked={rules.channel === c} onChange={() => set("channel", c)} className="h-4 w-4 accent-[#2F63C8]" />
                {CHANNEL_LABEL[c]}
              </label>
            ))}
          </fieldset>
        </Card>

        <Card>
          <h2 className="text-[16px] font-semibold">Your rules</h2>
          <div className="mt-2 space-y-3 text-[14px]">
            <label className="block">
              Alert me when the amount is at least (₹)
              <input inputMode="numeric" value={rules.minInr} onChange={(e) => set("minInr", Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))} aria-label="Alert amount in rupees" className="mt-1 block w-40 rounded-[10px] border border-line px-3 py-2 text-[16px] focus:border-brand-focus focus:outline-none" />
            </label>
            <fieldset>
              <legend>Always alert me for</legend>
              <div className="mt-1 grid gap-0.5">
                {REASONS.map((x) => (
                  <label key={x.code} className="flex min-h-9 items-center gap-2">
                    <input type="checkbox" checked={rules.alwaysReasons.includes(x.code)} onChange={(e) => set("alwaysReasons", e.target.checked ? [...rules.alwaysReasons, x.code] : rules.alwaysReasons.filter((c) => c !== x.code))} className="h-4 w-4 accent-[#2F63C8]" />
                    {x.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              Always alert me when time left is under
              <select aria-label="Urgent hours" value={rules.urgentHours ?? "off"} onChange={(e) => set("urgentHours", e.target.value === "off" ? null : Number(e.target.value))} className="ml-2 min-h-10 rounded-[10px] border border-line bg-white px-2">
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="off">Never</option>
              </select>
            </label>
            <label className="flex min-h-10 items-center gap-2">
              <input type="checkbox" checked={rules.digest} onChange={(e) => set("digest", e.target.checked)} className="h-4 w-4 accent-[#2F63C8]" />
              Send everything else as one digest each morning
            </label>
            <label className="block">
              Suggest Fold when the chance to win is under
              <select aria-label="Fold suggestion" value={rules.foldBelowPct ?? "off"} onChange={(e) => set("foldBelowPct", e.target.value === "off" ? null : Number(e.target.value))} className="ml-2 min-h-10 rounded-[10px] border border-line bg-white px-2">
                <option value="20">20%</option>
                <option value="30">30%</option>
                <option value="40">40%</option>
                <option value="off">Never suggest</option>
              </select>
              <span className="mt-1 block text-[13px] text-helper">A suggestion only. It never accepts a dispute for you.</span>
            </label>
          </div>
        </Card>
      </div>

      <h2 className="mt-6 mb-1 text-[18px] font-semibold">What you would get on {ch}</h2>
      <p className="mb-3 text-[14px] text-ink-soft" data-testid="alerts-summary">
        {alerts.length} alert{alerts.length === 1 ? "" : "s"} now{rules.digest ? `, ${digest.length} in the morning digest` : ""}{inApp.length ? `, ${inApp.length} waiting in the app` : ""}.
      </p>

      <ul className="space-y-3" aria-label="Alerts">
        {alerts.map(({ r, d }) => (
          <li key={r.id} data-testid="alert-item" className={`max-w-[560px] rounded-2xl border border-line p-3 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,.04)] ${FRAME[rules.channel]}`}>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">{ch} · Dispute Advisor</span>
              {r.call && <CallChip call={r.call} />}
            </div>
            <p className="whitespace-pre-line">{alertText(r, d)}</p>
            <p className="mt-1 text-[12px] text-helper">Why you got this: {d.why}</p>
            <Link href={`/disputes/${r.id}`} className="mt-2 inline-block min-h-10 font-semibold text-brand underline">Open {r.id}</Link>
          </li>
        ))}
        {alerts.length === 0 && <li className="text-[14px] text-helper">No alerts under these rules.</li>}
      </ul>

      {rules.digest && (
        <div className={`mt-4 max-w-[560px] rounded-2xl border border-line p-3 text-[14px] ${FRAME[rules.channel]}`} data-testid="digest">
          <p className="mb-1 text-[12px] font-semibold tracking-[.6px] text-helper uppercase">{ch} · Morning digest</p>
          <p className="whitespace-pre-line">{digestText(digest)}</p>
        </div>
      )}
    </>
  );
}
