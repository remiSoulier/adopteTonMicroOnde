"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { isRole } from "@/lib/roles";

export async function changeRole(
  _previous: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const userId = formData.get("userId");
  const role = Number(formData.get("role"));
  if (typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) || !isRole(role)) {
    return { error: "Sélectionne un utilisateur et un rôle valides." };
  }

  const supabase = createClient(await cookies());
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Connecte-toi pour continuer." };
  const { data: actorRole, error: roleError } = await supabase.rpc("get_my_role");
  if (roleError || actorRole !== 3) return { error: "Seul un superadmin peut modifier les rôles." };
  if (userId === user.id) return { error: "Tu ne peux pas modifier ton propre rôle." };

  const { error } = await supabase.rpc("set_user_role", { p_user_id: userId, p_role: role });
  if (error) {
    console.error("Modification du rôle impossible:", error.code, error.message);
    return { error: "Modification refusée. Actualise la page et vérifie tes droits." };
  }
  revalidatePath("/parametres");
  return { success: "Rôle mis à jour." };
}
