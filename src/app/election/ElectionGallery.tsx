import ElectionPhotoCard from "./ElectionPhotoCard";
import type { ElectionPhoto } from "./types";

const publicationDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
});

type Props = {
  photos: ElectionPhoto[];
  publicationStart: Date;
  publicationEnd: Date;
  votedPhotoIds: Set<string>;
  isLoggedIn: boolean;
  hasVoted: boolean;
};

export default function ElectionGallery({
  photos, publicationStart, publicationEnd, votedPhotoIds, isLoggedIn, hasVoted,
}: Props) {
  return (
    <section aria-labelledby="gallery-title">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h2 id="gallery-title" className="text-xl font-bold">Les candidatures</h2>
          <p className="mt-2 text-sm text-stone-600">
            Photos publiées du <time dateTime={publicationStart.toISOString()}>{publicationDate.format(publicationStart)} à 10 h</time>
            {" au "}<time dateTime={publicationEnd.toISOString()}>{publicationDate.format(publicationEnd)} à 10 h</time>
            {" (heure de Paris)."}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-stone-600">
          {photos.length} photo{photos.length > 1 ? "s" : ""}
        </span>
      </div>
      {photos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-20 text-center">
          <p className="mt-2 text-stone-500">Aucune photo pour le moment. Reviens bientôt !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <ElectionPhotoCard
              key={photo.id}
              photo={photo}
              isSelected={votedPhotoIds.has(photo.id)}
              isLoggedIn={isLoggedIn}
              hasVoted={hasVoted}
            />
          ))}
        </div>
      )}
    </section>
  );
}
