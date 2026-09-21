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
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-4">Participer</h1>
      <PhotoUploader userId={userId} alreadyPosted={(count ?? 0) > 0} />
    </main>
  );
}
