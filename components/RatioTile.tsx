"use client";
import { useEffect, useState } from "react";
import { RATIO_MARKS, RATIO_SOURCE, dispRatio } from "@/lib/ratio";
import { Card } from "@/components/ui";

const KEY = "da:ratio:v1";

/** Dispute ratio from two numbers the merchant types in. Kept in this browser only. */
export function RatioTile() {
  const [tx, setTx] = useState("");
  const [ds, setDs] = useState("");
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw) as { tx?: string; ds?: string };
        setTx(v.tx ?? "");
        setDs(v.ds ?? "");
      }
    } catch {
      /* storage unavailable: start empty */
    }
  }, []);
  const save = (t: string, d: string) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ tx: t, ds: d }));
    } catch {
      /* ignore */
    }
  };
  const r = dispRatio(Number(tx), Number(ds));
  const tone = r.band === "under" ? "text-green-ink" : r.band === "watch" ? "text-warn" : r.band ? "text-danger" : "text-ink";

  return (
    <Card className="mb-6" id="ratio">
      <h2 className="text-[16px] font-semibold">Your dispute ratio this month</h2>
      <p className="mb-3 text-[13px] text-helper">Type in two numbers from your Razorpay dashboard. Nothing leaves this browser.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-[13px] text-helper">
          Card payments this month
          <input inputMode="numeric" value={tx} onChange={(e) => { setTx(e.target.value); save(e.target.value, ds); }} className="mt-1 block w-40 rounded-[10px] border border-line px-3 py-2 text-[16px] text-ink focus:border-brand-focus focus:outline-none" />
        </label>
        <label className="text-[13px] text-helper">
          Disputes raised this month
          <input inputMode="numeric" value={ds} onChange={(e) => { setDs(e.target.value); save(tx, e.target.value); }} className="mt-1 block w-40 rounded-[10px] border border-line px-3 py-2 text-[16px] text-ink focus:border-brand-focus focus:outline-none" />
        </label>
        <p data-testid="ratio-value" className={`pb-1 text-[28px] leading-8 font-semibold ${tone}`}>{r.ratioPct === null ? "–" : `${r.ratioPct.toFixed(2)}%`}</p>
      </div>
      <p className="mt-2 text-[14px]" data-testid="ratio-note">{r.note}</p>
      {r.ratioPct !== null && (
        <ul className="mt-2 space-y-1 text-[13px] text-[#444]">
          {RATIO_MARKS.map((m, i) => (
            <li key={m.pct}>
              <b>{m.pct}%</b> · {m.label}: {r.room[i].more === null ? "already reached" : r.room[i].more === 0 ? "no more disputes fit" : `room for ${r.room[i].more} more this month`}.
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[13px] text-helper">
        A dispute counts when it is raised. Razorpay does not say whether one you win is removed, so assume it may still count. These are figures from{" "}
        <a href={RATIO_SOURCE.url} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">{RATIO_SOURCE.label}</a>, not Razorpay&apos;s own limit for your account.
      </p>
    </Card>
  );
}
