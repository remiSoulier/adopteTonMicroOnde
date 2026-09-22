"use client";

import Modal from "./Modal";
import DeleteAttributionButton from "@/app/gagnants/DeleteAttributionButton";
import type { ClosedElection, WinnersResult } from "@/lib/winners";
import { formatElectionDate } from "@/lib/winners";

export default function WinnersModal({ election, result, loading, onClose, onRetry, canDelete, onDeleted }: {
  canDelete: boolean;
  onDeleted: (reservationId: string) => void;
  election: ClosedElection;
  result: WinnersResult | null;
  loading: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  return <Modal open onClose={onClose} title={`Résultats du ${formatElectionDate(election.voting_end)}`}>
    <p className="mb-6 text-sm text-stone-600">Vote du {formatElectionDate(election.voting_start)} à 10 h au {formatElectionDate(election.voting_end)} à 10 h, heure de Paris.</p>
    {loading ? <p role="status" className="rounded-2xl bg-white p-8 text-center">Chargement des gagnants…</p>
      : result?.error ? <div role="alert" className="rounded-2xl bg-red-50 p-5 text-red-800"><p>{result.error}</p><button onClick={onRetry} className="mt-3 underline" type="button">Réessayer</button></div>
      : !result?.winners.length ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center"><h3 className="font-bold">Aucune attribution enregistrée</h3><p className="mt-2 text-sm text-stone-600">Le vote est terminé, mais aucune attribution n’est enregistrée pour cette journée.</p></div>
      : <ul className="space-y-4">{result.winners.map((winner) => <li key={winner.reservation_id} className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row">
        {winner.photo_url && <img src={winner.photo_url} alt={winner.legende || `Participation de ${winner.pseudo}`} className="h-32 w-full rounded-xl object-cover sm:w-32" loading="lazy" />}
        <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-widest text-orange-700">Gagnant</p><h3 className="mt-1 break-words text-xl font-bold">{winner.pseudo}</h3>{winner.legende && <p className="mt-2 break-words text-sm text-stone-500">{winner.legende}</p>}<p className="mt-3 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-950">Micro-ondes attribué : <strong>{winner.microwave_name}</strong></p>
          {canDelete && <DeleteAttributionButton reservationId={winner.reservation_id} day={election.day} pseudo={winner.pseudo} microwaveName={winner.microwave_name} onDeleted={onDeleted} />}
        </div>
      </li>)}</ul>}
  </Modal>;
}
