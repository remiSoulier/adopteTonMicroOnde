"use client";

import { useState, useTransition } from "react";
import { deleteAttribution } from "./actions";

export default function DeleteAttributionButton({ reservationId, day, pseudo, microwaveName, onDeleted }: {
  reservationId: string;
  day: string;
  pseudo: string;
  microwaveName: string;
  onDeleted: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteAttribution(reservationId, day);
        if (result.error) setError(result.error);
        else onDeleted(reservationId);
      } catch {
        setError("Suppression non confirmée. Recharge les résultats avant de réessayer.");
      }
    });
  }

  return (
    <div className="mt-4">
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
          Supprimer l’attribution
        </button>
      ) : (
        <div className="rounded-xl bg-red-50 p-4">
          <p className="text-sm text-red-900">Supprimer l’attribution de « {microwaveName} » à {pseudo} pour cette journée ?</p>
          <div className="mt-3 flex flex-wrap gap-4">
            <button type="button" onClick={remove} disabled={pending} className="font-semibold text-red-700 disabled:opacity-50">
              {pending ? "Suppression…" : "Confirmer la suppression"}
            </button>
            <button type="button" onClick={() => { setConfirming(false); setError(null); }} disabled={pending} className="text-stone-600 disabled:opacity-50">Annuler</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
