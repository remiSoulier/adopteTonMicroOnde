import { vote } from "./action";
import type { ElectionPhoto } from "./types";

type Props = {
  photo: ElectionPhoto;
  isSelected: boolean;
  isLoggedIn: boolean;
  hasVoted: boolean;
};

function getVoteLabel({ isSelected, isLoggedIn, hasVoted }: Omit<Props, "photo">) {
  if (isSelected) return "Tu as voté pour cette photo";
  if (!isLoggedIn) return "Connecte-toi pour voter";
  if (hasVoted) return "Déjà voté — prochain vote à 10 h";
  return "Voter";
}

export default function ElectionPhotoCard({ photo, isSelected, isLoggedIn, hasVoted }: Props) {
  const borderClass = isSelected
    ? "border-orange-500 ring-2 ring-orange-500"
    : "border-stone-200";
  const buttonLabel = getVoteLabel({ isSelected, isLoggedIn, hasVoted });

  return (
    <figure className={`group flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow hover:shadow-lg ${borderClass}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {isSelected && (
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
        <form action={vote.bind(null, photo.id)} className="mt-auto">
          <button
            type="submit"
            disabled={!isLoggedIn || hasVoted}
            className="rounded-xl bg-orange-600 px-5 py-3 text-white disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {buttonLabel}
          </button>
        </form>
      </div>
    </figure>
  );
}
