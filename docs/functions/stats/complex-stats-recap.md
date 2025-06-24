# Récapitulatif des Modifications pour get_complex_stats

## Vue d'ensemble

Ce document résume les modifications à apporter à la fonction `get_complex_stats` pour mettre en œuvre les nouveaux critères de calcul des statistiques complexes.

## Modifications des critères

| Catégorie | Critères actuels | Nouveaux critères |
|-----------|------------------|-------------------|
| **Séries de Victoires/Défaites** | Minimum 3 matchs consécutifs | *Inchangé* |
| **Performances par Position** | Minimum 5 matchs par position | Pas de minimum par position + visible si au moins 15 matchs total |
| **Statistiques des Paires** | Minimum 3 matchs ensemble | Pas de minimum par paire + visible si au moins 15 matchs total |

## Modifications techniques

### 1. Ajouter une variable pour le comptage des matchs
```sql
DECLARE
    streaks_result jsonb;
    positions_result jsonb;
    pairs_result jsonb;
    match_data_result jsonb;
    total_match_count integer; -- Nouvelle variable
```

### 2. Compter le nombre total de matchs
```sql
-- Après la création de la table temporaire
SELECT COUNT(*) INTO total_match_count FROM temp_match_data;
```

### 3. Pour les statistiques par position
- Supprimer cette ligne dans la CTE `position_stats_ranked` :
```sql
WHERE total_matches >= 5
```
- Modifier la génération du JSON :
```sql
SELECT 
    CASE
        WHEN total_match_count >= 15 THEN
            jsonb_build_object(
                -- Contenu existant
            )
        ELSE NULL
    END INTO positions_result;
```

### 4. Pour les statistiques des paires
- Supprimer cette ligne dans la CTE `pair_stats_ranked` :
```sql
WHERE total_matches >= 3
```
- Modifier la génération du JSON :
```sql
SELECT 
    CASE
        WHEN total_match_count >= 15 THEN
            jsonb_build_object(
                -- Contenu existant
            )
        ELSE NULL
    END INTO pairs_result;
```

## Liste de vérification pour les tests

- [ ] Vérifier que les séries fonctionnent toujours avec le minimum de 3 matchs
- [ ] Vérifier que les statistiques de position incluent tous les joueurs, même avec un seul match
- [ ] Vérifier que les statistiques de paire incluent toutes les paires, même avec un seul match
- [ ] Vérifier que les statistiques de position sont NULL si moins de 15 matchs au total
- [ ] Vérifier que les statistiques de paire sont NULL si moins de 15 matchs au total
- [ ] Vérifier que le comportement est correct pour les différentes périodes (mois, plage de dates)
- [ ] Vérifier que le format de retour reste inchangé
- [ ] Vérifier que toutes les égalités sont toujours gérées correctement

## Impact attendu

### Avantages
- Plus grande inclusion des joueurs avec peu de matchs
- Cohérence dans l'affichage des statistiques (seuil global)
- Maintien de la précision grâce aux calculs bayésiens

### Risques
- Légère augmentation du nombre de joueurs/paires dans les résultats
- Potentielle baisse de performance pour les périodes avec beaucoup de matchs (plus de paires à traiter)

## Calendrier d'implémentation
- Documentation et planification : Terminé
- Implémentation : À faire
- Tests : À faire
- Déploiement : À faire 