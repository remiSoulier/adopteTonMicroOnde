# Informations personnelles

Exécuter `personal-settings.sql` dans le SQL Editor Supabase après `roles.sql`, puis redémarrer le serveur Next.js (la taille maximale des formulaires passe à 3 Mo pour accepter une image de 2 Mo). Le script n'a pas été appliqué à la base distante par Codex.

La section `/parametres` permet de modifier le pseudo affiché dans `profiles`, d'importer/remplacer/supprimer une photo et de changer le mot de passe via Supabase Auth. Elle est accessible à tous les utilisateurs connectés disposant d'un profil et d'un rôle valides.

Le pseudo affiché est séparé de l'identifiant de connexion : ce dernier reste le préfixe de l'adresse Auth `@microonde.app` créée lors de l'inscription et est indiqué dans le formulaire. Le changement de pseudo ne change ni l'adresse Auth ni le mot de passe. Les métadonnées Auth ne servent pas à afficher le nouveau pseudo : les écrans utilisent `profiles.pseudo`.

Les photos JPEG, PNG et WebP sont limitées à 2 Mo et stockées dans le bucket public `profile-avatars`, dans un dossier par utilisateur. Leur contenu commence par la signature du format autorisé ; les SVG ne sont pas acceptés. Les photos sont accessibles publiquement par leur URL. Les utilisateurs ne peuvent importer/lister/supprimer que leurs propres fichiers. Les remplacements utilisent de nouveaux noms, et les anciens fichiers de ce bucket sont supprimés après sauvegarde réussie. Une importation est annulée si la sauvegarde du profil échoue. Une interruption réseau exceptionnelle peut laisser un fichier inutilisé.

Les fonctions SQL utilisent exclusivement `auth.uid()` pour choisir le profil modifié et n'acceptent aucun identifiant ni rôle fourni par le formulaire. Elles ne modifient que `pseudo` et `avatar_url`. Les restrictions de gestion des rôles restent en place.

Le changement de mot de passe demande le mot de passe actuel et une confirmation du nouveau (8 à 72 caractères). Le mot de passe actuel est vérifié par Auth via un client temporaire sans persistance ; sa session est ensuite révoquée localement. La mise à jour passe par `auth.updateUser`, jamais par une table ou une clé administrateur. Les règles de sécurité supplémentaires de Supabase restent appliquées. Si CAPTCHA est obligatoire pour la connexion ou si Supabase exige une réauthentification supplémentaire, le formulaire refuse l'opération et affiche un message ; il ne contourne pas ces règles.

Références : https://supabase.com/docs/reference/javascript/auth-updateuser et https://supabase.com/docs/guides/storage/security/access-control
