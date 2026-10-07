"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CallChip } from "@/components/CallChip";
import type { Call } from "@/lib/types";
import { readAction } from "@/lib/useCaseState";

export interface Row {
  id: string;
  disputeId: string;
  merchant: string;
  amount: string;
  inr: string;
  inrNumber: number;
  reasonCode: string;
  reason: string;
  timeText: string;
  warn: boolean;
  hours: number;
  call: Call | null;
}

const FILTERS: { key: "all" | Call; label: string }[] = [
  { key: "all", label: "All" },
  { key: "fight", label: "Fight" },
  { key: "fold", label: "Fold" },
  { key: "escalate", label: "Escalate" },
  { key: "shield", label: "Chargeback Shield" },
];

const EDGE_BAR: Record<string, string> = {
  fight: "shadow-[inset_4px_0_0_#0F7B4F]",
  fold: "shadow-[inset_4px_0_0_#8A4B08]",
  escalate: "shadow-[inset_4px_0_0_#B42318]",
  shield: "shadow-[inset_4px_0_0_#475569]",
};
const EDGE_LEFT: Record<string, string> = { fight: "border-l-fight", fold: "border-l-fold", escalate: "border-l-escalate", shield: "border-l-shield" };

export function DisputeTable({ rows, rateNote }: { rows: Row[]; rateNote: string }) {
  const [filter, setFilter] = useState<"all" | Call>("all");
  const [actions, setActions] = useState<Record<string, string>>({});

  useEffect(() => {
    const a: Record<string, string> = {};
    for (const r of rows) {
      const x = readAction(r.id);
      if (x) a[r.id] = x.type === "submit" ? "Contested (simulated)" : "Folded (simulated)";
    }
    setActions(a);
  }, [rows]);

  const shown = rows.filter((r) => filter === "all" || r.call === filter);

  const download = () => {
    const head = ["dispute_id", "merchant", "amount", "amount_inr", "reason_code", "reason", "hours_left", "call", "status"];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = shown.map((r) => [r.disputeId, r.merchant, r.amount, Math.round(r.inrNumber), r.reasonCode, r.reason, r.hours, r.call ?? "", actions[r.id] ?? "Open"].map(esc).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "disputes-demo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-[18px] py-3">
        <div role="group" aria-label="Filter by call" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`min-h-10 rounded-full border px-3.5 text-[12px] font-semibold ${filter === f.key ? "border-brand bg-brand-soft text-[#2B5BC8]" : "border-[#D6D6D6] bg-white text-[#333]"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={download} className="ml-auto min-h-10 rounded-[10px] border border-[#D6D6D6] px-3.5 text-[12px] font-semibold">
          Download CSV
        </button>
      </div>
      <ul className="md:hidden" aria-label="Disputes">
        {shown.map((r) => (
          <li key={r.id} className={`border-b border-[#F1F1F1] border-l-4 last:border-b-0 ${r.call ? EDGE_LEFT[r.call] : "border-l-transparent"}`}>
            <Link href={`/disputes/${r.id}`} className="block px-4 py-3.5 active:bg-[#FAFCFF]">
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold">
                  {r.amount}
                  <span className="font-normal text-helper"> · {r.inr}</span>
                </span>
                <span className={`shrink-0 text-[14px] font-semibold ${r.warn ? "text-warn" : ""}`}>
                  {r.warn && <span aria-hidden>⚠ </span>}
                  {r.timeText} left
                </span>
              </div>
              <div className="mt-0.5 text-[12px] text-[#555]">
                <span className="rounded-md bg-[#F1F4FB] px-1.5 py-px font-mono text-[12px] text-[#344]">{r.reasonCode}</span> {r.reason}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                {r.call ? <CallChip call={r.call} /> : <span className="text-helper">Not checked</span>}
                <span className="text-[12px] text-helper">{actions[r.id] ?? r.merchant}</span>
              </div>
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="px-4 py-8 text-center text-helper">No disputes with this call.</li>}
      </ul>
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-line bg-[#FAFAFA] text-left text-[12px] font-semibold text-helper">
              <th className="px-[18px] py-3.5">Dispute</th>
              <th className="px-[18px] py-3.5">Amount</th>
              <th className="px-[18px] py-3.5">Reason</th>
              <th className="px-[18px] py-3.5 whitespace-nowrap">Time left</th>
              <th className="px-[18px] py-3.5">Call</th>
              <th className="px-[18px] py-3.5">Status</th>
              <th className="px-[18px] py-3.5">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="relative border-b border-[#F1F1F1] hover:bg-[#FAFCFF]">
                <td className={`px-[18px] py-4 ${r.call ? EDGE_BAR[r.call] : ""}`}>
                  <Link href={`/disputes/${r.id}`} className="font-mono text-[12px] text-[#555] after:absolute after:inset-0 after:content-['']">
                    {r.disputeId}
                  </Link>
                  <div className="text-[12px] text-helper">{r.merchant}</div>
                </td>
                <td className="px-[18px] py-4 font-semibold whitespace-nowrap">
                  {r.amount}
                  <span className="font-normal text-helper"> · {r.inr}</span>
                </td>
                <td className="px-[18px] py-4">
                  <span className="rounded-md bg-[#F1F4FB] px-1.5 py-px font-mono text-[12px] text-[#344]">{r.reasonCode}</span> {r.reason}
                </td>
                <td className={`px-[18px] py-4 font-semibold ${r.warn ? "text-warn" : ""}`}>
                  {r.warn && <span aria-hidden>⚠ </span>}
                  {r.timeText}
                </td>
                <td className="px-[18px] py-4">{r.call ? <CallChip call={r.call} /> : <span className="text-helper">Not checked</span>}</td>
                <td className="px-[18px] py-4 text-[14px] whitespace-nowrap">{actions[r.id] ?? <span className="text-helper">Open</span>}</td>
                <td className="px-[18px] py-4 font-semibold text-brand">Details</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-[18px] py-8 text-center text-helper">
                  No disputes with this call.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-[18px] py-3.5 text-[12px] text-helper">Calls are saved results from an earlier test run, so this list works without an API key. {rateNote}</p>
    </div>
  );
}
