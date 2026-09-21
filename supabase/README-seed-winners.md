# Jeu de test des gagnants

1. Installer `winners.sql` si ce n'est pas déjà fait.
2. Exécuter `seed-winners.sql` dans le SQL Editor Supabase en tant que postgres.
3. Se connecter à l'application et ouvrir `/gagnants`. Les dates exactes sont renvoyées par le script SQL.

Le jeu réutilise les deux premiers profils existants (par identifiant). Il nécessite donc au moins deux profils et ne crée aucun compte Auth. Les pseudos affichés sont ceux de ces profils.

Trois journées clôturées sont créées : deux gagnants (micro-ondes Orange et Bleu), un gagnant (Orange), puis aucune attribution. Quatre photos et trois réservations sont ajoutées. Les dates sont recherchées avant aujourd'hui dans une période sans participation ni réservation existante. Les photos et micro-ondes portent la mention `[TEST GAGNANTS]`. Les images sont des illustrations Picsum.

Aucun vote n'est nécessaire : la page gagnants lit les attributions enregistrées, sans calculer un classement. Les données utilisent des identifiants fixes ; réexécuter le script n'ajoute pas de doublons et conserve les dates initiales.

Pour enlever le jeu de test, exécuter `cleanup-winners.sql`. Ce script ne supprime aucun profil ni compte. Il refuse de supprimer les photos si des votes les utilisent, ou les micro-ondes si des réservations extérieures au jeu de test les utilisent.

Vérifié sur une base PostgreSQL locale temporaire : cas 2/1/0 gagnants, présence des photos et des micro-ondes attendus, réexécution sans doublons et nettoyage préservant les profils. Les scripts n'ont pas été exécutés sur la base Supabase distante.
