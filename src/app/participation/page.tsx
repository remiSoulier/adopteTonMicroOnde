import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PhotoUploader from "@/components/PhotoUploader";
import PhotoHistory from "@/components/PhotoHistory";

export default async function ParticipationPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const userId = data.claims.sub;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const { data: todayPhotos } = await supabase
    .from("photos")
    .select("id, url, legende, created_at")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  const { data: history, error: historyError } = await supabase.rpc("get_my_photo_history", { p_limit: 8 });
  if (historyError) console.error("get_my_photo_history:", historyError.message);

  return (
    <main className="page-main bg-dots-pink">
      <div className="page-container flex flex-col gap-10">
        <div className="flex flex-col">
          <h1 className="mb-4">Poste ta photo</h1>
          <p>Une photo par période de vote. Elle sera soumise au peuple à la prochaine ouverture, à 10 h. <br />Pas de retouche, pas de pitié.</p>
          <div className="flex gap-4">
            <span className="badge badge-yellow"> Une photo par période </span>
            <span className="badge badge-blue"> Zéro retouche </span>
            <span className="badge badge-green"> Bienveillance obligatoire </span>
          </div>
        </div>
        <PhotoUploader userId={userId} todayPhoto={todayPhotos?.[0] ?? null} />
        <PhotoHistory entries={history ?? []} />
      </div>
    </main>
  );
}
