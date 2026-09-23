"use client";
import { useState, useTransition } from "react";
import { draw } from "./action";
import type { ActionResult } from "./types";
export default function DrawButton() {
    const [pending, startTransition] = useTransition();
    const [result, setResult] = useState<ActionResult | null>(null);
    function launchDraw() {
        setResult(null);
        startTransition(async () => {
            try {
                setResult(await draw());
            }
            catch {
                setResult({ error: "Le résultat du tirage n’a pas pu être confirmé. Vérifie les attributions avant de réessayer." });
            }
        });
    }
    return (<section aria-label="Tirage superadmin" className="card mb-6">
            <p className="font-bold">Administration de l’élection</p>
            <p className="mt-1 text-sm text-stone-600">Attribue les micro-ondes selon les votes de la dernière période clôturée à 10 h (heure de Paris). Un appareil par gagnant ; en cas d’égalité, la photo la plus ancienne passe devant.</p>
            <button type="button" onClick={launchDraw} disabled={pending || Boolean(result?.success)} className="btn-primary mt-4">
                {pending ? "Attribution en cours…" : result?.success ? "Attributions enregistrées" : "Attribuer selon les votes"}
            </button>
            {result?.error && <p role="alert" className="mt-3 text-sm text-red-700">{result.error}</p>}
            {result?.success && <p role="status" className="mt-3 text-sm text-green-800">{result.success}</p>}
        </section>);
}
