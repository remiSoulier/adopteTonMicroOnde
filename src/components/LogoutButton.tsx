"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

export default function LogoutButton() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "signup">("login");
    

    async function handleLogout() {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
    }
  return (
      <button className="btn-primary" onClick={handleLogout}>Déconnexion</button>
  )
}

