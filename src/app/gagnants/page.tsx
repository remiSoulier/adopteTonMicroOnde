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
  return <main className="page-main bg-stripes-green">
    <div className="page-container">
      <p className="note text-orange-700">Le palmarès</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Les gagnants</h1>
      <p className="mb-10 mt-4 max-w-2xl text-stone-600">Retrouve les journées de vote terminées. Choisis une date pour découvrir les gagnants et les micro-ondes qui leur ont été attribués.</p>
      {error ? <p role="alert" className="card card-pink">Impossible de charger les journées. Vérifie que la configuration des résultats est installée dans Supabase, puis réessaie.</p>
        : elections.length === 0 ? <p className="card border-dashed text-center text-stone-600">Aucune journée de vote terminée sur cette page.</p>
        : <WinnersHistory elections={elections} canDelete={role === 3} />}
      {!error && (page > 1 || entries.length > 30) && <nav aria-label="Pages de résultats" className="mt-8 flex items-center justify-between gap-4 text-sm">
        {page > 1 ? <Link className="btn-white px-4 py-2 text-sm" href={`/gagnants?page=${page - 1}`}>Plus récentes</Link> : <span />}
        <span className="badge">Page {page}</span>
        {entries.length > 30 ? <Link className="btn-white px-4 py-2 text-sm" href={`/gagnants?page=${page + 1}`}>Plus anciennes</Link> : <span />}
      </nav>}
    </div>
  </main>;
}
