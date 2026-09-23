"use client";

import { useState, useTransition } from "react";
import { cancelElection } from "./action";

export default function CancelElectionButton({ votingDay }: { votingDay: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cancel() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await cancelElection(votingDay);
        if (result.error) setError(result.error);
      } catch { setError("Annulation non confirmée. Actualise la page avant de réessayer."); }
    });
  }

  return (
    <section aria-label="Annulation de l’élection" className="card mb-6">
      <h2 className="font-bold">Annuler l’élection en cours</h2>
      <p className="mt-2 text-sm text-stone-600">Les votes seront bloqués jusqu’à la prochaine ouverture à 10 h. Aucune attribution ne sera possible pour cette élection. Les photos et les votes déjà reçus seront conservés.</p>
      {!confirming ? <button type="button" onClick={() => setConfirming(true)} className="btn-danger mt-4">Annuler l’élection</button> : (
        <div className="card card-pink mt-4">
          <p className="text-sm">Confirmer l’annulation définitive de cette période de vote ?</p>
          <div className="mt-3 flex flex-wrap gap-4">
            <button type="button" onClick={cancel} disabled={pending} className="btn-danger">{pending ? "Annulation…" : "Confirmer l’annulation"}</button>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="btn-white">Conserver l’élection</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
