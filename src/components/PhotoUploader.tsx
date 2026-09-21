"use client";

import { use, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Modal from "./Modal";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function PhotoUploader({
    userId,
    alreadyPosted,
}: {
    userId: string;
    alreadyPosted: boolean;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [legende, setLegende] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
        router.push("/election");
        router.refresh();
    }
    if (alreadyPosted) {
        return <p className="card">Tu as déjà posté ta photo aujourd&apos;hui. Reviens demain !</p>;
    }

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFile} className="input" />
            {error && <p role="alert" className="text-red-500">{error}</p>}

            <Modal open={file !== null} onClose={() => setFile(null)} title="Ta photo">
                <form onSubmit={handlePublish} className="flex flex-col gap-3">
                    {preview && <img src={preview} alt="Aperçu" className="max-h-100 w-full rounded object-cover" />}
                    <input
                        required
                        maxLength={80}
                        placeholder="Légende"
                        value={legende}
                        onChange={(e) => setLegende(e.target.value)}
                        className="input"
                    />
                    <button disabled={loading} type="submit" className="btn-primary">
                        {loading ? "Envoi…" : "Publier"}
                    </button>
                </form>
            </Modal>
        </div>
    )
}