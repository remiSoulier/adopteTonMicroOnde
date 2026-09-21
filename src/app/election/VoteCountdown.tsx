"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VoteCountdown({ nextResetAt }: { nextResetAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const target = Date.parse(nextResetAt);
    let refreshed = false;
    const tick = () => {
      const milliseconds = Math.max(0, target - Date.now());
      setRemaining(milliseconds);
      if (milliseconds === 0 && !refreshed) {
        refreshed = true;
        router.refresh();
      }
    };
    const initial = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [nextResetAt, router]);

  const totalSeconds = remaining === null ? null : Math.ceil(remaining / 1000);
  const hours = Math.floor((totalSeconds ?? 0) / 3600);
  const minutes = Math.floor(((totalSeconds ?? 0) % 3600) / 60);
  const seconds = (totalSeconds ?? 0) % 60;
  const label = totalSeconds === null ? "--:--:--" :
    [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");

  return (
    <aside aria-label="Prochaine ouverture des votes" className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-100 px-6 py-5 text-orange-950">
      <div>
        <p className="font-bold">Prochain vote dans</p>
        <p className="mt-1 text-sm text-orange-800">Chaque jour à 10 h, heure de Paris</p>
      </div>
      <span role="timer" aria-label={totalSeconds === null ? "Chargement du compte à rebours" : `${hours} heures, ${minutes} minutes et ${seconds} secondes restantes`} className="rounded-xl bg-white/80 px-5 py-3 font-mono text-3xl font-bold tabular-nums tracking-wider">
        {label}
      </span>
    </aside>
  );
}
