# Jeu de test de l'historique des participations

1. Installer `photo-history.sql` si ce n'est pas déjà fait.
2. Exécuter `seed-photo-history.sql` dans le SQL Editor Supabase en tant que postgres.
3. Se connecter à l'application avec le compte dont le pseudo est `Ely` et ouvrir `/participation`.

Le script cherche un profil existant dont le pseudo est exactement `Ely` (ou, à défaut, le contient) et refuse de continuer si aucun n'est trouvé. Il ne crée aucun compte Auth ni profil.

Trois journées d'élection closes sont créées pour ce profil, en respectant le même découpage horaire que `winners.sql` (dépôt de la veille-veille 10 h à la veille 10 h, vote de la veille 10 h à 10 h le jour de clôture, heure de Paris) :

- la plus récente : 2 votes, aucune réservation → statut **Perdue**
- la suivante : 3 votes, une réservation le lendemain → statut **Gagnée**
- la plus ancienne : 0 vote, aucune réservation → statut **Perdue**

Les dates sont recherchées avant aujourd'hui, dans une période sans photo ni réservation existante pour ce profil, pour ne pas mélanger les vrais essais avec les données de test. Les votants sont d'autres profils existants (jusqu'à trois, réutilisés en boucle s'il y en a moins) ; s'il n'existe aucun autre profil, le script vote avec le profil `Ely` lui-même. Les photos, la légende et le micro-ondes portent la mention `[TEST HISTORIQUE]`. Les images sont des illustrations Picsum.

Les identifiants sont fixes : réexécuter le script recrée les mêmes trois journées sans les dupliquer, et rafraîchit ses propres votes à chaque passage (les votes n'ont pas d'identifiant propre dans ce schéma). Le script termine par une vérification : il relit `get_my_photo_history()` comme le ferait le profil `Ely` connecté, et affiche les trois lignes de test attendues.

Pour enlever le jeu de test, exécuter `cleanup-photo-history.sql`. Il ne supprime aucun profil ni compte, et refuse de supprimer le micro-ondes de test si une réservation extérieure au jeu de test l'utilise encore.
