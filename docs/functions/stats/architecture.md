# Architecture des Fonctions Statistiques

## Principes de Conception

L'architecture est basée sur trois principes fondamentaux :
1. **Séparation par complexité de calcul**
2. **Optimisation des ressources**
3. **Flexibilité du chargement**

## Structure des Fonctions

### 1. get_base_match_stats()

Fonction optimisée pour les statistiques calculables en une seule passe sur la table matches.

#### Statistiques incluses :
- Nombre total de matchs par joueur
- Victoires/défaites simples
- Perfect wins/losses (10-0, 0-10)
- Close wins/losses (10-9, 9-10)
- Statistiques d'activité

#### Optimisations :
```sql
-- Utilisation de CTE matérialisées pour les calculs de base
WITH MATERIALIZED base_stats AS (
  SELECT 
    player_id,
    COUNT(*) as total_matches,
    SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) as victories
  FROM match_players
  GROUP BY player_id
)
```

### 2. get_complex_stats()

Fonction pour les statistiques nécessitant des window functions et des calculs avancés.

#### Statistiques incluses :
- Séries de victoires/défaites
- Statistiques par position
- Meilleures/pires paires

#### Optimisations :
```sql
-- Utilisation de tables temporaires pour les calculs intermédiaires
CREATE TEMPORARY TABLE temp_streaks AS
SELECT 
  player_id,
  COUNT(*) as streak_length,
  is_victory
FROM (
  SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY player_id, is_victory ORDER BY created_at) as streak_id
  FROM match_results
) grouped
GROUP BY player_id, is_victory, streak_id;
```

### 3. get_historical_stats()

Fonction pour les statistiques nécessitant des analyses temporelles.

#### Statistiques incluses :
- First Blood (premiers matchs du lundi)
- Le Dessert (matchs pause déjeuner)
- Les Classicos (rivalités d'équipes)

#### Optimisations :
```sql
-- Partitionnement temporel pour les analyses historiques
CREATE TABLE matches_partitioned (
  LIKE matches INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Création des partitions
CREATE TABLE matches_2024_q1 PARTITION OF matches_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

## Stratégie de Performance

### 1. Indexation Ciblée

Chaque fonction utilise des index spécifiques :

```sql
-- Index pour get_base_match_stats
CREATE INDEX idx_matches_basic ON matches (
  created_at,
  score_white,
  score_black
);

-- Index pour get_complex_stats
CREATE INDEX idx_matches_streaks ON matches (
  player_id,
  created_at,
  white_won
);

-- Index pour get_historical_stats
CREATE INDEX idx_matches_temporal ON matches (
  date_trunc('week', created_at),
  created_at
);
```

### 2. Mise en Cache

Stratégie de cache différenciée par fonction :

```typescript
const cacheConfig = {
  baseStats: {
    ttl: 3600,    // 1 heure
    staleTime: 300 // 5 minutes
  },
  complexStats: {
    ttl: 1800,    // 30 minutes
    staleTime: 150 // 2.5 minutes
  },
  historicalStats: {
    ttl: 86400,   // 24 heures
    staleTime: 3600 // 1 heure
  }
};
```

### 3. Chargement Progressif

Implémentation du chargement progressif :

```typescript
// hooks/useStats.ts
export const useStats = () => {
  // Stats de base chargées immédiatement
  const baseStats = useSWR('base-stats', fetchBaseStats);
  
  // Stats complexes chargées après le premier rendu
  const complexStats = useSWR(
    'complex-stats',
    () => new Promise(resolve => {
      requestIdleCallback(() => fetchComplexStats().then(resolve));
    })
  );
  
  // Stats historiques chargées à la demande
  const [loadHistorical, setLoadHistorical] = useState(false);
  const historicalStats = useSWR(
    loadHistorical ? 'historical-stats' : null,
    fetchHistoricalStats
  );

  return {
    baseStats: baseStats.data,
    complexStats: complexStats.data,
    historicalStats: historicalStats.data,
    loadHistorical: () => setLoadHistorical(true)
  };
};
```

## Monitoring et Maintenance

### 1. Métriques de Performance

```sql
-- Vue pour le monitoring des performances
CREATE VIEW stats_performance_metrics AS
SELECT 
  function_name,
  AVG(execution_time) as avg_execution_time,
  MAX(execution_time) as max_execution_time,
  COUNT(*) as call_count,
  date_trunc('hour', called_at) as time_bucket
FROM function_calls
WHERE function_name LIKE 'get_%_stats'
GROUP BY function_name, time_bucket;
```

### 2. Maintenance Automatisée

```sql
-- Procédure de maintenance quotidienne
CREATE OR REPLACE PROCEDURE maintain_stats_performance()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mise à jour des statistiques des tables
  ANALYZE matches;
  ANALYZE matches_partitioned;
  
  -- Nettoyage des tables temporaires
  TRUNCATE TABLE temp_streaks;
  
  -- Rotation des partitions si nécessaire
  CALL rotate_historical_partitions();
END;
$$;
```

## Évolutivité

L'architecture est conçue pour faciliter l'ajout de nouvelles statistiques :

1. Identifier la catégorie appropriée (base, complex, historical)
2. Ajouter les calculs nécessaires dans la fonction correspondante
3. Mettre à jour les index si nécessaire
4. Ajuster la stratégie de cache si besoin

## Considérations de Sécurité

- Utilisation de RLS (Row Level Security) pour filtrer les données
- Validation des paramètres d'entrée
- Protection contre les injections SQL
- Limitation des ressources par fonction 