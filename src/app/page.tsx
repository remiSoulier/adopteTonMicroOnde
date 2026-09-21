import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const supabase = createClient(await cookies());

  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-semibold">Adopte ton micro-ondes</h1>
     
    </main>
  );
}
