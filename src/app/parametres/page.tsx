import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isRole, ROLE_LABELS, type Role } from "@/lib/roles";
import RoleForm from "./RoleForm";

type UserRole = { id: string; pseudo: string; role: Role };

export default async function ParametresPage({ searchParams }: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role, error } = await supabase.rpc("get_my_role");
  if (error || !isRole(role)) {
    return <main className="mx-auto max-w-3xl px-6 py-12"><h1 className="text-3xl font-bold">Paramètres</h1><p role="alert" className="mt-6 rounded-2xl bg-orange-50 p-5 text-orange-950">Tes droits ne sont pas disponibles. Le profil doit exister et la configuration des rôles doit être installée dans Supabase.</p></main>;
  }

  const params = await searchParams;
  const requestedPage = Number(params.page ?? 1);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 20001 ? requestedPage : 1;
  let users: UserRole[] = [];
  let listError = false;
  let hasNext = false;
  if (role >= 2) {
    const { data, error: usersError } = await supabase.rpc("list_user_roles", { p_offset: (page - 1) * 50 });
    listError = Boolean(usersError);
    const entries = (data ?? []) as UserRole[];
    hasNext = entries.length > 50;
    users = entries.slice(0, 50);
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-5 py-12 text-stone-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Mon espace</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Paramètres</h1>
        <p className="mt-3 text-stone-600">Consulte ton niveau d’accès et les droits associés à ton compte.</p>
        <div className="my-8 rounded-2xl border border-orange-200 bg-orange-100 p-6">
          <p className="text-sm text-orange-900">Ton rôle actuel</p>
          <p className="mt-1 text-2xl font-bold">{ROLE_LABELS[role]}</p>
          <p className="mt-2 text-sm text-orange-950">{role === 3 ? "Tu peux attribuer les rôles aux autres utilisateurs." : role === 2 ? "Tu peux consulter les utilisateurs. Les rôles sont modifiés par un superadmin." : "Tu peux participer et voter. La gestion des utilisateurs est réservée aux administrateurs."}</p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {([1, 2, 3] as const).map((value) => <div key={value} className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="font-bold">{value} — {ROLE_LABELS[value]}</h2><p className="mt-2 text-sm text-stone-600">{value === 1 ? "Participation et vote." : value === 2 ? "Droits utilisateur et consultation des utilisateurs." : "Droits admin et attribution des rôles."}</p></div>)}
        </div>

        {role >= 2 && <section aria-labelledby="users-title">
          <h2 id="users-title" className="mb-2 text-2xl font-bold">Gestion des utilisateurs</h2>
          {role === 3 && <p className="mb-5 text-sm text-stone-600">Un superadmin peut aussi nommer d’autres superadmins. Ton propre rôle ne peut pas être modifié ici.</p>}
          {listError ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">Impossible de charger les utilisateurs.</p> : <>
            <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {users.map((profile) => <li key={profile.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div><p className="font-bold">{profile.pseudo || "Sans pseudo"}{profile.id === user.id && <span className="ml-2 text-sm font-normal text-stone-500">(toi)</span>}</p><p className="mt-1 text-sm text-stone-500">{ROLE_LABELS[profile.role]}</p></div>
                {role === 3 && profile.id !== user.id ? <RoleForm userId={profile.id} role={profile.role} pseudo={profile.pseudo || "cet utilisateur"} /> : <span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">{profile.id === user.id ? "Ton compte" : "Lecture seule"}</span>}
              </li>)}
              {users.length === 0 && <li className="p-5 text-stone-500">Aucun utilisateur sur cette page.</li>}
            </ul>
            <nav aria-label="Pages des utilisateurs" className="mt-5 flex items-center justify-between gap-4 text-sm">
              {page > 1 ? <Link href={`/parametres?page=${page - 1}`} className="underline">Précédent</Link> : <span />}
              <span>Page {page}</span>
              {hasNext ? <Link href={`/parametres?page=${page + 1}`} className="underline">Suivant</Link> : <span />}
            </nav>
          </>}
        </section>}
      </div>
    </main>
  );
}
