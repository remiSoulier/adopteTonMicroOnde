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
    <aside aria-label="Prochaine ouverture des votes" className="mw-panel mb-8">
      <p className="mw-nameplate text-sm sm:text-base">Prochain vote dans</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold text-white">Chaque jour à 10 h, heure de Paris</p>
        <span role="timer" aria-label={totalSeconds === null ? "Chargement du compte à rebours" : `${hours} heures, ${minutes} minutes et ${seconds} secondes restantes`} className="mw-timer text-2xl tabular-nums sm:text-3xl">
          {label}
        </span>
      </div>
    </aside>
  );
}
