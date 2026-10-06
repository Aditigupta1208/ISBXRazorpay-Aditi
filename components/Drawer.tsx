"use client";
import { useEffect, useRef, type ReactNode } from "react";

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onCloseRef.current();
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = [...panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select,textarea,summary,[tabindex]:not([tabindex='-1'])")].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!panelRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); opener?.focus?.(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-[420px] overflow-y-auto bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button ref={closeRef} onClick={onClose} className="min-h-11 rounded-[10px] border border-[#D6D6D6] px-4 font-semibold">
            Close
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
