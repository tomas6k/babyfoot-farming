# Modifications proposées pour la fonction get_global_stats

## 1. Problématique actuelle

Actuellement, les titres "Les Gueux", "Le Charpentier" et "Le Boulanger" utilisent un calcul de win_rate pour déterminer les pires performances, ce qui peut créer une incohérence conceptuelle. Par exemple, "Les Gueux" sont censés être la pire paire, mais le système les sélectionne en triant sur le win_rate le plus bas, qui est calculé de la même manière que pour la meilleure paire.

## 2. Modifications proposées

### 2.1 Pour le titre "Les Gueux" (worst_pair)

Remplacer le calcul actuel par un calcul de loss_rate bayésien :

```sql
-- Modification dans la section "pair_stats"
SELECT 
    player1_id,
    player2_id,
    COUNT(*) as total_matches,
    SUM(CASE WHEN won THEN 1 ELSE 0 END) as victories,
    SUM(CASE WHEN NOT won THEN 1 ELSE 0 END) as defeats,
    (SUM(CASE WHEN won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) as bayesian_win_rate,
    (SUM(CASE WHEN NOT won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) as bayesian_loss_rate
FROM (
    -- Le reste du code reste identique
) pairs
GROUP BY player1_id, player2_id
HAVING COUNT(*) >= 3
```

Et modifier la section de retour JSON pour worst_pair :

```sql
'worst_pair', (
    SELECT JSONB_BUILD_OBJECT(
        'player1_id', player1_id,
        'player2_id', player2_id,
        'victories', victories,
        'defeats', defeats,
        'total_matches', total_matches,
        'win_rate', bayesian_win_rate,
        'loss_rate', bayesian_loss_rate
    )
    FROM pair_stats
    ORDER BY bayesian_loss_rate DESC, total_matches DESC
    LIMIT 1
)
```

### 2.2 Pour "Le Charpentier" (worst_attacker)

Modifier la section "position_stats" :

```sql
SELECT 
    player_id,
    position,
    COUNT(*) as total_matches,
    SUM(CASE WHEN won THEN 1 ELSE 0 END) as victories,
    SUM(CASE WHEN NOT won THEN 1 ELSE 0 END) as defeats,
    (SUM(CASE WHEN won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) as bayesian_win_rate,
    (SUM(CASE WHEN NOT won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) as bayesian_loss_rate
FROM (
    -- Le reste du code reste identique
) positions
GROUP BY player_id, position
HAVING COUNT(*) >= 3
```

Et modifier la section de retour JSON pour worst_attacker :

```sql
'worst_attacker', (
    SELECT JSONB_BUILD_OBJECT(
        'player_id', player_id,
        'victories', victories,
        'defeats', defeats,
        'total_matches', total_matches,
        'win_rate', bayesian_win_rate,
        'loss_rate', bayesian_loss_rate
    )
    FROM position_stats
    WHERE position = 'attacker'
    ORDER BY bayesian_loss_rate DESC, total_matches DESC
    LIMIT 1
)
```

### 2.3 Pour "Le Boulanger" (worst_defender)

Modifier la section de retour JSON pour worst_defender :

```sql
'worst_defender', (
    SELECT JSONB_BUILD_OBJECT(
        'player_id', player_id,
        'victories', victories,
        'defeats', defeats,
        'total_matches', total_matches,
        'win_rate', bayesian_win_rate,
        'loss_rate', bayesian_loss_rate
    )
    FROM position_stats
    WHERE position = 'defender'
    ORDER BY bayesian_loss_rate DESC, total_matches DESC
    LIMIT 1
)
```

## 3. Bénéfices des modifications

1. **Cohérence conceptuelle** : Les titres négatifs (Les Gueux, Le Charpentier, Le Boulanger) utiliseront un loss_rate plutôt qu'un win_rate, ce qui est plus logique.

2. **Ajustement bayésien pour les petits échantillons** : Le calcul bayésien sera maintenu pour éviter les biais sur les petits échantillons, mais appliqué aux défaites plutôt qu'aux victoires.

3. **Meilleure sélection** : Le tri par loss_rate décroissant sélectionnera les joueurs/paires qui ont réellement les pires performances, plutôt que simplement l'inverse des meilleures performances.

## 4. Modifications dans le frontend

Pour que ces changements soient effectifs, il faudra également modifier le composant `SeasonTitles.tsx` pour utiliser `loss_rate` au lieu de `win_rate` pour l'affichage des titres concernés :

```typescript
// Pour Les Gueux
statValue={
  globalStats?.worst_pair?.loss_rate
    ? `${(globalStats.worst_pair.loss_rate * 100).toFixed(1)}% taux d'échec`
    : "N/A"
}
statTooltip={
  globalStats?.worst_pair
    ? `${globalStats.worst_pair.defeats} défaites sur ${globalStats.worst_pair.total_matches} matchs`
    : "N/A"
}

// Pour Le Charpentier
statValue={
  globalStats?.positions?.worst_attacker?.loss_rate
    ? `${(globalStats.positions.worst_attacker.loss_rate * 100).toFixed(1)}% taux d'échec`
    : "N/A"
}
statTooltip={
  globalStats?.positions?.worst_attacker
    ? `${globalStats.positions.worst_attacker.defeats} défaites sur ${globalStats.positions.worst_attacker.total_matches} matchs`
    : "N/A"
}

// Pour Le Boulanger
statValue={
  globalStats?.positions?.worst_defender?.loss_rate
    ? `${(globalStats.positions.worst_defender.loss_rate * 100).toFixed(1)}% taux d'échec`
    : "N/A"
}
statTooltip={
  globalStats?.positions?.worst_defender
    ? `${globalStats.positions.worst_defender.defeats} défaites sur ${globalStats.positions.worst_defender.total_matches} matchs`
    : "N/A"
}
```

## 5. Migration en production

Pour déployer ces modifications :

1. Modifier la fonction `get_global_stats()`
2. Tester avec des requêtes SQL pour vérifier les résultats
3. Mettre à jour le frontend pour utiliser les nouveaux champs
4. Déployer les modifications ensemble pour éviter des incohérences temporaires 