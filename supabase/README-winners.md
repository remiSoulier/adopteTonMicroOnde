# Historique des gagnants

Exécuter `winners.sql` dans le SQL Editor Supabase (compte postgres), puis ouvrir `/gagnants` avec un utilisateur connecté. Ce script n'a pas été appliqué à la base distante par Codex.

L'historique et la fenêtre de résultats sont en lecture seule : aucune attribution n'est créée ou modifiée. Les gagnants sont exclusivement les titulaires de réservations enregistrées dans `public.reservations`.

Convention de dates : les photos déposées du 19 à 10 h au 20 à 10 h participent au vote du 20 à 10 h au 21 à 10 h, heure de Paris. La carte est intitulée « 21 » (jour de clôture) et affiche les réservations dont `date` vaut le 21. Les limites prennent en compte l'heure d'été et d'hiver. Le vote en cours est exclu des listes et une consultation directe de ses résultats est refusée côté base.

Les dates proviennent des participations ou des réservations existantes. Une journée sans participation ni réservation n'est pas inventée. Une journée clôturée sans attribution affiche un état vide explicite. Les listes sont paginées par 30 jours.

Le schéma des réservations ne contient pas d'identifiant de photo : lorsqu'un gagnant possède exactement une photo dans la période de dépôt, elle est affichée. S'il en possède plusieurs ou aucune, son pseudo et le micro-ondes attribué sont affichés sans choisir arbitrairement une photo gagnante.

Les fonctions `security definer` exposent seulement les journées clôturées et les informations nécessaires aux résultats, aux utilisateurs connectés. Cela évite que la RLS sur les profils ou réservations masque les autres gagnants. Les tables et leurs politiques existantes ne sont pas modifiées. Le nom du micro-ondes et le pseudo sont lus dans les tables actuelles : les renommages sont donc visibles dans l'historique.

Tests : copier `winners.test.mjs` et `winners.sql` dans un dossier temporaire contenant `@electric-sql/pglite`, puis exécuter `node winners.test.mjs`.
