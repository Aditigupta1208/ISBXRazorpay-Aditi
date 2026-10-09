"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CallChip } from "@/components/CallChip";
import { CHANNEL_LABEL, DEFAULT_RULES, alertBody, decide, digestText, type AlertRow, type AlertRules, type Channel } from "@/lib/alertRules";

const KEY = "da:alerts:v1";
const REASONS: { code: string; label: string }[] = [
  { code: "13.1", label: "Service not received" },
  { code: "13.2", label: "Cancelled subscription" },
  { code: "13.3", label: "Not as described" },
  { code: "13.6", label: "Refund not processed" },
  { code: "13.7", label: "Cancelled service" },
];
const CHANNEL_NOTE: Record<Channel, string> = { whatsapp: "Message on your phone", slack: "Message in a channel", email: "One email each" };
const SELECT = "min-h-10 rounded-[10px] border border-line bg-white px-2.5 text-[14px] font-semibold text-ink focus:border-brand-focus focus:outline-none";

function RuleRow({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line py-3.5 first:border-t-0 first:pt-0">
      <div className="min-w-0 flex-1 basis-56 text-[14px] leading-5 text-ink">{title}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3 md:p-4">
      <span className="block text-[13px] leading-4 text-helper">{label}</span>
      <b className={`text-[26px] leading-9 font-semibold ${tone}`}>{value}</b>
    </div>
  );
}

