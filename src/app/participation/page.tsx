import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PhotoUploader from "@/components/PhotoUploader";

export default async function ParticipationPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const userId = data.claims.sub;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", today.toISOString());

  return (
    <main className="w-screen h-screen p-8 bg-dots-pink">
      <div className="flex flex-col">
        <h1 className="mb-4">Poste ta photo</h1>
        <p>Une photo par période de vote. Elle sera soumise au peuple à la prochaine ouverture, à 10 h. <br />Pas de retouche, pas de pitié.</p>
        <div className="flex gap-4">
          <span className="badge"> Une photo par période </span>
          <span className="badge"> Zéro retouche </span>
          <span className="badge"> Bienveillance obligatoire </span>

        </div>
      </div>
      <PhotoUploader userId={userId} alreadyPosted={(count ?? 0) > 0} />
    </main>
  );
}
