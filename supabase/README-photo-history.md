# Historique personnel des participations

Exécuter `photo-history.sql` dans le SQL Editor Supabase (compte postgres). Ce script n'a pas été appliqué à la base distante par Codex.

Expose deux fonctions `security definer`, réservées à l'utilisateur connecté (`auth.uid()`) :

- `get_my_photo_history(p_limit int default 12)` : les photos de l'appelant, les plus récentes d'abord, avec le nombre de votes reçus, si le vote de leur période est clos, et si l'appelant a gagné (réservation enregistrée pour le jour suivant). Reprend exactement le découpage en journées de `winners.sql` (`((created_at at time zone 'Europe/Paris' - interval '10 hours')::date + 1)`), donc `election_day` correspond au `day` que `list_closed_elections` afficherait, et `won` au même critère que `get_election_winners` (`reservations.date = election_day + 1`).
- `delete_my_photo(p_photo_id uuid)` : supprime une photo appartenant à l'appelant, uniquement si elle n'a encore reçu aucun vote. Une fois un vote enregistré, même le propriétaire ne peut plus la retirer — ça éviterait de faire disparaître un bulletin en cours de vote.

La suppression du fichier dans le storage `photos` reste faite côté client (même logique que le rollback déjà présent dans `PhotoUploader`), cette fonction ne touche que la ligne en base.

Tests : copier `photo-history.test.mjs` et `photo-history.sql` dans un dossier temporaire contenant `@electric-sql/pglite`, puis exécuter `node photo-history.test.mjs`.
