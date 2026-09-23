import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "./LogoutButton";
import Image from "next/image";


export default async function Navbar() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;
  const { data: role } = isLoggedIn ? await supabase.rpc("get_my_role") : { data: null };

  return (
    <div className="flex justify-between border-b-1 items-center w-full py-4 px-8">
      <Link href="/">
        <Image src="/logo.png" alt="Logo" width={100} height={100} className="h-16 w-auto" />
      </Link>
        <ul className="flex gap-8 ">
          <Link href="/participation" className="text-sm">
          <li className="btn-white">

              Participations

          </li>
          </Link>
          <Link href="/election" className="text-sm">
          <li className="btn-white">

              Élections

          </li>
          </Link>
          <Link href="/gagnants" className="text-sm">
          <li className="btn-white">

              Gagnants

          </li>
          </Link>
          <Link href="/parametres" className="text-sm">
          <li className="btn-white">

              Paramètres

          </li>
          </Link  >
          {(role === 2 || role === 3) && <Link href="/admin/micro-ondes" className="text-sm"><li className="btn-white">Micro-ondes</li></Link>}
        </ul>

      {isLoggedIn ? (
        <LogoutButton />
      ) : (
        <Link href="/login" className="btn-primary h-fit">Se connecter</Link>
      )}
    </div>
  )
}

