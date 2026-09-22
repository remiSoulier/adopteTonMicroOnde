# Administration des micro-ondes

Appliquer `roles.sql`, puis la version complète de `microwave-admin.sql` dans l’éditeur SQL Supabase. La migration peut être réappliquée pour mettre à jour la version précédente. Elle ajoute `is_active` (true par défaut) et `deleted_at` à `microwaves`.

Les admins (2) et superadmins (3) peuvent consulter, ajouter, renommer, activer, désactiver et supprimer les appareils. Les droits sont vérifiés sur la page, dans les actions serveur et dans les fonctions SQL. Les écritures directes des clients restent bloquées, y compris avec des politiques permissives préexistantes.

## Suppression et historique

Une réservation bloque la suppression si sa date est inconnue ou supérieure ou égale à la date du jour à Paris moins deux jours. Une réservation d’avant-hier bloque donc encore la suppression ; une réservation datant de trois jours ne la bloque plus. Une réservation future bloque également la suppression. Les appareils sans réservation sont supprimables.

La suppression est logique : `deleted_at` est renseigné et `is_active` devient false. L’appareil disparaît de la liste d’administration et ne peut plus être modifié ou réactivé. Les anciennes réservations, leurs clés étrangères et les noms affichés dans l’historique des gagnants sont conservés. Une désactivation simple est réversible et ne change pas les réservations existantes.

## Tirage et attributions

Le trigger `guard_microwave_reservation` refuse toute nouvelle attribution d’un appareil désactivé ou supprimé, même depuis une fonction SQL avec privilèges élevés. Il verrouille la ligne de l’appareil pendant l’attribution pour sérialiser les changements de statut. La suppression verrouille temporairement les écritures de réservations pendant son contrôle.

Le code appelle `draw_microwave`, mais cette fonction n’existe pas encore dans Supabase (confirmé par le propriétaire du projet). Le bouton de tirage reste donc inopérant tant que cette fonction n’est pas implémentée. Sa future requête de sélection devra filtrer `m.is_active = true AND m.deleted_at IS NULL` (adapter l’alias `m`). Sans ce filtre, le trigger empêche une attribution incorrecte, mais le tirage peut échouer s’il sélectionne un appareil indisponible. Les politiques publiques de lecture restent inchangées afin de préserver les accès historiques.

La migration suppose les colonnes existantes `microwaves.id` (UUID), `microwaves.nom`, `reservations.microwave_id` et `reservations.date` (date).

Tests : `node supabase/microwave-admin.test.mjs` avec `@electric-sql/pglite` disponible.
