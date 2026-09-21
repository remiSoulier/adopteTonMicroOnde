import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "./LogoutButton";


export default async function Navbar() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  return (
    <div className="flex justify-between card">
      <div className='rounded-full bg-black w-5 h-5'></div>
      {isLoggedIn ? (
        <LogoutButton />
      ) : (
        <Link href="/login" className="btn-primary">Se connecter</Link>
      )}
    </div>
  )
}

