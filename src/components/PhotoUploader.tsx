"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Modal from "./Modal";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const formatTime = (value: string) =>
    new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(value));

export type TodayPhoto = { id: string; url: string; legende: string | null; created_at: string };

export default function PhotoUploader({
    userId,
    todayPhoto,
}: {
    userId: string;
    todayPhoto: TodayPhoto | null;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [legende, setLegende] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    function handleFile(e: ChangeEvent<HTMLInputElement>) {
        const picked = e.target.files?.[0];
        if (!picked) return;
        if (!picked.type.startsWith("image/")) return setError("Ce fichier n'est pas une image.");
        if (picked.size > MAX_SIZE) return setError("Image trop lourde (5 Mo max).");
        setError(null);
        setFile(picked);
        setPreview(URL.createObjectURL(picked));
    }

    async function handlePublish(e: FormEvent) {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setError(null);

        const path = `${userId}/${Date.now()}.${file.type.split("/")[1]}`;
        const { error: uploadError } = await supabase.storage
            .from("photos")
            .upload(path, file, { contentType: file.type });
        if (uploadError) {
            setError("Envoi impossible : " + uploadError.message);
            setLoading(false);
            return;
        }

        const { data } = supabase.storage.from("photos").getPublicUrl(path);
        const { error: insertError } = await supabase
            .from("photos")
            .insert({ user_id: userId, url: data.publicUrl, legende: legende.trim() });

        if (insertError) {
            await supabase.storage.from("photos").remove([path]);
            setError("Enregistrement impossible : " + insertError.message);
            setLoading(false);
            return;
        }
        router.refresh();
    }

    async function handleDelete() {
        if (!todayPhoto) return;
        setDeleting(true);
        setError(null);
        const { error: deleteError } = await supabase.rpc("delete_my_photo", { p_photo_id: todayPhoto.id });
        if (deleteError) {
            setError("Suppression impossible : " + deleteError.message);
            setDeleting(false);
            return;
        }
        const marker = "/object/public/photos/";
        const idx = todayPhoto.url.indexOf(marker);
        if (idx !== -1) {
            await supabase.storage.from("photos").remove([todayPhoto.url.slice(idx + marker.length)]);
        }
        router.refresh();
    }

    if (todayPhoto) {
        return (
            <div className="flex flex-col gap-2">
                <div className="card card-yellow flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img
                        src={todayPhoto.url}
                        alt=""
                        className="h-44 w-full rounded-xl border-2 border-foreground object-cover sm:h-32 sm:w-32 sm:shrink-0"
                    />
                    <div className="flex flex-1 flex-col gap-1">
                        <p className="dropzone-title text-xl">Ta photo du jour</p>
                        <p className="font-bold">{todayPhoto.legende || "Sans légende"}</p>
                        <p className="text-sm opacity-70">Postée à {formatTime(todayPhoto.created_at)}</p>
                    </div>
                    <button type="button" onClick={handleDelete} disabled={deleting} className="btn-white">
                        {deleting ? "Suppression…" : "Supprimer"}
                    </button>
                </div>
                {error && <p role="alert" className="text-red-500">{error}</p>}
            </div>
        );
    }

    return (
        <div>
            <label htmlFor="photo-input" className="dropzone">
                <svg width="64" height="56" viewBox="0 0 64 56" aria-hidden="true">
                    <rect x="2" y="4" width="60" height="48" rx="10" fill="#FFFFFF" stroke="var(--foreground)" strokeWidth="3" />
                    <rect x="9" y="11" width="32" height="34" rx="6" fill="var(--bg-turquoise-100)" stroke="var(--foreground)" strokeWidth="2.5" />
                    <circle cx="25" cy="28" r="11" fill="var(--bg-pink)" stroke="var(--foreground)" strokeWidth="2.5" />
                    <circle cx="25" cy="28" r="4" fill="var(--bg-turquoise-100)" stroke="var(--foreground)" strokeWidth="2" />
                    <rect x="47" y="11" width="10" height="34" rx="4" fill="#ECE6FF" stroke="var(--foreground)" strokeWidth="2.5" />
                    <circle cx="52" cy="22" r="3" fill="var(--bg-orange-600)" />
                    <circle cx="52" cy="34" r="3" fill="var(--bg-yellow)" />
                </svg>
                <p className="dropzone-title">Glisse ta photo la plus dôle </p>
                <span className="btn-dark">Choisir une image</span>
                <span className="dropzone-hint">JPEG, PNG ou WebP · 5 Mo max · une seule chance, comme à l&apos;école</span>
                <input id="photo-input" type="file" accept="image/*" onChange={handleFile} className="sr-only" />
            </label>
            {error && <p role="alert" className="text-red-500">{error}</p>}

            <Modal open={file !== null} onClose={() => setFile(null)} title="Ta photo" variant="playful">
                <form onSubmit={handlePublish} className="flex flex-col gap-4">
                    {preview && (
                        <div className="overflow-hidden rounded-2xl border-2 border-foreground">
                            <img src={preview} alt="Aperçu" className="max-h-80 w-full object-cover" />
                        </div>
                    )}
                    {file && (
                        <p className="text-sm font-bold opacity-70">
                            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} Mo
                        </p>
                    )}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between">
                            <label htmlFor="legende" className="text-sm font-bold">Légende</label>
                            <span className="text-xs font-bold opacity-70">{legende.length}/80</span>
                        </div>
                        <input
                            id="legende"
                            required
                            maxLength={80}
                            placeholder="ex. Pizza surgelée, confiance totale"
                            value={legende}
                            onChange={(e) => setLegende(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setFile(null)} className="btn-ghost">Je me dégonfle</button>
                        <button disabled={loading} type="submit" className="btn-primary flex-1">
                            {loading ? "Envoi…" : "Publier ma photo"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
