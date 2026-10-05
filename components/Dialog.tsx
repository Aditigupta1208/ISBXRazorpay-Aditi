"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Native dialog: traps focus, closes on Escape. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dlg-title"
      className="m-auto w-[calc(100%-32px)] max-w-[480px] rounded-2xl border border-line bg-white p-6 shadow-xl backdrop:bg-black/40"
    >
      <h2 id="dlg-title" className="mb-3 text-lg font-semibold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
