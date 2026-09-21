import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { vote } from "./action";
import VoteCountdown from "./VoteCountdown";
import { getVotePeriod } from "./vote-period";

export default async function ElectionPage() {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();
    const { data: hasVoted, error: voteError } = await supabase
        .rpc("has_voted_since_reset");

    if (voteError) {
        console.error(voteError);
        return <p>Impossible de vérifier ton vote.</p>;
    }


    const { start: debut, end: fin, nextReset } = getVotePeriod();
    const votedPhotoIds = new Set<string>();
    if (user) {
        const { data: votes, error: votesError } = await supabase
            .from("votes")
            .select("photo_id")
            .eq("voter_id", user.id)
            .gte("created_at", fin.toISOString())
            .lt("created_at", nextReset.toISOString());

        if (votesError) {
            console.error("Impossible de récupérer la photo votée:", votesError.message);
            return <p role="alert">Impossible de récupérer ton vote. Réessaie plus tard.</p>;
        }
        votes?.forEach((entry) => votedPhotoIds.add(entry.photo_id));
    }


    const { data: photos, error } = await supabase
        .from("photos")
        .select("id, url, legende")
        .gte("created_at", debut.toISOString())
        .lt("created_at", fin.toISOString());

    if (error) {
        console.error(error.message);

        return (
            <main className="min-h-screen bg-orange-50 px-6 py-20">
                <p
                    role="alert"
                    className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"
                >
                    Impossible de charger les photos. Réessaie un peu plus tard.
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#faf7f2] px-5 py-12 text-stone-900 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-6xl">
                <VoteCountdown key={nextReset.toISOString()} nextResetAt={nextReset.toISOString()} />


                <section aria-labelledby="gallery-title">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
                        <h2 id="gallery-title" className="text-xl font-bold">
                            Les candidatures
                        </h2>

                        <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-stone-600">
              {photos.length} photo{photos.length > 1 ? "s" : ""}
            </span>
                    </div>

                    {photos.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-20 text-center">

                            <p className="mt-2 text-stone-500">
                                Aucune photo pour le moment. Reviens bientôt !
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {photos.map((photo) => (
                                <figure
                                    key={photo.id}
                                    className={`group flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow hover:shadow-lg ${
                                        votedPhotoIds.has(photo.id)
                                            ? "border-orange-500 ring-2 ring-orange-500"
                                            : "border-stone-200"
                                    }`}
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                                        {votedPhotoIds.has(photo.id) && (
                                            <span className="absolute left-4 top-4 z-10 rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-md">
                                                <span aria-hidden="true">✓ </span>Ton vote
                                            </span>
                                        )}
                                        <img
                                            src={photo.url}
                                            alt={photo.legende || "Photo de micro-ondes"}
                                            loading="lazy"
                                            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                                        />


                                    </div>

                                    <div className="flex flex-1 flex-col p-6">
                                        <figcaption className="mb-6 break-words text-lg font-bold leading-snug">
                                            {photo.legende || "Un micro-ondes plein de charme"}
                                        </figcaption>

                                        <form
                                            action={vote.bind(null, photo.id)}
                                            className="mt-auto"
                                        >
                                            <button
                                                type="submit"
                                                disabled={!user || hasVoted || votedPhotoIds.size > 0}
                                                className="rounded-xl bg-orange-600 px-5 py-3 text-white disabled:cursor-not-allowed disabled:bg-stone-300"
                                            >
                                                {votedPhotoIds.has(photo.id)
                                                    ? "Tu as voté pour cette photo"
                                                    : !user ? "Connecte-toi pour voter"
                                                    : hasVoted || votedPhotoIds.size > 0 ? "Déjà voté — prochain vote à 10 h" : "Voter"}
                                            </button>
                                        </form>
                                    </div>
                                </figure>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

