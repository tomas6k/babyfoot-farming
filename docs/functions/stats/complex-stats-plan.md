# Plan de modification des Statistiques Complexes

## Contexte

Les critères actuels pour le calcul des statistiques complexes dans la fonction `get_complex_stats` doivent être modifiés pour améliorer la pertinence des résultats et harmoniser les conditions d'affichage.

## Modifications requises

### 1. Séries de Victoires/Défaites (Le Saint-Baby, Le Bouffon du Roi)

**Critères actuels :**
- Minimum 3 matchs consécutifs requis
- Séquences consécutives uniquement
- Tri par longueur de série
- En cas d'égalité, tri par player_id
- Tous les joueurs à égalité sont inclus dans le résultat
- Inclut les dates de début et fin de série

**Modifications :** 
- Aucune modification nécessaire pour cette catégorie

### 2. Performances par Position (Messire, Le Charpentier, Monseigneur, Le Boulanger)

**Critères actuels :**
- Minimum 5 matchs par position
- Calcul de taux bayésiens pour les victoires/défaites (multiplié par 100)
- Tri par taux de victoire/défaite
- En cas d'égalité, tri par player_id
- Tous les joueurs à égalité sont inclus dans le résultat

**Modifications :**
- Maintenir le minimum de 5 matchs par position
- Ajouter une condition de visibilité : minimum 15 matchs joués sur la période
- Conserver les autres critères

### 3. Statistiques des Paires (La Royauté, Les Gueux)

**Critères actuels :**
- Minimum 3 matchs ensemble
- Calcul de taux bayésiens pour les victoires/défaites (multiplié par 100)
- Tri par taux de victoire/défaite
- En cas d'égalité, tri par player_id de la paire
- Toutes les paires à égalité sont incluses dans le résultat

**Modifications :**
- Maintenir le minimum de 3 matchs ensemble
- Ajouter une condition de visibilité : minimum 15 matchs joués sur la période
- Conserver les autres critères

## Tâches techniques

### Modification de la documentation
- [x] Créer un plan de modification (ce document)
- [x] Mettre à jour la documentation dans `complex-stats.md`

### Modification du code
- [x] Ajouter un comptage du nombre total de matchs sur la période
```sql
-- Calcul du nombre total de matchs
SELECT COUNT(*) INTO total_match_count FROM temp_match_data;
```
- [x] Modifier le code pour les statistiques par position :
  - [x] Maintenir la condition `WHERE total_matches >= 5` dans la CTE `position_stats_ranked`
  - [x] Ajouter une condition CASE dans la génération du JSON pour vérifier si le nombre total de matchs est >= 15
- [x] Modifier le code pour les statistiques des paires :
  - [x] Maintenir la condition `WHERE total_matches >= 3` dans la CTE `pair_stats_ranked`
  - [x] Ajouter une condition CASE dans la génération du JSON pour vérifier si le nombre total de matchs est >= 15

### Tests
- [x] Tester avec un nombre de matchs < 15 (les statistiques de position et de paire devraient être NULL)
- [x] Tester avec un nombre de matchs ≥ 15 (toutes les statistiques devraient être calculées)
- [x] Vérifier que les séries fonctionnent toujours comme avant
- [x] Vérifier que les joueurs avec au moins 5 matchs apparaissent dans les statistiques de position
- [x] Vérifier que les paires avec au moins 3 matchs apparaissent dans les statistiques de paire

## Résultats des tests

| Test | Résultat | Notes |
|------|----------|-------|
| Matchs < 15 | ✅ Succès | Les statistiques de position et de paire sont NULL |
| Matchs ≥ 15 | ✅ Succès | Toutes les statistiques sont calculées |
| Séries | ✅ Succès | Les séries continuent de fonctionner (ex: Toshi a une série de 5 victoires) |
| Joueurs avec 5+ matchs | ✅ Succès | Les joueurs avec au moins 5 matchs à une position apparaissent |
| Paires avec 3+ matchs | ✅ Succès | Les paires avec au moins 3 matchs ensemble apparaissent |

## Calendrier

1. **Préparation (J1):**
   - Documentation des modifications
   - Revue du plan

2. **Développement (J2-J3):**
   - Implémentation des modifications dans la fonction SQL
   - Tests unitaires

3. **Validation (J4):**
   - Tests fonctionnels
   - Vérification des cas limites

4. **Déploiement (J5):**
   - Migration en production
   - Vérification post-déploiement

## Suivi des tâches

| Tâche | Statut | Assigné à | Notes |
|-------|--------|-----------|-------|
| Documenter les modifications | Fait | | Plan créé |
| Mettre à jour la documentation | Fait | | |
| Implémenter le comptage des matchs | Fait | | |
| Modifier les critères de position | Fait | | Minimum 5 matchs |
| Maintenir les critères de paire | Fait | | Minimum 3 matchs |
| Tests unitaires | Fait | | Tous les tests sont passés |
| Tests fonctionnels | Fait | | Vérification avec des cas réels |
| Déploiement | Fait | | Fonction mise à jour dans Supabase |

## Conclusion

Les modifications apportées à la fonction `get_complex_stats` ont été implémentées avec succès et tous les tests ont été validés. Les nouveaux critères permettent maintenant :

1. De maintenir le minimum de 5 matchs par position
2. De maintenir le minimum de 3 matchs ensemble pour les paires
3. D'afficher les statistiques uniquement si un minimum de 15 matchs ont été joués sur la période
4. De conserver le calcul des séries avec le critère de 3 matchs consécutifs minimum

Ces changements offrent un bon équilibre entre pertinence statistique (grâce aux minimums de matchs) et visibilité conditionnelle des données. La condition globale de 15 matchs assure que les statistiques ne sont affichées que lorsqu'il y a suffisamment de données pour être significatives.

## Risques et atténuations

- **Risque :** Le minimum de 5 matchs pourrait exclure certains joueurs occasionnels.
  - **Atténuation :** Ce seuil minimum assure une fiabilité statistique suffisante.

- **Risque :** La condition de 15 matchs pourrait être trop restrictive pour certaines périodes.
  - **Atténuation :** Ce seuil peut être ajusté après évaluation des données réelles.

- **Risque :** Les performances pourraient être impactées par le traitement de nombreuses paires.
  - **Atténuation :** Le maintien du minimum de 3 matchs par paire aide à limiter le nombre de paires traitées. 