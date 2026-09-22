"use client";

import { useState, useTransition } from "react";
import { draw } from "./action";

export default function DrawButton() {
    const [pending, startTransition] = useTransition();
    const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);

    function launchDraw() {
        setResult(null);
        startTransition(async () => {
            try {
                setResult(await draw());
            } catch {
                setResult({ error: "Le résultat du tirage n’a pas pu être confirmé. Vérifie les attributions avant de réessayer." });
            }
        });
    }

    return (
        <section aria-label="Tirage superadmin" className="mb-6 rounded-2xl border border-orange-200 bg-white p-6">
            <p className="font-bold">Administration de l’élection</p>
            <p className="mt-1 text-sm text-stone-600">Déclenche immédiatement le tirage et l’attribution des micro-ondes.</p>
            <button
                type="button"
                onClick={launchDraw}
                disabled={pending || Boolean(result?.success)}
                className="mt-4 rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
                {pending ? "Tirage en cours…" : result?.success ? "Tirage effectué" : "Lancer le tirage maintenant"}
            </button>
            {result?.error && <p role="alert" className="mt-3 text-sm text-red-700">{result.error}</p>}
            {result?.success && <p role="status" className="mt-3 text-sm text-green-800">{result.success}</p>}
        </section>
    );
}
