
export type Profile = {
  id: string;
  pseudo: string;
  avatar_url: string | null;
};

export type Photo = {
  id: string;
  user_id: string;
  url: string;
  legende: string;
  created_at: string;
};

export type Vote = {
  id: string;
  photo_id: string;
  voter_id: string;
  created_at: string;
};

export type Microwave = {
  id: string;
  nom: string;
};

export type Reservation = {
  id: string;
  microwave_id: string;
  user_id: string;
  date: string; 
  created_at: string;
};

export type PhotoWithVotes = Photo & {
  vote_count: number;
};
