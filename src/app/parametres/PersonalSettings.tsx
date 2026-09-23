"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MAX_AVATAR_SIZE, type PersonalProfile, type PersonalState } from "@/lib/profile";
import { updatePassword, updatePersonalProfile } from "./personal-actions";

const inputClass = "input mt-2 w-full disabled:opacity-60";
const buttonClass = "btn-primary";

function Feedback({ state }: { state: PersonalState }) {
  return <>{state?.error && <p role="alert" className="card card-pink mt-4 px-4 py-3 text-sm">{state.error}</p>}{state?.success && <p role="status" className="card card-green mt-4 px-4 py-3 text-sm">{state.success}</p>}</>;
}

export default function PersonalSettings({ profile, loginIdentifier }: { profile: PersonalProfile; loginIdentifier: string }) {
  const profileForm = useRef<HTMLFormElement>(null);
  const passwordForm = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [profileState, profileAction, savingProfile] = useActionState(async (previous: PersonalState, formData: FormData): Promise<PersonalState> => {
    try {
      const result = await updatePersonalProfile(previous, formData);
      if (result?.success) { setFile(null); setRemove(false); profileForm.current?.reset(); }
      return result;
    } catch { return { error: "La connexion a échoué. Réessaie d’enregistrer ton profil." }; }
  }, null);
  const [passwordState, passwordAction, savingPassword] = useActionState(async (previous: PersonalState, formData: FormData): Promise<PersonalState> => {
    try {
      const result = await updatePassword(previous, formData);
      if (result?.success) passwordForm.current?.reset();
      return result;
    } catch { return { error: "La connexion a échoué. Réessaie de modifier ton mot de passe." }; }
  }, null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const timer = window.setTimeout(() => setPreview(url), 0);
    return () => { window.clearTimeout(timer); URL.revokeObjectURL(url); };
  }, [file]);

  const saved = profileState?.profile ?? profile;
  const image = remove ? null : file ? preview : saved.avatar_url;
  return <section aria-labelledby="personal-title" className="my-10">
    <h2 id="personal-title" className="text-2xl font-bold">Informations personnelles</h2>
    <p className="mb-6 mt-2 text-stone-600">Personnalise ton profil et sécurise ton compte.</p>
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <form ref={profileForm} action={profileAction} className="card" aria-busy={savingProfile}>
        <fieldset disabled={savingProfile}>
          <legend className="text-lg font-bold">Mon profil</legend>
          <div className="my-5 flex items-center gap-4">
            {image ? <img src={image} alt="Aperçu de ta photo de profil" className="size-20 rounded-full border-2 border-black object-cover" /> : <span aria-label="Aucune photo de profil" className="flex size-20 items-center justify-center rounded-full border-2 border-black bg-(--bg-yellow) text-3xl font-bold">{saved.pseudo.slice(0,1).toUpperCase()}</span>}
            <p className="text-sm text-stone-500">JPEG, PNG ou WebP<br />2 Mo maximum</p>
          </div>
          <label htmlFor="personal-avatar" className="text-sm font-semibold">Photo de profil</label>
          <input id="personal-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-2 file:border-black file:bg-(--bg-yellow) file:px-3 file:py-2 file:font-bold" onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            if (selected && (selected.size > MAX_AVATAR_SIZE || !["image/jpeg", "image/png", "image/webp"].includes(selected.type))) {
              setFileError("Choisis une image JPEG, PNG ou WebP de 2 Mo maximum."); event.target.value = ""; setFile(null); return;
            }
            setFileError(null); setPreview(null); setFile(selected); if (selected) setRemove(false);
          }} />
          {fileError && <p role="alert" className="mt-2 text-sm text-red-700">{fileError}</p>}
          {saved.avatar_url && <label className="mt-4 flex items-center gap-2 text-sm"><input name="removeAvatar" type="checkbox" checked={remove} disabled={Boolean(file)} onChange={(event) => setRemove(event.target.checked)} className="size-4 accent-(--bg-orange-600)" />Supprimer ma photo actuelle</label>}
          <label htmlFor="personal-pseudo" className="mt-6 block text-sm font-semibold">Pseudo affiché</label>
          <input id="personal-pseudo" name="pseudo" required minLength={2} maxLength={32} defaultValue={saved.pseudo} autoComplete="nickname" className={inputClass} />
          <p className="mt-3 break-words text-sm text-stone-500">Ton identifiant de connexion reste <strong>{loginIdentifier}</strong>.</p>
          <button type="submit" className={`${buttonClass} mt-6`} disabled={savingProfile || Boolean(fileError)}>{savingProfile ? "Enregistrement…" : "Enregistrer mon profil"}</button>
        </fieldset>
        <Feedback state={profileState} />
      </form>

      <form ref={passwordForm} action={passwordAction} className="card" aria-busy={savingPassword}>
        <fieldset disabled={savingPassword}>
          <legend className="text-lg font-bold">Mot de passe</legend>
          <label htmlFor="current-password" className="mt-5 block text-sm font-semibold">Mot de passe actuel</label>
          <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} />
          <label htmlFor="new-password" className="mt-5 block text-sm font-semibold">Nouveau mot de passe</label>
          <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className={inputClass} aria-describedby="password-help" />
          <p id="password-help" className="mt-2 text-sm text-stone-500">Entre 8 et 72 caractères.</p>
          <label htmlFor="confirm-password" className="mt-5 block text-sm font-semibold">Confirmer le nouveau mot de passe</label>
          <input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className={inputClass} />
          <button type="submit" className={`${buttonClass} mt-6`} disabled={savingPassword}>{savingPassword ? "Modification…" : "Modifier mon mot de passe"}</button>
        </fieldset>
        <Feedback state={passwordState} />
      </form>
    </div>
  </section>;
}
