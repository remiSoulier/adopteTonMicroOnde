import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { ClosedElection } from "@/lib/winners";
import WinnersHistory from "./WinnersHistory";

export default async function GagnantsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await supabase.rpc("get_my_role");
  const params = await searchParams;
  const requested = Number(params.page ?? 1);
  const page = Number.isInteger(requested) && requested > 0 && requested <= 33334 ? requested : 1;
  const { data, error } = await supabase.rpc("list_closed_elections", { p_offset: (page - 1) * 30 });
  if (error) console.error("Historique indisponible:", error.code, error.message);
  const entries = (data ?? []) as ClosedElection[];
  const elections = entries.slice(0, 30);
  return <main className="min-h-screen bg-[#faf7f2] px-5 py-12 text-stone-900 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Le palmarès</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Les gagnants</h1>
      <p className="mb-10 mt-4 max-w-2xl text-stone-600">Retrouve les journées de vote terminées. Choisis une date pour découvrir les gagnants et les micro-ondes qui leur ont été attribués.</p>
      {error ? <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-800">Impossible de charger les journées. Vérifie que la configuration des résultats est installée dans Supabase, puis réessaie.</p>
        : elections.length === 0 ? <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">Aucune journée de vote terminée sur cette page.</p>
        : <WinnersHistory elections={elections} canDelete={role === 3} />}
      {!error && (page > 1 || entries.length > 30) && <nav aria-label="Pages de résultats" className="mt-8 flex justify-between gap-4 text-sm">
        {page > 1 ? <Link className="underline" href={`/gagnants?page=${page - 1}`}>Plus récentes</Link> : <span />}
        <span>Page {page}</span>
        {entries.length > 30 ? <Link className="underline" href={`/gagnants?page=${page + 1}`}>Plus anciennes</Link> : <span />}
      </nav>}
    </div>
  </main>;
}
