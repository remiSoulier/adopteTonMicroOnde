import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { vote } from "./action";

export default async function ElectionPage() {
    const supabase = createClient(await cookies());

    const { data: photos, error } = await supabase
        .from("photos")
        .select("id, url, legende");

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
                            {photos.map((photo, index) => (
                                <figure
                                    key={photo.id}
                                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
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
                                                aria-label={`Voter pour ${
                                                    photo.legende || `la candidature ${index + 1}`
                                                }`}
                                                className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 active:bg-orange-800"
                                            >
                                                <span aria-hidden="true">♡</span>
                                                Je vote pour cette photo
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

