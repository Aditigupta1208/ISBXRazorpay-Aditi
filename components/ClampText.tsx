"use client";
import { useState } from "react";

const LIMIT = 260;

/** Long pasted documents show a few lines with "Show more", so one big paste does not push the rest of the page away. */
export function ClampText({ text, className = "" }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > LIMIT;
  return (
    <>
      <p className={`${className} ${long && !open ? "line-clamp-3" : ""} break-words`} data-testid="doc-text">
        {text}
      </p>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="relative mt-0.5 block min-h-6 text-[12px] font-semibold text-brand underline after:absolute after:-inset-2 after:content-['']">
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </>
  );
}
