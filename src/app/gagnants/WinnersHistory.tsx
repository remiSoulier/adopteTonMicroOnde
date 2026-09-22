"use client";

import { useRef, useState } from "react";
import { loadWinners } from "./actions";
import WinnersModal from "@/components/WinnersModal";
import { formatElectionDate, type ClosedElection, type WinnersResult } from "@/lib/winners";

export default function WinnersHistory({ elections, canDelete }: { elections: ClosedElection[]; canDelete: boolean }) {
  const [selected, setSelected] = useState<ClosedElection | null>(null);
  const [result, setResult] = useState<WinnersResult | null>(null);
  const [loading, setLoading] = useState(false);
  const request = useRef(0);
  function removeFromResults(reservationId: string) {
    setResult((current) => current ? { ...current, winners: current.winners.filter((winner) => winner.reservation_id !== reservationId) } : current);
  }
  async function open(election: ClosedElection) {
    const id = ++request.current;
    setSelected(election);
    setResult(null);
    setLoading(true);
    try {
      const response = await loadWinners(election.day);
      if (request.current === id) setResult(response);
    } catch {
      if (request.current === id) setResult({ winners: [], error: "La connexion a échoué. Réessaie." });
    } finally {
      if (request.current === id) setLoading(false);
    }
  }
  function close() { request.current++; setSelected(null); }
  return <>
    <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
      {elections.map((election) => <li key={election.day}><button type="button" onClick={() => void open(election)} className="h-full w-full rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-orange-400 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600">
        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">Vote terminé</span>
        <h2 className="mt-4 text-xl font-bold capitalize">{formatElectionDate(election.voting_end)}</h2>
        <p className="mt-2 text-sm text-stone-500">Clôture à 10 h · {election.photo_count} photo{election.photo_count > 1 ? "s" : ""}</p>
        <p className="mt-5 font-semibold text-orange-700">Voir les gagnants <span aria-hidden="true">→</span></p>
      </button></li>)}
    </ul>
    {selected && <WinnersModal key={selected.day} canDelete={canDelete} onDeleted={removeFromResults} election={selected} result={result} loading={loading} onClose={close} onRetry={() => void open(selected)} />}
  </>;
}
