export type ClosedElection = {
  day: string;
  voting_start: string;
  voting_end: string;
  photo_count: number;
};

export type Winner = {
  reservation_id: string;
  user_id: string;
  pseudo: string;
  photo_url: string | null;
  legende: string | null;
  microwave_name: string;
};

export type WinnersResult = { winners: Winner[]; error?: string };

export function formatElectionDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Europe/Paris" }).format(new Date(value));
}
