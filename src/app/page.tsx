import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
//import { Header } from "../components/Header"

export default async function Page() {
  const supabase = createClient(await cookies());

  return (
    <main className="p-8">
      {/* <Header /> */}
      <h1 className="mb-4 text-2xl font-semibold">Bienvenue sur Adopte Ton Micro-onde !</h1>
      {/* <img src="public/assets/accueil.jpg" /> */}
      <p>Marre d'attendre qu'un micro-onde soit disponible à midi ? Réserve le tien en gagnant l'élection quotidienne !</p>
      
      
    </main>
  );
}