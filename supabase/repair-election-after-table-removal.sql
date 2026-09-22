-- À exécuter dans Supabase après suppression de cancelled_elections.
-- Les fonctions PL/pgSQL peuvent survivre au DROP TABLE CASCADE.
-- Ne supprime aucune photo, aucun vote et aucune réservation.
begin;
drop trigger if exists guard_cancelled_election_vote on public.votes;
drop trigger if exists guard_cancelled_election_reservation on public.reservations;
drop function if exists public.guard_cancelled_election_vote();
drop function if exists public.guard_cancelled_election_reservation();
notify pgrst, 'reload schema';
commit;
