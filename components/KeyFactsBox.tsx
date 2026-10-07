"use client";
import { useState } from "react";
import type { KeyFactsResult } from "@/lib/assistCore";

const btn = "min-h-11 rounded-[10px] px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

/** What the AI read in each document, as up to three lines per document. Every line was matched to a word-for-word quote. */
export function KeyFactsButton({
  caseId,
  added,
  result,
  onResult,
  disabled,
}: {
  caseId: string;
  added: { title: string; content: string }[];
  result: KeyFactsResult | undefined;
  onResult: (r: KeyFactsResult) => void;
  disabled?: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/assist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "keyfacts", caseId, added }) });
      const r = (await res.json()) as KeyFactsResult;
      if (r.status === "live" || r.status === "saved") onResult(r);
      else setError(r.message);
    } catch {
      setError("That didn't work just now. Try again in a moment.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mt-3" data-testid="keyfacts">
      <button className={`${btn} border border-[#D6D6D6] bg-white text-[#111]`} onClick={run} disabled={running || disabled}>
        {running ? "Reading your documents…" : result ? "Read again" : "Read key facts"}
      </button>
      {running && (
        <p className="mt-2 text-[12px] text-helper" data-testid="wait-note">
          Connecting to the AI model. On this demo it can take up to a minute. If it cannot answer, you will see a saved example where one exists.
        </p>
      )}
      {error && <p className="mt-2 text-[14px] text-escalate" role="alert">{error}</p>}
      {result && !running && (
        <p className="mt-2 text-[12px] text-helper" data-testid="keyfacts-source">
          {result.status === "live"
            ? `Key facts by AI (${result.model}, ${result.promptVersion})${result.cached ? ", from the cache" : ""}. Each line is backed by a quote from the document; hover or tap a line to see it.${result.dropped ? ` ${result.dropped} line${result.dropped === 1 ? "" : "s"} could not be matched to the document and ${result.dropped === 1 ? "was" : "were"} left out.` : ""}`
            : result.status === "saved"
              ? `${result.label}. ${result.message}`
              : ""}
        </p>
      )}
    </div>
  );
}

/** The facts for one document, shown under it. */
export function KeyFactLines({ docs, id }: { docs: { id: string; facts: { fact: string; quote: string }[] }[]; id: string }) {
  const d = docs.find((x) => x.id === id);
  if (!d) return null;
  return (
    <ul className="mt-1.5 space-y-1 rounded-lg bg-[#F4F8FF] px-3 py-2" data-testid={`keyfacts-${id}`} aria-label={`Key facts for ${id}`}>
      {d.facts.map((f, i) => (
        <li key={i} className="text-[14px]" title={`“${f.quote}”`}>
          <span aria-hidden className="mr-1.5 text-brand">•</span>
          {f.fact}
          <details className="ml-4 inline-block align-top sm:ml-2">
            <summary className="relative inline-flex min-h-8 cursor-pointer items-center text-[12px] font-semibold text-brand after:absolute after:-inset-x-2 after:inset-y-0 after:content-['']">quote</summary>
            <span className="block text-[12px] text-[#555] italic">“{f.quote}”</span>
          </details>
        </li>
      ))}
    </ul>
  );
}
