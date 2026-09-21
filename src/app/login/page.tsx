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
        <main>
            <div className="flex flex-col items-center">
                <h1>{mode === "login" ? "Connexion" : "Inscription"}</h1>
                <form className="flex flex-col gap-4 items-center card w-1/2" onSubmit={handleSubmit}>
                    <div className="flex flex-col">
                        <label className="text-sm">Pseudo</label>
                        <input
                            required
                            placeholder="Pseudo"
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm">Mot de passe</label>
                        <input
                            required
                            placeholder="Mot de passe"
                            type="password"
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                        />
                    </div>

                    {error && <p role="alert" className="text-red-500">{error}</p>}
                    <button disabled={loading} type="submit" className="btn-primary">
                        {mode === "login" ? "Se connecter" : "S'inscrire"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode(mode === "login" ? "signup" : "login")}
                        className="text-sm underline"
                    >
                        {mode === "login" ? "Pas de compte ? Inscrivez-vous" : "Déjà un compte ? Se connecter"}
                    </button>
                </form>
            </div>
        </main>

    )
}
