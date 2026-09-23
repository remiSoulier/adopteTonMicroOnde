"use client";

import { useActionState } from "react";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { changeRole } from "./actions";

export default function RoleForm({ userId, role, pseudo }: { userId: string; role: Role; pseudo: string }) {
  const [state, action, pending] = useActionState(changeRole, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="userId" value={userId} />
      <label htmlFor={`role-${userId}`} className="sr-only">Rôle de {pseudo}</label>
      <select id={`role-${userId}`} name="role" defaultValue={role} disabled={pending} className="input px-3 py-2 text-sm">
        {([1, 2, 3] as const).map((value) => <option key={value} value={value}>{value} — {ROLE_LABELS[value]}</option>)}
      </select>
      <button disabled={pending} className="btn-primary px-4 py-2 text-sm" type="submit">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {state?.error && <p role="alert" className="w-full text-sm text-red-700">{state.error}</p>}
      {state?.success && <p role="status" className="w-full text-sm text-green-700">{state.success}</p>}
    </form>
  );
}
