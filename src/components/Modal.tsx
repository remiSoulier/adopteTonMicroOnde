"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalProps = { open: boolean; onClose: () => void; title: string; children: ReactNode; variant?: "default" | "playful" };

export default function Modal({ open, onClose, title, children, variant = "default" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  const panelClass = variant === "playful"
    ? "modal-panel fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto p-0 backdrop:bg-[#17112b]/60"
    : "fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border-0 bg-[#faf7f2] p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/60";
  const closeClass = variant === "playful"
    ? "modal-close flex size-10 shrink-0 items-center justify-center text-xl focus-visible:outline-2 focus-visible:outline-orange-600"
    : "flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-xl hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-orange-600";

  return (
    <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className={panelClass}>
      <div className="p-5 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-black">{title}</h2>
          <button type="button" onClick={onClose} autoFocus aria-label={`Fermer — ${title}`} className={closeClass}>×</button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