/** The front door: a preview of the alerts a merchant would get, and the rules that decide them. Nothing is sent. */
export function AlertsView({ rows }: { rows: AlertRow[] }) {
  const [rules, setRules] = useState<AlertRules>(DEFAULT_RULES);
  const [tab, setTab] = useState<"now" | "digest">("now");
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
  const inApp = decided.filter((x) => x.d.route === "app").length;
  const ch = CHANNEL_LABEL[rules.channel];
  const showDigest = tab === "digest" && rules.digest;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl leading-8 font-semibold">Alerts</h1>
        <p className="mt-0.5 text-[15px] text-ink-soft">Disputes come to you, where you already work. You choose which ones.</p>
        <p className="mt-3 inline-flex max-w-full items-start gap-2 rounded-xl bg-brand-soft px-3 py-2 text-[13px] leading-5 text-[#1F3F86]" data-testid="alerts-disclaimer">
          <span aria-hidden className="mt-0.5 font-bold">i</span>
          <span>
            <b>Preview only.</b> Nothing is sent to Slack, WhatsApp or email, and no channel is connected. This shows what you would get under your rules. Folding is always your click.
          </span>
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Rules */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <section aria-label="Channel" className="rounded-2xl border border-line bg-white p-4 md:p-5">
            <h2 className="text-[16px] font-semibold">Where should alerts go?</h2>
            <div role="radiogroup" aria-label="Channel" className="mt-3 grid grid-cols-3 gap-2">
              {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => {
                const on = rules.channel === c;
                return (
                  <label key={c} className={`relative flex min-h-[64px] cursor-pointer flex-col justify-center rounded-xl border px-3 py-2 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${on ? "border-brand bg-brand-soft" : "border-line bg-white hover:bg-[#FAFCFF]"}`}>
                    <input type="radio" name="channel" aria-label={CHANNEL_LABEL[c]} checked={on} onChange={() => set("channel", c)} className="sr-only" />
                    <span className={`text-[15px] font-semibold ${on ? "text-brand" : "text-ink"}`}>{CHANNEL_LABEL[c]}</span>
                    <span className="text-[11px] leading-4 text-helper">{CHANNEL_NOTE[c]}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section aria-label="Your rules" className="rounded-2xl border border-line bg-white p-4 md:p-5">
            <h2 className="mb-3 text-[16px] font-semibold">Your rules</h2>
            <RuleRow title={<>Alert me when the amount is at least</>}>
              <div className="flex items-center rounded-[10px] border border-line bg-white focus-within:border-brand-focus">
                <span className="pl-3 text-[15px] text-helper" aria-hidden>₹</span>
                <input
                  inputMode="numeric"
                  value={rules.minInr.toLocaleString("en-IN")}
                  onChange={(e) => set("minInr", Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
                  aria-label="Alert amount in rupees"
                  className="min-h-10 w-28 rounded-[10px] bg-transparent px-2 text-right text-[15px] font-semibold focus:outline-none"
                />
              </div>
            </RuleRow>
            <RuleRow title={<>Alert me when time left is under</>}>
              <select aria-label="Urgent hours" value={rules.urgentHours ?? "off"} onChange={(e) => set("urgentHours", e.target.value === "off" ? null : Number(e.target.value))} className={SELECT}>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="off">Never</option>
              </select>
            </RuleRow>
            <div className="border-t border-line py-3.5">
              <p className="text-[14px] text-ink">Always alert me for these reasons</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Always alert for">
                {REASONS.map((x) => {
                  const on = rules.alwaysReasons.includes(x.code);
                  return (
                    <label key={x.code} className={`flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${on ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-ink-soft hover:bg-[#FAFCFF]"}`}>
                      <input type="checkbox" aria-label={`${x.code} ${x.label}`} checked={on} onChange={(e) => set("alwaysReasons", e.target.checked ? [...rules.alwaysReasons, x.code] : rules.alwaysReasons.filter((c) => c !== x.code))} className="sr-only" />
                      <span aria-hidden>{on ? "✓" : "+"}</span>
                      <span className="font-mono text-[12px]">{x.code}</span> {x.label}
                    </label>
                  );
                })}
              </div>
            </div>
            <RuleRow title={<>Send everything else as one digest each morning</>}>
              <label className="relative inline-flex min-h-10 cursor-pointer items-center">
                <input type="checkbox" role="switch" aria-label="Morning digest" checked={rules.digest} onChange={(e) => set("digest", e.target.checked)} className="peer sr-only" />
                <span className="h-6 w-11 rounded-full bg-[#CFD3DA] transition-colors peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand" />
                <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </RuleRow>
            <RuleRow
              title={
                <>
                  Suggest Fold when the chance to win is under
                  <span className="block text-[12px] text-helper">A suggestion only. It never accepts a dispute for you.</span>
                </>
              }
            >
              <select aria-label="Fold suggestion" value={rules.foldBelowPct ?? "off"} onChange={(e) => set("foldBelowPct", e.target.value === "off" ? null : Number(e.target.value))} className={SELECT}>
                <option value="20">20%</option>
                <option value="30">30%</option>
                <option value="40">40%</option>
                <option value="off">Never</option>
              </select>
            </RuleRow>
          </section>
        </div>

        {/* Preview */}
        <div>
          <div className="mb-3 grid grid-cols-3 gap-2 md:gap-3" data-testid="alerts-summary-tiles">
            <Tile label="Alerts now" value={alerts.length} tone="text-brand" />
            <Tile label="In the morning digest" value={rules.digest ? digest.length : 0} tone="text-ink" />
            <Tile label="Waiting in the app" value={inApp} tone="text-helper" />
          </div>
          <h2 className="sr-only">What you would get on {ch}</h2>
          <p className="sr-only" data-testid="alerts-summary">
            {alerts.length} alert{alerts.length === 1 ? "" : "s"} now{rules.digest ? `, ${digest.length} in the morning digest` : ""}{inApp ? `, ${inApp} waiting in the app` : ""}.
          </p>

          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
            <div className={`flex items-center gap-3 px-4 py-3 text-white ${rules.channel === "whatsapp" ? "bg-[#075E54]" : rules.channel === "slack" ? "bg-[#4A154B]" : "bg-[#1F2937]"}`}>
              <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-[15px] font-bold">DA</span>
              <div className="leading-tight">
                <p className="text-[15px] font-semibold">{rules.channel === "slack" ? "#disputes" : "Dispute Advisor"}</p>
                <p className="text-[12px] opacity-80">{rules.channel === "email" ? "advisor@yourbusiness.example (preview)" : "preview, not connected"}</p>
              </div>
              <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-[12px] font-semibold">{ch}</span>
            </div>
            <div role="tablist" aria-label="What you would get" className="flex border-b border-line bg-white">
              {(["now", "digest"] as const).map((k) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-11 flex-1 text-[14px] font-semibold ${tab === k ? "text-brand shadow-[inset_0_-3px_0_#2F63C8]" : "text-helper hover:text-ink"}`}>
                  {k === "now" ? `Alerts now (${alerts.length})` : `Morning digest${rules.digest ? ` (${digest.length})` : " (off)"}`}
                </button>
              ))}
            </div>

            <div className={`max-h-[760px] space-y-3 overflow-y-auto p-3 md:p-4 ${rules.channel === "whatsapp" ? "bg-[#ECE5DD]" : "bg-[#F6F7F9]"}`}>
              {!showDigest && (
                <ul className="space-y-3" aria-label="Alerts">
                  {alerts.map(({ r, d }) => (
                    <li key={r.id} data-testid="alert-item" className={`max-w-[520px] rounded-2xl p-3.5 text-[14px] leading-5 shadow-[0_1px_1px_rgba(0,0,0,.08)] ${rules.channel === "whatsapp" ? "rounded-tl-sm bg-white" : rules.channel === "slack" ? "border-l-4 border-l-[#4A154B] bg-white" : "border border-line bg-white"}`}>
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-bold">{r.disputeId}</span>
                        {r.call && <CallChip call={r.call} />}
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[12px] font-semibold ${r.hours <= 24 ? "bg-fold-soft text-fold" : "bg-[#F1F3F6] text-helper"}`}>{r.timeText} left</span>
                      </div>
                      <p className="whitespace-pre-line text-[#222]">{alertBody(r, d)}</p>
                      <p className="mt-2 rounded-lg bg-[#F6F7F9] px-2.5 py-1.5 text-[12px] text-helper">Why you got this: {d.why}</p>
                      <Link href={`/disputes/${r.id}`} className="mt-2.5 inline-flex min-h-10 items-center rounded-[10px] border border-brand px-3.5 text-[14px] font-semibold text-brand hover:bg-brand-soft">
                        Open {r.id}
                      </Link>
                    </li>
                  ))}
                  {alerts.length === 0 && <li className="rounded-xl bg-white p-4 text-[14px] text-helper">No alerts under these rules.</li>}
                </ul>
              )}
              {showDigest && (
                <div data-testid="digest" className="max-w-[520px] rounded-2xl bg-white p-3.5 text-[14px] leading-5 shadow-[0_1px_1px_rgba(0,0,0,.08)]">
                  <p className="mb-1.5 text-[12px] font-semibold tracking-[.6px] text-helper uppercase">Every morning at 9</p>
                  <p className="whitespace-pre-line">{digestText(digest)}</p>
                </div>
              )}
              {tab === "digest" && !rules.digest && <p className="rounded-xl bg-white p-4 text-[14px] text-helper">The digest is off. Disputes below your rules wait in the app.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
