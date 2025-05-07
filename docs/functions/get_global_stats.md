# Documentation de la fonction `get_global_stats()`

## Table des matières
1. [Description](#description)
2. [Paramètres](#paramètres)
3. [Valeurs de retour](#valeurs-de-retour)
4. [Fonctionnalités implémentées](#fonctionnalités-implémentées)
5. [Statistiques amusantes](#statistiques-amusantes)
6. [Performance](#performance)
7. [Tests](#tests)
8. [Utilisation](#utilisation)
9. [Maintenance](#maintenance)
10. [Plan de migration](#plan-de-migration)

## Description
Cette fonction calcule diverses statistiques globales sur les matchs de babyfoot. Elle prend en compte tous les matchs joués et retourne des statistiques détaillées sur les performances des joueurs et des équipes.

## Paramètres

| Nom | Type | Description | Défaut |
|-----|------|-------------|---------|
| `p_date` | DATE | Date pour filtrer les statistiques du mois correspondant (NULL pour ignorer ce filtrage) | CURRENT_DATE |
| `p_date_start` | DATE | Date de début pour filtrer les statistiques sur une période spécifique | NULL |
| `p_date_end` | DATE | Date de fin pour filtrer les statistiques sur une période spécifique | NULL |

**Note sur la priorité des filtres:**
- Si `p_date_start` ET `p_date_end` sont fournis (non NULL), les statistiques sont calculées pour cette période spécifique.
- Si seul `p_date` est fourni (non NULL), les statistiques sont calculées pour le mois correspondant.
- Si tous les paramètres sont NULL, les statistiques sont calculées pour l'ensemble des matchs.

## Valeurs de retour

La fonction retourne un objet JSON contenant les statistiques calculées pour la période demandée.

### Format JSON
```json
{
  "best_pair": [{
    "player1_id": "UUID",
    "player2_id": "UUID",
    "player1_pseudo": "STRING",
    "player2_pseudo": "STRING",
    "victories": "INTEGER",
    "total_matches": "INTEGER",
    "win_rate": "DECIMAL"
  }],
  "worst_pair": [{
    "player1_id": "UUID",
    "player2_id": "UUID",
    "player1_pseudo": "STRING",
    "player2_pseudo": "STRING",
    "victories": "INTEGER",
    "defeats": "INTEGER",
    "total_matches": "INTEGER",
    "win_rate": "DECIMAL",
    "loss_rate": "DECIMAL"
  }],
  "perfect_wins": [{
    "player_id": "UUID",
    "pseudo": "STRING",
    "count": "INTEGER"
  }],
  "perfect_losses": [{
    "player_id": "UUID",
    "pseudo": "STRING",
    "count": "INTEGER"
  }],
  "close_wins": [{
    "player_id": "UUID",
    "pseudo": "STRING",
    "count": "INTEGER"
  }],
  "close_losses": [{
    "player_id": "UUID",
    "pseudo": "STRING",
    "count": "INTEGER"
  }],
  "streaks": {
    "longest_win_streak": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "streak": "INTEGER"
    }],
    "longest_lose_streak": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "streak": "INTEGER"
    }]
  },
  "positions": {
    "best_attacker": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL"
    }],
    "worst_attacker": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "defeats": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL",
      "loss_rate": "DECIMAL"
    }],
    "best_defender": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL"
    }],
    "worst_defender": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "defeats": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL",
      "loss_rate": "DECIMAL"
    }]
  },
  "activity": {
    "most_active": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "match_count": "INTEGER"
    }],
    "least_active": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "match_count": "INTEGER"
    }]
  },
  "fun_stats": {
    "le_dessert": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL"
    }],
    "le_fidele": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "favorite_partner_id": "UUID",
      "favorite_partner_pseudo": "STRING",
      "max_matches_with_partner": "INTEGER",
      "total_partners": "INTEGER",
      "fidelity_rate": "DECIMAL"
    }],
    "le_casanova": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "distinct_partners": "INTEGER",
      "total_matches": "INTEGER",
      "partner_change_rate": "DECIMAL"
    }],
    "first_blood": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "total_first_matches": "INTEGER",
      "win_rate": "DECIMAL"
    }],
    "le_revenger": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "total_revenge_matches": "INTEGER",
      "revenge_rate": "DECIMAL"
    }],
    "les_classicos": [{
      "team1_player1": "UUID",
      "team1_player2": "UUID",
      "team2_player1": "UUID",
      "team2_player2": "UUID",
      "team1_player1_pseudo": "STRING",
      "team1_player2_pseudo": "STRING",
      "team2_player1_pseudo": "STRING",
      "team2_player2_pseudo": "STRING",
      "total_matches": "INTEGER",
      "team1_victories": "INTEGER",
      "team2_victories": "INTEGER"
    }]
  }
}
```

## Fonctionnalités implémentées

### Structure actuelle de la fonction
La fonction utilise plusieurs Common Table Expressions (CTEs) pour organiser le calcul des statistiques:

1. `match_data`: Filtre les matchs par période et calcule le gagnant (white_won)
2. `pair_stats`: Calcule les statistiques des paires de joueurs
3. `position_stats`: Calcule les statistiques par position (attaquant/défenseur)
4. `pair_stats_with_pseudo`: Ajoute les pseudos aux statistiques des paires
5. `position_stats_with_pseudo`: Ajoute les pseudos aux statistiques de position
6. `perfect_wins_data`: Calcule les victoires parfaites (10-0)
7. `perfect_losses_data`: Calcule les défaites parfaites (0-10)
8. `close_wins_data`: Calcule les victoires serrées (10-9)
9. `close_losses_data`: Calcule les défaites serrées (9-10)
10. `streaks`: Calcule les séries de victoires/défaites
11. `streaks_with_pseudo`: Ajoute les pseudos aux séries
12. `activity_stats`: Calcule les statistiques d'activité

### Règles métier implémentées

1. **Filtrage temporel**
   - Filtrage par mois spécifique via `p_date`
   - Filtrage par plage de dates via `p_date_start` et `p_date_end`
   - Priorité au filtrage par plage de dates si les deux sont spécifiés

2. **Calcul des statistiques**
   - Utilisation de taux bayésiens pour éviter les biais sur petit échantillon
   - Minimum de 3 matchs requis pour les statistiques de paires et positions
   - Minimum de 5 matchs pour "le_dessert"
   - Minimum de 10 matchs pour "le_fidele" et "le_casanova"
   - Minimum de 3 matchs pour "first_blood"
   - Minimum de 2 matchs pour "le_revenger"
   - Minimum de 3 matchs entre les mêmes équipes pour "les_classicos"

3. **Gestion des joueurs inactifs**
   - Les joueurs désactivés (disable = true) sont exclus des statistiques d'activité
   - Les joueurs sans match sont inclus dans les statistiques "least_active"

## Détail des statistiques

### Statistiques des paires (`best_pair` et `worst_pair`)
- **Meilleure paire (`best_pair`)**
  - Calculée sur les paires ayant joué au moins 3 matchs ensemble
  - Utilise un taux de victoire bayésien : (victoires + 1) / (total_matches + 2)
  - Classement basé sur le taux de victoire bayésien, puis sur le nombre total de matchs
  - Inclut les identifiants et pseudos des deux joueurs
  - Fournit le nombre de victoires et le nombre total de matchs

- **Pire paire (`worst_pair`)**
  - Mêmes critères que la meilleure paire
  - Classement basé sur le taux de défaite bayésien : (défaites + 1) / (total_matches + 2)
  - Inclut également le taux de défaite pour analyse

### Statistiques des matchs parfaits
- **Victoires parfaites (`perfect_wins`)**
  - Compte les matchs gagnés 10-0
  - Identifie le joueur avec le plus de victoires parfaites
  - Aucun minimum de matchs requis

- **Défaites parfaites (`perfect_losses`)**
  - Compte les matchs perdus 0-10
  - Identifie le joueur avec le plus de défaites parfaites
  - Aucun minimum de matchs requis

### Statistiques des matchs serrés
- **Victoires serrées (`close_wins`)**
  - Compte les matchs gagnés 10-9
  - Identifie le joueur avec le plus de victoires serrées
  - Aucun minimum de matchs requis

- **Défaites serrées (`close_losses`)**
  - Compte les matchs perdus 9-10
  - Identifie le joueur avec le plus de défaites serrées
  - Aucun minimum de matchs requis

### Statistiques des séries (`streaks`)
- **Plus longue série de victoires (`longest_win_streak`)**
  - Calcule la plus longue séquence consécutive de victoires
  - Prend en compte l'ordre chronologique des matchs
  - Aucun minimum de matchs requis

- **Plus longue série de défaites (`longest_lose_streak`)**
  - Calcule la plus longue séquence consécutive de défaites
  - Prend en compte l'ordre chronologique des matchs
  - Aucun minimum de matchs requis

### Statistiques par position (`positions`)
- **Meilleur attaquant (`best_attacker`)**
  - Minimum de 3 matchs en position d'attaquant
  - Utilise un taux de victoire bayésien
  - Classement basé sur le taux de victoire puis le nombre de matchs

- **Pire attaquant (`worst_attacker`)**
  - Minimum de 3 matchs en position d'attaquant
  - Classement basé sur le taux de défaite bayésien
  - Inclut les victoires, défaites et taux

- **Meilleur défenseur (`best_defender`)**
  - Minimum de 3 matchs en position de défenseur
  - Utilise un taux de victoire bayésien
  - Mêmes critères que pour l'attaquant

- **Pire défenseur (`worst_defender`)**
  - Minimum de 3 matchs en position de défenseur
  - Mêmes critères que pour le pire attaquant

### Statistiques d'activité (`activity`)
- **Joueur le plus actif (`most_active`)**
  - Compte le nombre total de matchs joués
  - Exclut les joueurs désactivés
  - Aucun minimum de matchs requis

- **Joueur le moins actif (`least_active`)**
  - Compte le nombre total de matchs joués
  - Inclut les joueurs sans match
  - Exclut les joueurs désactivés

### Statistiques amusantes (`fun_stats`)
- **Le Dessert (`le_dessert`)**
  - Meilleur joueur entre 12h et 14h30
  - Minimum de 5 matchs sur cette période
  - Utilise un taux de victoire bayésien
  - Prend en compte uniquement les matchs joués pendant la pause déjeuner
  

- **Le Fidèle (`le_fidele`)**
  - Joueur avec le plus haut taux de fidélité à un partenaire
  - Minimum de 10 matchs au total
  - Calcule :
    - Nombre maximum de matchs avec un même partenaire
    - Nombre total de partenaires différents
    - Taux de fidélité = matchs avec partenaire favori / total des matchs

- **Le Casanova (`le_casanova`)**
  - Joueur changeant le plus souvent de partenaire
  - Minimum de 10 matchs au total
  - Calcule :
    - Nombre de partenaires uniques
    - Taux de changement = partenaires uniques / matchs totaux
    - Plus le taux est élevé, plus le joueur change souvent de partenaire

- **First Blood (`first_blood`)**
  - Meilleur joueur lors du premier match du lundi
  - Minimum de 3 premiers matchs
  - Utilise un taux de victoire bayésien
  - Ne compte que les tout premiers matchs de chaque semaine

- **Le Revenger (`le_revenger`)**
  - Meilleur taux de revanche réussie
  - Minimum de 2 matchs de revanche
  - Calcule :
    - Nombre total de matchs de revanche
    - Taux de revanche = victoires en revanche / opportunités de revanche
  - Une revanche est considérée quand :
    - Même composition d'équipes
    - Match joué après une défaite
    - Victoire dans le match de revanche

- **Les Classicos (`les_classicos`)**
  - Affrontement le plus fréquent entre deux équipes fixes
  - Minimum de 3 matchs entre les mêmes équipes
  - Calcule :
    - Nombre total de confrontations
    - Victoires de chaque équipe
    - Identifie les joueurs de chaque équipe
  - Les équipes doivent être exactement les mêmes (mêmes joueurs, même composition)

## Performance

### Optimisations implémentées

1. **Filtrage efficace**
   - Filtrage précoce des matchs dans la CTE `match_data`
   - Réutilisation des résultats filtrés dans toutes les statistiques

2. **Calculs optimisés**
   - Utilisation de CTEs pour éviter les calculs redondants
   - Calculs en une seule passe pour les statistiques liées
   - Utilisation de window functions pour les séries et les classements

3. **Gestion de la mémoire**
   - Limitation du nombre de lignes dans les résultats agrégés
   - Utilisation de LIMIT 1 pour les statistiques uniques

### Considérations pour les grands volumes

Pour les bases de données avec un grand nombre de matchs (>10 000), les points suivants sont à considérer :

1. **Calcul des séries**
   - Utilisation intensive de window functions
   - Peut nécessiter une optimisation pour les grands volumes

2. **Calcul des revanches**
   - Nécessite une auto-jointure de la table matches
   - Performance impactée par le volume de données

3. **Recommandations**
   - Ajouter un index sur `created_at` pour le filtrage temporel
   - Envisager une mise en cache pour les périodes fréquemment consultées
   - Partitionner la table matches par mois pour améliorer les performances de filtrage

## Tests

### Tests de base

```sql
-- Test sans filtre
SELECT get_global_stats(NULL);

-- Test avec filtre mensuel
SELECT get_global_stats('2024-04-01');

-- Test avec plage de dates
SELECT get_global_stats(NULL, '2024-04-01', '2024-04-30');
```

### Tests des statistiques individuelles

```sql
-- Test des statistiques de paires
SELECT jsonb_path_query(get_global_stats(), '$.best_pair');
SELECT jsonb_path_query(get_global_stats(), '$.worst_pair');

-- Test des statistiques de position
SELECT jsonb_path_query(get_global_stats(), '$.positions');

-- Test des statistiques d'activité
SELECT jsonb_path_query(get_global_stats(), '$.activity');

-- Test des statistiques amusantes
SELECT jsonb_path_query(get_global_stats(), '$.fun_stats');

-- Test des statistiques de séries
SELECT jsonb_path_query(get_global_stats(), '$.streaks');

-- Test des statistiques de matchs parfaits
SELECT jsonb_path_query(get_global_stats(), '$.perfect_wins');
SELECT jsonb_path_query(get_global_stats(), '$.perfect_losses');
```

### Validation des données

```sql
-- Vérification des seuils minimums
SELECT COUNT(*) as match_count,
       COUNT(DISTINCT LEAST(white_attacker, white_defender)) as unique_pairs,
       COUNT(DISTINCT white_attacker) as unique_players
FROM matches;

-- Vérification des calculs bayésiens
SELECT 
    (victories::FLOAT + 1) / (total_matches + 2) as bayesian_rate,
    victories::FLOAT / total_matches as raw_rate
FROM (
    SELECT COUNT(*) as total_matches,
           SUM(CASE WHEN white_won THEN 1 ELSE 0 END) as victories
    FROM matches
    GROUP BY white_attacker, white_defender
) stats;
```

## Utilisation

### Dans le frontend

```typescript
// Exemple d'appel avec filtrage par mois
const { data: statsData } = await supabase
  .rpc('get_global_stats', { 
    p_date: '2024-04-01' 
  });

// Exemple d'appel avec plage de dates
const { data: statsData } = await supabase
  .rpc('get_global_stats', { 
    p_date_start: '2024-04-01',
    p_date_end: '2024-04-30'
  });

// Utilisation des statistiques
const bestPair = statsData?.best_pair;
const positions = statsData?.positions;
const funStats = statsData?.fun_stats;
const streaks = statsData?.streaks;
const perfectWins = statsData?.perfect_wins;

// Exemple d'affichage
return (
  <div>
    {bestPair && (
      <BestPairCard
        player1={bestPair.player1_pseudo}
        player2={bestPair.player2_pseudo}
        winRate={bestPair.win_rate}
        victories={bestPair.victories}
        totalMatches={bestPair.total_matches}
      />
    )}
    
    {funStats?.le_dessert && (
      <LeDessertCard
        player={funStats.le_dessert.pseudo}
        winRate={funStats.le_dessert.win_rate}
        victories={funStats.le_dessert.victories}
        totalMatches={funStats.le_dessert.total_matches}
      />
    )}
    
    {streaks?.longest_win_streak && (
      <StreakCard
        player={streaks.longest_win_streak.pseudo}
        streak={streaks.longest_win_streak.streak}
        type="win"
      />
    )}
  </div>
);
```

## Maintenance

### Points d'attention

1. **Gestion des NULL**
   - Toutes les statistiques peuvent retourner NULL si les critères minimums ne sont pas atteints
   - Le frontend doit gérer ces cas correctement

2. **Performance**
   - Surveiller les temps d'exécution sur grands volumes
   - Optimiser les index si nécessaire
   - Considérer la mise en cache des résultats fréquents

3. **Évolution**
   - Structure JSON extensible pour ajout de nouvelles statistiques
   - Possibilité d'ajouter de nouveaux paramètres de filtrage
   - Maintenir la compatibilité avec les versions précédentes

### Suggestions d'amélioration

1. **Nouvelles statistiques**
   - Tendances d'amélioration/détérioration
   - Statistiques par période de la journée
   - Statistiques par jour de la semaine

2. **Optimisations**
   - Mise en cache des résultats fréquents
   - Précalcul de certaines statistiques

3. **Fonctionnalités**
   - Paramètres de personnalisation des seuils
   - Filtrage par joueur ou équipe spécifique

## Plan de migration

### Points d'attention

1. **Compatibilité**
   - Assurer la compatibilité avec les versions précédentes
   - Gérer les changements de structure JSON

2. **Mise à jour**
   - Mettre à jour les scripts de migration
   - Valider les tests de compatibilité

3. **Documentation**
   - Mettre à jour la documentation
   - Informer les utilisateurs des changements

### Gestion des égalités

La fonction gère maintenant les égalités dans toutes les statistiques. Au lieu de retourner un seul joueur ou une seule paire quand il y a égalité sur le critère principal (taux de victoire, nombre de matchs, etc.), la fonction retourne un tableau contenant tous les joueurs ou paires partageant la même valeur.

Par exemple :
- Si deux joueurs ont le même nombre de victoires parfaites (10-0), ils apparaîtront tous les deux dans le tableau `perfect_wins`
- Si plusieurs paires ont le même taux de victoire bayésien, elles seront toutes incluses dans le tableau `best_pair`
- Si plusieurs joueurs partagent le même taux de fidélité maximal, ils seront tous listés dans le tableau `le_fidele`

Cette modification permet une représentation plus juste des performances, en particulier dans les cas où plusieurs joueurs excellent dans une catégorie particulière.