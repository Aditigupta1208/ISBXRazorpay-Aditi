"use client";
import { useState } from "react";

interface Report {
  total: Record<string, number>;
  days: Record<string, Record<string, number>>;
  headline: { visitors: number; disputesOpened: number; distinctDisputes: number; reruns: number; uploads: number; submits: number; folds: number; outcomes: number; resultsViews: number; topDisputes: [string, number][] };
}

/** Builder only. The token is typed in, kept in memory, and sent as a header; it is never stored. */
export function UsageReport() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Report | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/usage", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (res.status === 404) setMsg("Not set up: add USAGE_ADMIN_TOKEN on the server.");
      else if (res.status === 401) setMsg("That token is not right.");
      else if (res.status === 503) setMsg("No database is connected yet.");
      else if (!res.ok) setMsg("Could not read the counts.");
      else setData((await res.json()) as Report);
    } catch {
      setMsg("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const h = data?.headline;
  const days = data ? Object.entries(data.days).sort((a, b) => (a[0] < b[0] ? 1 : -1)) : [];
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); void load(); }} className="mb-4 flex max-w-[480px] gap-2">
        <label htmlFor="tok" className="sr-only">Admin token</label>
        <input id="tok" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" className="min-h-11 flex-1 rounded-lg border border-line px-3 text-[14px]" />
        <button type="submit" disabled={!token || busy} className="min-h-11 rounded-lg bg-brand px-4 text-[14px] font-medium text-white disabled:opacity-50">{busy ? "Loading…" : "Show counts"}</button>
      </form>
      <p role="status" className="mb-3 text-[14px] text-escalate">{msg}</p>
      {h && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Visitors", h.visitors],
              ["Disputes opened", h.disputesOpened],
              ["Submitted", h.submits],
              ["Folded", h.folds],
              ["Outcomes marked", h.outcomes],
              ["Re-runs", h.reruns],
              ["Uploads", h.uploads],
              ["Results views", h.resultsViews],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-2xl border border-line bg-white p-3.5"><div className="text-[13px] text-helper">{k}</div><div className="text-2xl font-semibold">{v}</div></div>
            ))}
          </div>
          <p className="mb-4 text-[14px]">Most opened: {h.topDisputes.length ? h.topDisputes.map(([id, n]) => `${id} (${n})`).join(", ") : "none yet"}. {h.distinctDisputes} different disputes opened.</p>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">Counts by day</caption>
              <thead className="text-[13px] text-helper"><tr><th scope="col" className="px-3 py-2 font-medium">Day (UTC)</th><th scope="col" className="px-3 py-2 font-medium">Visitors</th><th scope="col" className="px-3 py-2 font-medium">Submitted</th><th scope="col" className="px-3 py-2 font-medium">Folded</th></tr></thead>
              <tbody>
                {days.length === 0 && <tr><td colSpan={4} className="px-3 py-3 text-helper">No activity in the last 14 days.</td></tr>}
                {days.map(([d, m]) => (
                  <tr key={d} className="border-t border-line"><th scope="row" className="px-3 py-2 font-medium">{d}</th><td className="px-3 py-2">{m.new_visitor ?? 0}</td><td className="px-3 py-2">{m.submit ?? 0}</td><td className="px-3 py-2">{m.fold ?? 0}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
