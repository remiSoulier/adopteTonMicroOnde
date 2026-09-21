"use server";

import { createClient as createAuthClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { AVATAR_BUCKET, MAX_AVATAR_SIZE, avatarFormat, validatePseudo, type PersonalProfile, type PersonalState } from "@/lib/profile";

export async function updatePersonalProfile(_previous: PersonalState, formData: FormData): Promise<PersonalState> {
  const pseudo = validatePseudo(formData.get("pseudo"));
  if (!pseudo) return { error: "Le pseudo doit contenir entre 2 et 32 caractères." };
  const file = formData.get("avatar");
  const hasFile = file instanceof File && file.size > 0;
  const remove = formData.get("removeAvatar") === "on";
  if (hasFile && remove) return { error: "Choisis une nouvelle photo ou supprime l’ancienne, pas les deux." };
  if (hasFile && file.size > MAX_AVATAR_SIZE) return { error: "La photo doit peser au maximum 2 Mo." };
  let image: { bytes: Uint8Array; extension: string; contentType: string } | null = null;
  if (hasFile) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = avatarFormat(bytes);
    if (!format || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return { error: "Choisis une image JPEG, PNG ou WebP." };
    }
    image = { bytes, ...format };
  }

  const supabase = createClient(await cookies());
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Connecte-toi pour modifier ton profil." };
  const { data: current, error: readError } = await supabase.rpc("get_my_personal_profile").single();
  if (readError || !current) return { error: "Impossible de charger ton profil. Vérifie la configuration des paramètres." };
  const previous = current as PersonalProfile;
  let uploadedPath: string | null = null;
  let avatarUrl: string | null = null;
  if (image) {
    uploadedPath = `${user.id}/${crypto.randomUUID()}.${image.extension}`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(uploadedPath, image.bytes, { contentType: image.contentType, upsert: false });
    if (error) return { error: "Impossible d’importer la photo. Réessaie ou vérifie la configuration du stockage." };
    avatarUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
  }

  const { data, error } = await supabase.rpc("update_my_personal_profile", {
    p_pseudo: pseudo,
    p_avatar_url: avatarUrl,
    p_change_avatar: Boolean(image || remove),
  }).single();
  if (error || !data) {
    if (uploadedPath) await supabase.storage.from(AVATAR_BUCKET).remove([uploadedPath]);
    return { error: error?.code === "23505" ? "Ce pseudo est déjà utilisé." : "Impossible d’enregistrer le profil. Réessaie." };
  }

  // Remove only our own old uploaded file, never an external image.
  if ((image || remove) && previous.avatar_url) {
    try {
      const old = new URL(previous.avatar_url);
      const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
      const prefix = `/storage/v1/object/public/${AVATAR_BUCKET}/${user.id}/`;
      if (old.origin === base.origin && old.pathname.startsWith(prefix)) {
        const oldPath = old.pathname.slice(`/storage/v1/object/public/${AVATAR_BUCKET}/`.length);
        await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
      }
    } catch { /* An old external or malformed image URL is left untouched. */ }
  }
  revalidatePath("/parametres");
  revalidatePath("/gagnants");
  return { success: "Tes informations ont été enregistrées.", profile: data as PersonalProfile };
}

export async function updatePassword(_previous: PersonalState, formData: FormData): Promise<PersonalState> {
  const currentPassword = formData.get("currentPassword");
  const password = formData.get("password");
  const confirmation = formData.get("confirmation");
  if (typeof currentPassword !== "string" || !currentPassword || typeof password !== "string" || password.length < 8 || password.length > 72) {
    return { error: "Saisis ton mot de passe actuel et un nouveau mot de passe de 8 à 72 caractères." };
  }
  if (password !== confirmation) return { error: "Les nouveaux mots de passe ne correspondent pas." };
  if (password === currentPassword) return { error: "Choisis un mot de passe différent de l’actuel." };
  const supabase = createClient(await cookies());
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Reconnecte-toi avant de modifier ton mot de passe." };

  // Verify the current password without replacing the browser's active session.
  if (!user.email) return { error: "Ce compte ne permet pas cette modification de mot de passe." };
  const verifier = createAuthClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verifyError || verified.user?.id !== user.id) return { error: "Le mot de passe actuel est incorrect ou la vérification est momentanément indisponible." };
  await verifier.auth.signOut({ scope: "local" });

  // Installed auth-js uses the wire-format current_password attribute.
  const { error } = await supabase.auth.updateUser({ password, current_password: currentPassword });
  if (error) {
    if (error.code === "weak_password") return { error: "Ce mot de passe est trop faible selon les règles du projet." };
    if (error.code === "reauthentication_needed" || error.code === "reauthentication_not_valid") return { error: "Reconnecte-toi, puis réessaie de modifier ton mot de passe." };
    return { error: "Modification refusée. Vérifie ton mot de passe actuel ou reconnecte-toi." };
  }
  return { success: "Ton mot de passe a été modifié." };
}
