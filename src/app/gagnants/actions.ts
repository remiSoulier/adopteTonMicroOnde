"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Winner, WinnersResult } from "@/lib/winners";

export async function loadWinners(day: string): Promise<WinnersResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { winners: [], error: "Date invalide." };
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { winners: [], error: "Connecte-toi pour consulter les résultats." };
  const { data, error } = await supabase.rpc("get_election_winners", { p_day: day });
  if (error) {
    console.error("Résultats indisponibles:", error.code, error.message);
    return { winners: [], error: error.code === "22023" ? "Le vote de cette journée n’est pas encore terminé." : "Impossible de charger les attributions. Réessaie plus tard." };
  }
  return { winners: (data ?? []) as Winner[] };
}
