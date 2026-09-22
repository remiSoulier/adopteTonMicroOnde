"use client"

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";


export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [pseudo, setPseudo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const EMAIL_DOMAIN = "microonde.app";
    const toEmail = (pseudo: string) =>
        `${pseudo.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
    
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const email = toEmail(pseudo);

        const { error } = mode === "login"
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password, options: { data: { pseudo: pseudo.trim() } } });
        setLoading(false);
        if (error) {
            setError(
                error.message.includes("already registered")
                    ? "Ce pseudo est déjà pris."
                    : error.message.includes("Invalid login credentials")
                        ? "Pseudo ou mot de passe incorrect."
                        : error.message,
            );
            return;
        }
        router.push("/participation");
        router.refresh();
    }

    return (
        <main className="flex w-full my-50">
            <div className="flex flex-col items-start justify-center gap-4 w-1/2 px-16">
                <div className="flex flex-col items-start gap-3">
                    <h2 className="label-tag label-yellow text-4xl xl:text-6xl">Un pseudo.</h2>
                    <h2 className="label-tag label-green text-4xl xl:text-6xl">Un mot de passe.</h2>
                    <h2 className="label-tag label-pink text-4xl xl:text-6xl">Zéro email.</h2>
                </div>
                <p className="text-lg max-w-md">
                    Ton pseudo, c&apos;est ton nom sur le podium du jour.
                    Choisis-le comme si ta réputation en dépendait.
                    Elle en dépend.
                </p>
                <p className="note text-lg">(on a vraiment supprimé les emails)</p>
            </div>
            <div className="flex flex-col gap-4 card items-center w-1/3 ">
                <div role="tablist" className="tabs w-full mb-6">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "login"}
                        onClick={() => setMode("login")}
                        className="tab"
                    >
                        Connexion
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "signup"}
                        onClick={() => setMode("signup")}
                        className="tab"
                    >
                        Inscription
                    </button>
                </div>
                <h1>Besoin de chauffer ?</h1>
                <form className="flex flex-col gap-4 items-center w-full" onSubmit={handleSubmit}>
                    <div className="flex flex-col w-full gap-1">
                        <label className="text-sm font-bold">Pseudo</label>
                        <input
                            required
                            placeholder="Pseudo"
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            className="input w-full"
                        />
                    </div>
                    <div className="flex flex-col w-full gap-1">
                        <label className="text-sm font-bold">Mot de passe</label>
                        <input
                            required
                            placeholder="Mot de passe"
                            type="password"
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input w-full"
                        />
                    </div>

                    {error && <p role="alert" className="text-sm font-bold text-red-600">{error}</p>}

                    <button disabled={loading} type="submit" className="btn-primary w-full">
                        {mode === "login" ? "Se connecter" : "S'inscrire"}
                    </button>
                    <span className="text-sm">Pas encore de compte ? C&apos;est gratuit</span>
                </form>
            </div>
        </main>

    )
}
