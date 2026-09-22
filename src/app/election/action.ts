"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";


export async function vote(photoId: string) {
    const supabase = createClient(await cookies());

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Connecte-toi pour voter.");
    }

    const { error } = await supabase.from("votes").insert({
        photo_id: photoId,
        voter_id: user.id,
    });

    if (error) {
        console.error("Erreur Supabase lors du vote:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
        });
        throw new Error("Impossible d'enregistrer le vote.");
    }

    revalidatePath("/election");
}

export async function draw(): Promise<{ error?: string; success?: string }> {
    const supabase = createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Connecte-toi pour lancer le tirage." };
    }

    const { data: role, error: roleError } = await supabase.rpc("get_my_role");
    if (roleError || role !== 3) {
        return { error: "Seul un superadmin peut lancer le tirage." };
    }

    const { data: result, error } = await supabase.rpc("draw_microwave", { p_user_id: user.id });
    if (error) {
        console.error("Erreur Supabase lors du tirage:", error.code, error.message);
        if (error.code === "PGRST202") return { error: "La fonction de classement doit être installée dans Supabase (draw-microwave.sql)." };
        return { error: "Impossible d’effectuer le tirage. Vérifie les attributions avant de réessayer." };
    }

    revalidatePath("/election");
    revalidatePath("/gagnants");
    revalidatePath("/compte");
    if (!result || typeof result.closing_day !== "string") return { error: "Réponse du classement inattendue. Vérifie les attributions avant de réessayer." };
    const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(`${result.closing_day}T12:00:00Z`));
    if (result.status === "already_done") return { success: `Les attributions du ${date} ont déjà été enregistrées.` };
    if (result.status === "no_devices") return { error: `Aucun micro-ondes actif disponible pour le ${date}.` };
    if (result.status === "no_candidates") return { error: `Aucun participant avec des votes et sans attribution pour le ${date}.` };
    if (result.status !== "completed") return { error: "Réponse du classement inattendue. Vérifie les attributions." };
    return { success: `${result.assigned_count} attribution(s) enregistrée(s) pour le ${date}, selon le classement par votes.` };
}
