# Installation des rôles

1. Exécuter `roles.sql` dans le SQL Editor Supabase connecté en tant que `postgres`.
2. Désigner manuellement le premier superadmin avec son identifiant exact de `profiles.id` :

```sql
update public.profiles
set role = 3
where id = 'REMPLACER_PAR_UUID_DU_COMPTE';
```

3. Ouvrir `/parametres` avec ce compte.

La migration ne désigne aucun superadmin automatiquement. Elle ne modifie pas les politiques métier des photos, votes ou réservations.

- 1 : utilisateur, accès à son rôle et aux fonctionnalités existantes.
- 2 : admin, consultation paginée des profils et des rôles.
- 3 : superadmin, attribution des rôles aux autres comptes.

La colonne `profiles.role` vaut 1 par défaut et accepte uniquement 1, 2 ou 3. Le trigger force les nouveaux profils au rôle 1, même si une inscription tente de transmettre un autre rôle. Il interdit aux clients de modifier directement `role` ou `id`, ainsi que de supprimer un profil superadmin. Les fonctions SQL lisent le rôle en base, vérifient l'appelant et utilisent un chemin de recherche vide. Les changements sont sérialisés et le superadmin ne peut pas modifier son propre rôle, ce qui conserve au moins un superadmin lors des changements depuis l'application. Les opérations manuelles de l'administrateur de base restent possibles.

Les profils existants sont conservés. Le système suppose que le mécanisme actuel d'inscription crée déjà un profil dans `public.profiles` ; un profil absent affiche une erreur de configuration sans accorder de droits.

Tests : `roles.test.mjs` utilise une base PostgreSQL temporaire PGlite, indépendante de Supabase. Installer `@electric-sql/pglite` dans un dossier temporaire et exécuter le test depuis ce dossier avec une copie de `roles.sql`.

Référence : https://supabase.com/docs/guides/database/functions
