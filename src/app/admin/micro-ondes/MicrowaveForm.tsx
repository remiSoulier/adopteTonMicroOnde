"use client";

import { useActionState, useState } from "react";
import { manageMicrowave } from "./actions";

export type Microwave = { id: string; nom: string; is_active: boolean; can_delete: boolean };

export default function MicrowaveForm({ microwave }: { microwave?: Microwave }) {
    const [result, action, pending] = useActionState(manageMicrowave, null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const inputId = `nom-${microwave?.id ?? "new"}`;
    return <form action={action} className="rounded-2xl border border-stone-200 bg-white p-5">
        <input type="hidden" name="id" value={microwave?.id ?? ""} />
        {microwave && <p className={`mb-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${microwave.is_active ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-600"}`}>{microwave.is_active ? "Actif" : "Désactivé"}</p>}
        <label htmlFor={inputId} className="block font-bold">{microwave ? "Nom du micro-ondes" : "Ajouter un micro-ondes"}</label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
            <input id={inputId} name="nom" defaultValue={microwave?.nom ?? ""} required maxLength={100} disabled={pending} placeholder="Ex. Micro-ondes cuisine" className="min-w-0 flex-1 rounded-xl border border-stone-300 px-4 py-3 focus:outline-orange-600" />
            <button name="operation" value="save" disabled={pending} className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-50">{pending ? "En cours…" : microwave ? "Enregistrer" : "Ajouter"}</button>
            {microwave && <button name="operation" value={microwave.is_active ? "deactivate" : "activate"} formNoValidate disabled={pending} className="rounded-xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 disabled:opacity-50">{microwave.is_active ? "Désactiver" : "Activer"}</button>}
            {microwave && microwave.can_delete && !confirmDelete && <button type="button" disabled={pending} onClick={() => setConfirmDelete(true)} className="rounded-xl border border-red-200 px-4 py-3 text-red-700 disabled:opacity-50">Supprimer</button>}
        </div>
        {microwave && !microwave.can_delete && <p className="mt-3 text-sm text-stone-500">Suppression disponible lorsque toutes les réservations datent de plus de deux jours. Les réservations à venir ou sans date bloquent aussi la suppression.</p>}
        {confirmDelete && microwave?.can_delete && <div className="mt-4 rounded-xl bg-red-50 p-4">
            <p className="text-sm text-red-900">Retirer « {microwave?.nom} » de la liste ? L’appareil ne pourra plus être attribué. L’historique des réservations sera conservé.</p>
            <div className="mt-3 flex gap-4">
                <button name="operation" value="delete" formNoValidate disabled={pending} className="font-semibold text-red-700 disabled:opacity-50">Confirmer la suppression</button>
                <button type="button" disabled={pending} onClick={() => setConfirmDelete(false)} className="text-stone-600">Annuler</button>
            </div>
        </div>}
        {result?.error && <p role="alert" className="mt-3 text-sm text-red-700">{result.error}</p>}
        {result?.success && <p role="status" className="mt-3 text-sm text-green-800">{result.success}</p>}
    </form>;
}
