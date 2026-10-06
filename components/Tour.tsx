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

const GLIDE = "top .35s ease, left .35s ease, width .35s ease, height .35s ease, opacity .2s ease";

export function Tour() {
  const router = useRouter();
  const path = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);

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

  // Find the part of the page this step is about (it may still be rendering after a page change), reveal and scroll to it.
  useEffect(() => {
    targetRef.current = null;
    if (step === null || TOUR_STEPS[step].href !== path) return;
    const s = TOUR_STEPS[step];
    let el: HTMLElement | null = null;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const find = () => {
      el = s.target
        ? (Array.from(document.querySelectorAll<HTMLElement>(s.target)).find((e) => e.getBoundingClientRect().height > 0) ?? null)
        : null;
      if (!el) {
        if (s.target && ++tries < 12) timer = setTimeout(find, 150);
        return;
      }
      if (s.reveal) el.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')?.click();
      el.style.scrollMarginTop = "90px";
      timer = setTimeout(() => {
        if (!el) return;
        el.scrollIntoView({ behavior: "auto", block: "start" });
        requestAnimationFrame(() => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          const ch = cardRef.current?.offsetHeight ?? 220;
          const vh = window.innerHeight;
          const fitsBelow = r.bottom + 14 + ch <= vh - 12;
          const phone = window.innerWidth < 640;
          // Card will sit at the bottom: keep the target above it when the target is short enough.
          if ((phone || !fitsBelow) && r.height < vh - ch - 120 && r.bottom > vh - ch - 24) window.scrollBy({ top: r.bottom - (vh - ch - 24) });
          targetRef.current = el;
        });
      }, s.reveal ? 160 : 0);
    };
    timer = setTimeout(find, 250);
    return () => {
      clearTimeout(timer);
      if (el) el.style.scrollMarginTop = "";
    };
  }, [step, path]);

  // Keep the spotlight on the target and the card next to it, every frame while the tour is open.
  useEffect(() => {
    if (step === null) return;
    const spot = spotRef.current;
    const card = cardRef.current;
    if (!spot || !card) return;
    spot.style.transition = GLIDE;
    card.style.transition = GLIDE;
    const settle = setTimeout(() => { spot.style.transition = "opacity .2s ease"; card.style.transition = "none"; }, 500);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cw = Math.min(380, vw - 24);
      const ch = card.offsetHeight;
      const el = targetRef.current && document.contains(targetRef.current) ? targetRef.current : null;
      let cTop = vh - ch - 12;
      let cLeft = (vw - cw) / 2;
      if (el) {
        const r = el.getBoundingClientRect();
        const top = Math.max(r.top - 6, 6);
        const bottom = Math.min(r.bottom + 6, vh - 6);
        const left = Math.max(r.left - 6, 6);
        const right = Math.min(r.right + 6, vw - 6);
        const visible = bottom > top && right > left;
        spot.style.opacity = visible ? "1" : "0";
        if (visible) {
          spot.style.top = top + "px";
          spot.style.left = left + "px";
          spot.style.width = right - left + "px";
          spot.style.height = bottom - top + "px";
        }
        if (vw >= 640 && visible) {
          cLeft = Math.min(Math.max(left, 12), vw - cw - 12);
          if (bottom + 14 + ch <= vh - 12) cTop = bottom + 14;
          else if (top - 14 - ch >= 12) cTop = top - 14 - ch;
        }
      } else {
        spot.style.opacity = "0";
      }
      card.style.top = cTop + "px";
      card.style.left = cLeft + "px";
      card.style.width = cw + "px";
    };
    tick();
    return () => { cancelAnimationFrame(raf); clearTimeout(settle); };
  }, [step]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape") go(null);
      else if (e.key === "ArrowRight" && step < TOUR_STEPS.length - 1) go(step + 1);
      else if (e.key === "ArrowLeft" && step > 0) go(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, go]);

  if (step === null) return null;
  const s = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;

  return (
    <>
      <div
        ref={spotRef}
        data-tour-spot
        aria-hidden
        className="pointer-events-none fixed z-40 rounded-xl opacity-0 shadow-[0_0_0_2px_#fff,0_0_0_9999px_rgba(8,12,24,.55)] print:hidden"
      />
      <div
        ref={cardRef}
        role="region"
        aria-label="Guided tour"
        className="fixed z-50 rounded-2xl bg-[#0E1424] p-4 text-white shadow-[0_12px_40px_rgba(0,0,0,.45)] ring-1 ring-white/15 print:hidden"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold tracking-[.6px] text-[#9FB0D6] uppercase">{s.audience === "reviewers" ? "For reviewers" : "Tour"} · {step + 1} of {TOUR_STEPS.length}</p>
          <button type="button" onClick={() => go(null)} className="-mt-1 -mr-1 min-h-10 min-w-10 text-[13px] font-semibold text-[#9FB0D6] underline">
            Close
          </button>
        </div>
        <div className="mt-1 flex gap-1" aria-hidden>
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[#7BA2F5]" : "bg-white/20"}`} />
          ))}
        </div>
        <div aria-live="polite">
          <h2 className="mt-3 text-[16px] font-semibold">{s.title.replace(/^\d+\.\s*/, "")}</h2>
          <p className="mt-1 text-[14px] leading-[21px] text-[#D5DDF0]">{s.text}</p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="min-h-11 rounded-[10px] border border-white/25 px-4 text-sm font-semibold text-white disabled:opacity-35">
            Back
          </button>
          <button type="button" onClick={() => go(last ? null : step + 1)} className="min-h-11 rounded-[10px] bg-white px-5 text-sm font-semibold text-[#0E1424] hover:bg-[#E6ECFA]">
            {last ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}
