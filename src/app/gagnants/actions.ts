"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Winner, WinnersResult } from "@/lib/winners";

export async function loadWinners(day: string): Promise<WinnersResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { winners: [], error: "Date invalide." };
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { winners: [], error: "Connecte-toi pour consulter les résultats." };
  // Cette fonction lit les attributions enregistrées dans reservations.
  // Aucun classement ni état d’annulation ne détermine les résultats affichés.
  const { data, error } = await supabase.rpc("get_election_winners", { p_day: day });
  if (error) {
    console.error("Résultats indisponibles:", error.code, error.message);
    return { winners: [], error: error.code === "22023" ? "Le vote de cette journée n’est pas encore terminé." : "Impossible de charger les attributions. Réessaie plus tard." };
  }
  return { winners: (data ?? []) as Winner[] };
}

export async function deleteAttribution(reservationId: string, day: string): Promise<{ error?: string; success?: boolean }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reservationId) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return { error: "Attribution ou date invalide." };
  }
  const supabase = createClient(await cookies());
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Connecte-toi pour continuer." };
  const { data: role, error: roleError } = await supabase.rpc("get_my_role");
  if (roleError || role !== 3) return { error: "Seul un superadmin peut supprimer une attribution." };

  const { error } = await supabase.rpc("superadmin_delete_attribution", { p_reservation_id: reservationId, p_day: day });
  if (error) {
    console.error("Suppression d’attribution:", error.code, error.message);
    if (error.code === "PGRST202") return { error: "La fonction de suppression doit être installée dans Supabase (delete-attribution.sql)." };
    return { error: "Suppression refusée. Vérifie tes droits et la journée sélectionnée." };
  }
  for (const path of ["/gagnants", "/compte", "/election", "/admin/micro-ondes"]) revalidatePath(path);
  return { success: true };
}
