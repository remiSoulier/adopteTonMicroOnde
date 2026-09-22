"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type Result = { error?: string; success?: string };

export async function manageMicrowave(_previous: Result | null, form: FormData): Promise<Result> {
    const operation = form.get("operation");
    const rawId = form.get("id");
    const name = form.get("nom");
    const id = typeof rawId === "string" && rawId ? rawId : null;
    if ((!["save", "delete", "activate", "deactivate"].includes(String(operation))) ||
        (id !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) ||
        (operation !== "save" && !id) ||
        (operation === "save" && (typeof name !== "string" || !name.trim() || name.trim().length > 100))) {
        return { error: "Vérifie le nom et l’appareil sélectionné." };
    }
    try {
        const supabase = createClient(await cookies());
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return { error: "Connecte-toi pour continuer." };
        const { data: role, error: roleError } = await supabase.rpc("get_my_role");
        if (roleError || (role !== 2 && role !== 3)) return { error: "Accès réservé aux administrateurs." };
        const { error } = operation === "delete"
            ? await supabase.rpc("admin_delete_microwave", { p_id: id })
            : operation === "activate" || operation === "deactivate"
            ? await supabase.rpc("admin_set_microwave_active", { p_id: id, p_active: operation === "activate" })
            : await supabase.rpc("admin_save_microwave", { p_id: id, p_nom: (name as string).trim() });
        if (error) {
            console.error("Administration des micro-ondes:", error.code, error.message);
            if (error.code === "23503") return { error: "Suppression impossible : une réservation date de deux jours ou moins, est à venir ou n’a pas de date." };
            if (error.code === "P0002") return { error: "Cet appareil n’existe plus. Actualise la page." };
            return { error: "Impossible d’enregistrer cette modification. Réessaie plus tard." };
        }
    } catch {
        return { error: "Le résultat n’a pas pu être confirmé. Actualise la liste avant de réessayer." };
    }
    revalidatePath("/admin/micro-ondes");
    revalidatePath("/gagnants");
    revalidatePath("/compte");
    revalidatePath("/election");
    return { success: operation === "delete" ? "Micro-ondes supprimé de la liste. Historique conservé." : operation === "activate" ? "Micro-ondes activé." : operation === "deactivate" ? "Micro-ondes désactivé." : id ? "Nom enregistré." : "Micro-ondes ajouté." };
}
