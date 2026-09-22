# Attribution selon les votes

Exécuter dans Supabase, dans cet ordre : `roles.sql`, `microwave-admin.sql`, puis `draw-microwave.sql`. Ce dernier installe la fonction attendue par le bouton superadmin de `/election`. Aucun tirage distant n'a été lancé par Codex.

La fonction traite la dernière période clôturée à 10 h, Europe/Paris. Exemple le 22 après 10 h : photos déposées du 20 à 10 h au 21 à 10 h, votes du 21 à 10 h au 22 à 10 h, réservations datées du 22. Avant 10 h le 22, elle traite la clôture du 21. Le vote en cours n'est pas clôturé prématurément.

Classement : nombre de votants distincts par photo, puis date de publication croissante, puis identifiant de photo pour départager parfaitement. Au moins un vote est nécessaire. Si un utilisateur a plusieurs photos, sa meilleure photo détermine sa place ; il reçoit au maximum un appareil. Les appareils sont attribués par nom puis identifiant, uniquement s'ils sont actifs et non supprimés. Les appareils occupés et utilisateurs déjà servis pour la date sont exclus ; une réservation sans date bloque également leur réutilisation. Les réservations existantes ne sont pas modifiées.

La transaction verrouille les réservations puis les appareils pendant le calcul et l'insertion, dans le même ordre que la suppression administrative. Une trace dans `microwave_draws` empêche de relancer une journée déjà attribuée, même avec un second clic ou une requête simultanée. Les cas sans appareil / sans candidat ne finalisent pas la journée pour permettre de réessayer après correction. Les identités et le rôle 3 sont vérifiés dans la base, indépendamment de la page.

Les résultats restent affichés depuis `reservations` dans `/gagnants`. Si un gagnant possède plusieurs photos, la fenêtre n'affiche pas arbitrairement une photo : le schéma actuel des réservations ne conserve pas l'identifiant de la photo classée.
