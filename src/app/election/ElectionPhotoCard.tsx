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
  const buttonLabel = getVoteLabel({ isSelected, isLoggedIn, hasVoted });

  return (
    <figure className="polaroid-card group">
      <div className="polaroid-photo">
        {isSelected && (
          <span className="status-badge status-won absolute left-3 top-3 z-10">
            <span aria-hidden="true">✓ </span>Ton vote
          </span>
        )}
        <img
          src={photo.url}
          alt={photo.legende || "Photo de micro-ondes"}
          loading="lazy"
          className="motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
        />
      </div>
      <figcaption className="polaroid-caption flex-1 wrap-break-word">
        {photo.legende || "Un micro-ondes plein de charme"}
      </figcaption>
      <form action={vote.bind(null, photo.id)} className="mt-4">
        <button
          type="submit"
          disabled={!isLoggedIn || hasVoted}
          className="btn-primary w-full"
        >
          {buttonLabel}
        </button>
      </form>
    </figure>
  );
}
