"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalProps = { open: boolean; onClose: () => void; title: string; children: ReactNode };

export default function Modal({ open, onClose, title, children }: ModalProps) {
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

  return (
    <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border-0 bg-[#faf7f2] p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/60">
      <div className="p-5 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-black">{title}</h2>
          <button type="button" onClick={onClose} autoFocus aria-label="Fermer les résultats" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-xl hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-orange-600">×</button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
