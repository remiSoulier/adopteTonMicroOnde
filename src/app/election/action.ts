"use server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { formatDrawResult } from "./draw-result";
import type { ActionResult } from "./types";
import { getVotePeriod } from "./vote-period";
export async function simulateClose(periodStart: string): Promise<ActionResult> {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();
    const { data: role } = user ? await supabase.rpc("get_my_role") : { data: null };
    if (!user || role !== 3) return { error: "Accès réservé au superadmin." };
    const { data, error } = await supabase.rpc("simulate_election_close", { p_start: periodStart });
    if (error) {
        console.error("Simulation de clôture:", error.code, error.message);
        return { error: error.code === "PGRST202" ? "Installe le script automatic-attributions.sql dans Supabase." : error.code === "22023" ? "La période a changé. Actualise la page." : "Impossible de recréer les attributions. Aucune modification de cette simulation n’a été conservée." };
    }
    for (const path of ["/election", "/gagnants", "/compte"]) revalidatePath(path);
    return { success: `${data.assigned_count} attribution(s) enregistrée(s) pour le ${data.date} à midi. Les votes sont conservés.` };
}
export async function vote(photoId: string) {
    const supabase = createClient(await cookies());
    const { data: { user }, error: authError, } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Connecte-toi pour voter.");
    }
    const period = getVotePeriod();
    const { data: existingVotes, error: votesError } = await supabase.from("votes")
        .select("id").eq("voter_id", user.id)
        .gte("created_at", period.end.toISOString())
        .lt("created_at", period.nextReset.toISOString()).limit(1);
    if (votesError) throw new Error("Impossible de vérifier ton vote.");
    if (existingVotes?.length) { revalidatePath("/election"); return; }
    const { data: photo, error: photoError } = await supabase.from("photos")
        .select("id").eq("id", photoId)
        .gte("created_at", period.start.toISOString())
        .lt("created_at", period.end.toISOString()).maybeSingle();
    if (photoError || !photo) throw new Error("Cette photo ne participe pas à l’élection en cours.");
    const { error } = await supabase.from("votes").insert({
        photo_id: photoId,
        voter_id: user.id,
    });
    if (error?.code === "23505") {
        revalidatePath("/election");
        return;
    }
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
export async function draw(): Promise<ActionResult> {
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
        if (error.code === "PGRST202")
            return { error: "La fonction de classement doit être installée dans Supabase (draw-microwave.sql)." };
        return { error: "Impossible d’effectuer le tirage. Vérifie les attributions avant de réessayer." };
    }
    revalidatePath("/election");
    revalidatePath("/gagnants");
    revalidatePath("/compte");
    return formatDrawResult(result);
}

export async function cancelElection(votingDay: string): Promise<ActionResult> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(votingDay)) return { error: "Période invalide." };
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Connecte-toi pour continuer." };
    const { data: role, error: roleError } = await supabase.rpc("get_my_role");
    if (roleError || role !== 3) return { error: "Seul un superadmin peut annuler l’élection." };
    const { error } = await supabase.rpc("cancel_current_election", { p_voting_day: votingDay });
    if (error) {
        if (error.code === "22023") return { error: "La période a changé. Actualise la page." };
        if (error.code === "23514") return { error: "Des attributions existent déjà pour cette élection. Annulation refusée." };
        return { error: "Annulation refusée. Vérifie tes droits et la configuration Supabase." };
    }
    revalidatePath("/election");
    revalidatePath("/gagnants");
    return { success: "L’élection en cours a été annulée." };
}
