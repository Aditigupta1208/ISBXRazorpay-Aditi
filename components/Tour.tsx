"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TOUR_STEPS } from "@/lib/tourSteps";

const KEY = "da:v1:tour-step";
export const TOUR_EVENT = "da:tour-start";

function read(): number | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v === null) return null;
    const n = Number(v);
    return Number.isInteger(n) && n >= 0 && n < TOUR_STEPS.length ? n : null;
  } catch {
    return null;
  }
}
function write(n: number | null) {
  try {
    if (n === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, String(n));
  } catch { /* storage may be blocked; the tour still works for this page view */ }
}

/** Opens the tour from anywhere (the banner link, the starter box). */
export function startTour() {
  window.dispatchEvent(new Event(TOUR_EVENT));
}

export function Tour() {
  const router = useRouter();
  const path = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (n: number | null) => {
      setStep(n);
      write(n);
      if (n !== null && TOUR_STEPS[n].href !== path) router.push(TOUR_STEPS[n].href);
    },
    [path, router],
  );

  // Pick the tour back up after a page change or reload, and listen for the start event.
  useEffect(() => {
    setStep(read());
    const onStart = () => go(0);
    window.addEventListener(TOUR_EVENT, onStart);
    return () => window.removeEventListener(TOUR_EVENT, onStart);
  }, [go]);

  // Point at the part of the page this step is about.
  useEffect(() => {
    if (step === null || TOUR_STEPS[step].href !== path) return;
    const sel = TOUR_STEPS[step].target;
    let el: HTMLElement | null = null;
    const timer = setTimeout(() => {
      el = sel ? document.querySelector<HTMLElement>(sel) : null;
      if (!el) return;
      el.style.outline = "3px solid #2F63C8";
      el.style.outlineOffset = "4px";
      el.style.borderRadius = el.style.borderRadius || "12px";
      el.style.scrollMarginTop = "90px";
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => {
      clearTimeout(timer);
      if (el) {
        el.style.outline = "";
        el.style.outlineOffset = "";
      }
    };
  }, [step, path]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") go(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, go]);

  if (step === null) return null;
  const s = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;

  return (
    <div
      ref={cardRef}
      role="region"
      aria-label="Guided tour"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[460px] rounded-2xl border border-brand bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.18)] print:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-[.6px] text-helper uppercase">Tour · {step + 1} of {TOUR_STEPS.length}</p>
        <button type="button" onClick={() => go(null)} className="-mt-1 -mr-1 min-h-10 min-w-10 text-[13px] font-semibold text-helper underline">
          Close
        </button>
      </div>
      <div aria-live="polite">
        <h2 className="mt-0.5 text-[16px] font-semibold">{s.title.replace(/^\d+\.\s*/, "")}</h2>
        <p className="mt-1 text-[14px] text-[#333]">{s.text}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="min-h-11 rounded-[10px] border border-[#D6D6D6] bg-white px-4 text-sm font-semibold disabled:opacity-40">
          Back
        </button>
        <button type="button" onClick={() => go(last ? null : step + 1)} className="min-h-11 rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-focus">
          {last ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
