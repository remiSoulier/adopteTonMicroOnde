import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import MicrowaveForm, { type Microwave } from "./MicrowaveForm";

export default async function MicrowavesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: role, error: roleError } = await supabase.rpc("get_my_role");
    if (roleError || (role !== 2 && role !== 3)) {
        return <main className="page-main bg-waves-purple"><div className="page-container max-w-3xl"><h1 className="text-3xl font-bold">Administration des micro-ondes</h1><p role="alert" className="card card-yellow mt-6">Accès réservé aux admins et superadmins.</p></div></main>;
    }
    const requestedPage = Number((await searchParams).page ?? 1);
    const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 20001 ? requestedPage : 1;
    const { data, error } = await supabase.rpc("admin_list_microwaves", { p_offset: (page - 1) * 50 });
    const entries = (data ?? []) as Microwave[];
    return <main className="page-main bg-waves-purple">
        <div className="page-container">
            <Link href="/parametres" className="text-sm text-orange-700 underline">Retour aux paramètres</Link>
            <p className="mt-8 note text-orange-700">Administration</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Les micro-ondes</h1>
            <p className="mb-8 mt-3 text-stone-600">Ajoute, renomme, active ou désactive les appareils. La suppression est possible si toutes leurs réservations datent de plus de deux jours, selon la date de Paris.</p>
            {error ? <p role="alert" className="card card-pink">Impossible de charger les micro-ondes. Réessaie plus tard.</p> : <>
                <MicrowaveForm />
                <h2 className="mb-4 mt-10 text-2xl font-bold">Appareils enregistrés</h2>
                {entries.length === 0 ? <p className="card border-dashed text-center text-stone-500">Aucun micro-ondes sur cette page.</p> : <ul className="space-y-4">{entries.slice(0,50).map(m => <li key={m.id}><MicrowaveForm microwave={m} /></li>)}</ul>}
                <nav aria-label="Pages des micro-ondes" className="mt-6 flex items-center justify-between text-sm">
                    {page > 1 ? <Link href={`/admin/micro-ondes?page=${page-1}`} className="btn-white px-4 py-2 text-sm">Précédent</Link> : <span />}
                    <span className="badge">Page {page}</span>
                    {entries.length > 50 && page < 20001 ? <Link href={`/admin/micro-ondes?page=${page+1}`} className="btn-white px-4 py-2 text-sm">Suivant</Link> : <span />}
                </nav>
            </>}
        </div>
    </main>;
}
