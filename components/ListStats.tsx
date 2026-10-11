"use client";
import { useEffect, useState } from "react";
import { formatInr } from "@/lib/format";
import { readAction } from "@/lib/useCaseState";

export interface StatRow {
  id: string;
  inrNumber: number;
  hours: number;
  call: string | null;
}

/**
 * The three tiles above the list. A dispute counts as "needing a decision" until the merchant has contested or folded it
 * (that choice is kept in the browser), and Chargeback Shield disputes never count because there is nothing to decide.
 */
export function ListStats({ rows, rateLabel }: { rows: StatRow[]; rateLabel: string }) {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    const read = () => setDone(rows.filter((r) => readAction(r.id)).map((r) => r.id));
    read();
    window.addEventListener("pageshow", read); // coming back with the browser's Back button
    return () => window.removeEventListener("pageshow", read);
  }, [rows]);

  const open = rows.filter((r) => r.call !== "shield" && !done.includes(r.id));
  const atStake = open.reduce((s, r) => s + r.inrNumber, 0);
  const due24 = open.filter((r) => r.hours < 24).length;
  const handled = rows.filter((r) => r.call !== "shield" && done.includes(r.id)).length;

  return (
    <>
      <div className={`${handled > 0 ? "mb-2" : "mb-4"} grid grid-cols-3 gap-2 md:gap-4`} data-testid="list-stats">
        <Stat label="Need a decision" value={String(open.length)} />
        <Stat label={`At stake (${rateLabel})`} value={formatInr(atStake)} />
        <Stat label="Due within 24 hours" value={String(due24)} warn />
      </div>
      {handled > 0 && (
        <p className="mb-4 text-[13px] text-helper" data-testid="handled-note">
          {handled} you have already contested or folded {handled === 1 ? "is" : "are"} not counted.
        </p>
      )}
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.03)] md:p-[22px]">
      <span className="block text-[13px] leading-4 text-helper">{label}</span>
      <b className={`text-[24px] font-semibold ${warn && value !== "0" ? "text-warn" : ""}`}>{value}</b>
    </div>
  );
}
