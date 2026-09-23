"use client";

import { useActionState, useState } from "react";
import { manageMicrowave } from "./actions";

export type Microwave = { id: string; nom: string; is_active: boolean; can_delete: boolean };

export default function MicrowaveForm({ microwave }: { microwave?: Microwave }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(microwave?.nom ?? "");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [result, action, pending] = useActionState(async (previous: Awaited<ReturnType<typeof manageMicrowave>> | null, form: FormData) => {
        const response = await manageMicrowave(previous, form);
        if (response.success) {
            setEditing(false);
            setConfirmDelete(false);
            if (!microwave) setName("");
        }
        return response;
    }, null);
    const inputId = `nom-${microwave?.id ?? "new"}`;
    const deletionHelpId = `deletion-help-${microwave?.id ?? "new"}`;
    const isEditing = !microwave || editing;

    return <form action={action} className="card" aria-busy={pending}>
        <input type="hidden" name="id" value={microwave?.id ?? ""} />
        {microwave && <p className={`status-badge mb-3 ${microwave.is_active ? "status-won" : "status-lost"}`}>{microwave.is_active ? "Actif" : "Désactivé"}</p>}
        {isEditing ? <>
            <label htmlFor={inputId} className="block font-bold">{microwave ? "Modifier le nom du micro-ondes" : "Ajouter un micro-ondes"}</label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
                <input id={inputId} name="nom" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} disabled={pending} placeholder="Ex. Micro-ondes cuisine" className="input min-w-0 flex-1" />
                <button type="submit" name="operation" value="save" disabled={pending} className="btn-primary">{pending ? "Enregistrement…" : "Enregistrer"}</button>
                {microwave && <button type="button" disabled={pending} onClick={() => { setEditing(false); setName(microwave.nom); }} className="btn-white">Annuler</button>}
            </div>
        </> : <>
            <h3 className="wrap-break-word text-lg font-bold">{microwave.nom}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" disabled={pending} onClick={() => { setName(microwave.nom); setConfirmDelete(false); setEditing(true); }} className="btn-white">Modifier</button>
                <button type="submit" name="operation" value={microwave.is_active ? "deactivate" : "activate"} disabled={pending} className="btn-white">{microwave.is_active ? "Désactiver" : "Activer"}</button>
                <button type="button" disabled={pending || !microwave.can_delete || confirmDelete} aria-describedby={!microwave.can_delete ? deletionHelpId : undefined} onClick={() => setConfirmDelete(true)} className="btn-danger disabled:cursor-not-allowed">Supprimer</button>
            </div>
            {!microwave.can_delete && <p id={deletionHelpId} className="mt-3 text-sm text-stone-500">Suppression disponible lorsque toutes les réservations datent de plus de deux jours. Les réservations à venir ou sans date bloquent aussi la suppression.</p>}
        </>}
        {!isEditing && confirmDelete && microwave?.can_delete && <div className="card card-pink mt-4 px-4 py-3">
            <p className="text-sm">Retirer « {microwave.nom} » de la liste ? L’appareil ne pourra plus être attribué. L’historique des réservations sera conservé.</p>
            <div className="mt-3 flex flex-wrap gap-3">
                <button type="submit" name="operation" value="delete" disabled={pending} className="btn-danger px-3 py-2 text-sm">Confirmer la suppression</button>
                <button type="button" disabled={pending} onClick={() => setConfirmDelete(false)} className="btn-white px-3 py-2 text-sm">Annuler</button>
            </div>
        </div>}
        {result?.error && <p role="alert" className="mt-3 text-sm text-red-700">{result.error}</p>}
        {result?.success && <p role="status" className="mt-3 text-sm text-green-800">{result.success}</p>}
    </form>;
}
