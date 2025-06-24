# Plan de Désactivation de l'Authentification en Production

## Statuts
- 🔴 Non commencé
- 🟡 En cours
- 🟢 Terminé
- ⏸️ En pause
- ❌ Annulé

## Tâches

### 1. Nettoyage des Fichiers [🟢]

#### 1.1 Suppression des Composants et Pages [🟢]
- [x] Supprimer `/src/app/login/`
- [x] Supprimer `/src/app/auth/`
- [x] Supprimer `/src/app/profile/`
- [x] Supprimer `src/components/AuthLayout.tsx`
- [x] Supprimer `src/components/AuthGuard.tsx`

#### 1.2 Modification des Fichiers Existants [🟢]
- [x] Nettoyer `src/lib/supabase.ts`
- [x] Nettoyer `src/utils/supabase/client.ts`
- [x] Mettre à jour `src/components/MainNav.tsx`
  - [x] Retirer les routes login/profile
  - [x] Supprimer le bouton de déconnexion

### 2. Base de Données [🟢]

#### 2.1 Modification du Schéma [🟢]
- [x] Exécuter la modification de la table players
```sql
ALTER TABLE players ALTER COLUMN user_id DROP NOT NULL;
```

#### 2.2 Désactivation RLS [🟢]
- [x] Désactiver RLS sur matches
- [x] Désactiver RLS sur players
- [x] Désactiver RLS sur game_config

### 3. Dépendances [🟢]

#### 3.1 Nettoyage Package.json [🟢]
- [x] Retirer @supabase/auth-helpers-nextjs
- [x] Retirer @supabase/auth-ui-react
- [x] Retirer @supabase/auth-ui-shared
- [x] Exécuter npm install

### 4. Configuration [🟢]

#### 4.1 Variables d'Environnement [🟢]
- [x] Retirer SUPABASE_SERVICE_ROLE_KEY de .env.local
- [x] Vérifier que seules les variables nécessaires sont présentes (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 5. API Routes [🟢]

#### 5.1 Modification des Routes [🟢]
- [x] Nettoyer `src/app/api/stats/base/route.ts`
- [x] Nettoyer `src/app/api/levels/route.ts`
- [x] Nettoyer `src/app/api/base-stats/route.ts`

#### 5.2 Tests des Routes [🟢]
- [x] Tester route stats/base
- [x] Tester route levels
- [x] Tester route base-stats

### 6. Types et Interfaces [🟢]

#### 6.1 Nettoyage des Types [🟢]
- [x] Identifier tous les types liés à l'auth
- [x] Mettre à jour le type user_id dans Database
- [x] Mettre à jour les interfaces dépendantes

### 7. Documentation [🟢]

#### 7.1 Mise à Jour Documentation [🟢]
- [x] Mettre à jour README.md
- [x] Mettre à jour la documentation API
- [x] Mettre à jour le guide d'installation

### 8. Tests [🔴]

#### 8.1 Nettoyage des Tests [🔴]
- [ ] Supprimer les tests d'authentification
- [ ] Adapter les tests existants
- [ ] Mettre à jour les tests E2E

### 9. Déploiement [🔴]

#### 9.1 Préparation [🔴]
- [ ] Sauvegarder la base de données
- [ ] Créer un script de rollback
- [ ] Préparer les requêtes SQL

#### 9.2 Exécution [🔴]
- [ ] Appliquer les modifications de schéma
- [ ] Déployer les changements de code
- [ ] Vérifier les logs

#### 9.3 Vérification [🔴]
- [ ] Tester les fonctionnalités principales
- [ ] Vérifier les performances
- [ ] Monitorer les erreurs pendant 24h

## Suivi des Progrès

### Progression Globale
- Total des tâches : 42
- Complétées : 0
- En cours : 0
- Non commencées : 42

### Prochaines Étapes Recommandées
1. Commencer par la suppression des fichiers (1.1)
2. Modifier la base de données (2.1 et 2.2)
3. Nettoyer les dépendances (3.1) 
