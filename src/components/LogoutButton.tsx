"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
    }


  return (
      <button className="btn-primary" onClick={handleLogout}>Déconnexion</button>
  )
}

