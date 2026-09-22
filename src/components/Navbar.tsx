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
          <li className="btn-white">
            <Link href="/participation" className="text-sm">
              Participations
            </Link>
          </li>
          <li className="btn-white">
            <Link href="/election" className="text-sm">
              Élections
            </Link>
          </li>
          <li className="btn-white">
            <Link href="/gagnants" className="text-sm">
              Gagnants
            </Link>
          </li>
          <li className="btn-white">
            <Link href="/parametres" className="text-sm">
              Paramètres
            </Link  >
          </li>
          {(role === 2 || role === 3) && <li className="btn-white"><Link href="/admin/micro-ondes" className="text-sm">Micro-ondes</Link></li>}
        </ul>

      {isLoggedIn ? (
        <LogoutButton />
      ) : (
        <Link href="/login" className="btn-primary h-fit">Se connecter</Link>
      )}
    </div>
  )
}

