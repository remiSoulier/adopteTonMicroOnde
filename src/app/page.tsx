import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";

export default async function Page() {
  const supabase = createClient(await cookies());

  return (
    <main className="p-8 w-full flex flex-col gap-34 mx-50 justify-center bg-dots-pink ">
      <div className="flex items-center justify-center my-30">
        <div className="flex flex-col items-start gap-3 w-full">
          <h1 className="">Ne galère plus <br /> à trouver un</h1>
          <h1 className="label-tag label-yellow">Un Micro Ondes.</h1>
          <p className="note text-lg">(à condition d'être drôle)</p>
          <p>Poste une photo absurde. La communauté vote. Les 4 plus drôles chauffent leur gamelle en premier. <br /> Les autres ? Ils mangent froid. C'est la loi.</p>
          <div className="flex gap-4">
            <Link href="/participation">
              <button className="btn-primary">Je veux chauffer en premier !</button>
            </Link>
            <Link href="/election">
              <button className="btn-white">Voir les photos des autres</button>
            </Link>
          </div>
        </div>
        <div className="w-full">
          <Image src="/microondes.png" width={100} height={100} alt="micro-ondes" className="w-2/3" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <h1>Comment ça marche</h1>
          <span className="note text-lg">(spoiler : c'est facile)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card card-yellow">
            <span className="card-badge">1</span>
            <h2 className="card-title">Poste ta photo</h2>
            <p>Une photo drôle ou absurde par jour. Le sérieux, c&apos;est pour les réunions.</p>
          </div>
          <div className="card card-blue">
            <span className="card-badge">2</span>
            <h2 className="card-title">Le peuple vote</h2>
            <p>Un vote par jour, jusqu&apos;à 10 h. Choisis bien, l&apos;Histoire te regarde.</p>
          </div>
          <div className="card card-green">
            <span className="card-badge">3</span>
            <h2 className="card-title">Les 4 élus chauffent</h2>
            <p>4 créneaux prioritaires. Les autres patientent en fixant leur gamelle d&apos;un air triste.</p>
          </div>
        </div>
      </div>

    </main>
  );
}
