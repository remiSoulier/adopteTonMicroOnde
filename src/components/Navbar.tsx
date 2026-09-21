import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "./LogoutButton";
import Image from "next/image";


export default async function Navbar() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  return (
    <div className="flex justify-between card items-center w-400">
      <Image src="/logo.png" alt="Logo" width={80} height={80} />
        <ul className="flex gap-8 ">
          <li className="link">
            <Link href="/participation" className="text-sm">
              Participations
            </Link>
          </li>
          <li className="link">
            <Link href="/election" className="text-sm">
              Élections
            </Link>
          </li>
          <li className="link">
            <Link href="/gagnants" className="text-sm">
              Gagnants
            </Link>
          </li>
          <li className="link">
            <Link href="/parametres" className="text-sm">
              Paramètres
            </Link  >
          </li>
        </ul>

      {isLoggedIn ? (
        <LogoutButton />
      ) : (
        <Link href="/login" className="btn-primary h-fit">Se connecter</Link>
      )}
    </div>
  )
}

