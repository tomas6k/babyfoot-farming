# Optimisation des Performances

## Vue d'ensemble

Ce document détaille les stratégies d'optimisation des performances pour les fonctions statistiques, couvrant l'optimisation des requêtes SQL, l'indexation, et les stratégies de mise en cache.

## Optimisation des Requêtes SQL

### 1. Utilisation des CTE (Common Table Expressions)

```sql
-- Exemple d'optimisation avec CTE
WITH match_results AS (
  SELECT 
    m.id,
    m.score_blue,
    m.score_red,
    m.created_at,
    CASE 
      WHEN m.score_blue > m.score_red THEN 'blue'
      ELSE 'red'
    END as winner
  FROM matches m
  WHERE m.created_at >= $1
    AND m.created_at <= $2
),
player_stats AS (
  SELECT 
    p.id,
    p.pseudo,
    COUNT(*) as total_matches,
    SUM(CASE WHEN mr.winner = p.team THEN 1 ELSE 0 END) as wins
  FROM players p
  JOIN match_results mr ON p.match_id = mr.id
  GROUP BY p.id, p.pseudo
)
SELECT 
  ps.pseudo,
  ps.total_matches,
  ROUND(ps.wins::numeric / ps.total_matches * 100, 2) as win_rate
FROM player_stats ps
WHERE ps.total_matches >= 5
ORDER BY win_rate DESC;
```

### 2. Optimisation des Jointures

```sql
-- Utilisation de LATERAL JOIN pour de meilleures performances
SELECT 
  p.pseudo,
  stats.*
FROM players p
CROSS JOIN LATERAL (
  SELECT 
    COUNT(*) as matches_played,
    SUM(CASE WHEN m.score_blue > m.score_red THEN 1 ELSE 0 END) as wins
  FROM matches m
  WHERE m.blue_attacker_id = p.id 
    OR m.blue_defender_id = p.id
    OR m.red_attacker_id = p.id
    OR m.red_defender_id = p.id
) stats
WHERE stats.matches_played > 0;
```

## Indexation

### 1. Index Stratégiques

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_matches_created_at 
ON matches (created_at);

CREATE INDEX idx_matches_scores 
ON matches (score_blue, score_red);

CREATE INDEX idx_player_matches 
ON matches (
  blue_attacker_id, 
  blue_defender_id, 
  red_attacker_id, 
  red_defender_id
);

-- Index partiels pour les conditions spécifiques
CREATE INDEX idx_high_score_matches 
ON matches (created_at) 
WHERE score_blue >= 8 OR score_red >= 8;
```

### 2. Index Composites

```sql
-- Index composite pour les statistiques de position
CREATE INDEX idx_position_stats 
ON matches (
  blue_attacker_id, 
  created_at, 
  score_blue, 
  score_red
);

-- Index pour les séries de victoires
CREATE INDEX idx_winning_streaks 
ON matches (
  winner_id, 
  created_at
);
```

## Partitionnement

```sql
-- Partitionnement par plage de dates
CREATE TABLE matches (
  id SERIAL,
  created_at TIMESTAMP,
  score_blue INTEGER,
  score_red INTEGER
) PARTITION BY RANGE (created_at);

-- Création des partitions
CREATE TABLE matches_2024_q1 PARTITION OF matches
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE matches_2024_q2 PARTITION OF matches
FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
```

## Optimisation des Vues Matérialisées

```sql
-- Vue matérialisée pour les statistiques de base
CREATE MATERIALIZED VIEW mv_basic_stats AS
SELECT 
  p.id,
  p.pseudo,
  COUNT(*) as total_matches,
  SUM(CASE WHEN m.winner_id = p.id THEN 1 ELSE 0 END) as wins
FROM players p
JOIN matches m ON p.id IN (
  m.blue_attacker_id, 
  m.blue_defender_id, 
  m.red_attacker_id, 
  m.red_defender_id
)
GROUP BY p.id, p.pseudo
WITH DATA;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX idx_mv_basic_stats_id ON mv_basic_stats (id);
```

## Optimisation des Fonctions

### 1. Fonctions Parallélisées

```sql
-- Fonction parallélisée pour le calcul des statistiques
CREATE OR REPLACE FUNCTION calculate_parallel_stats(
  start_date timestamp,
  end_date timestamp
) RETURNS TABLE (
  pseudo text,
  matches integer,
  win_rate numeric
) PARALLEL SAFE AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.pseudo,
    COUNT(*) as matches,
    ROUND(AVG(CASE WHEN m.winner_id = p.id THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate
  FROM players p
  JOIN matches m ON p.id IN (
    m.blue_attacker_id, 
    m.blue_defender_id, 
    m.red_attacker_id, 
    m.red_defender_id
  )
  WHERE m.created_at BETWEEN start_date AND end_date
  GROUP BY p.id, p.pseudo;
END;
$$ LANGUAGE plpgsql;
```

### 2. Optimisation des Agrégations

```sql
-- Utilisation d'agrégations optimisées
CREATE OR REPLACE FUNCTION get_player_stats(
  player_id integer
) RETURNS jsonb AS $$
WITH stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE m.winner_id = player_id) as wins,
    COUNT(*) FILTER (WHERE m.winner_id != player_id) as losses,
    AVG(CASE 
      WHEN player_id IN (m.blue_attacker_id, m.blue_defender_id) 
      THEN m.score_blue 
      ELSE m.score_red 
    END) as avg_score
  FROM matches m
  WHERE player_id IN (
    m.blue_attacker_id, 
    m.blue_defender_id, 
    m.red_attacker_id, 
    m.red_defender_id
  )
)
SELECT jsonb_build_object(
  'wins', wins,
  'losses', losses,
  'win_rate', ROUND((wins::numeric / NULLIF(wins + losses, 0)) * 100, 2),
  'avg_score', ROUND(avg_score::numeric, 2)
)
FROM stats;
$$ LANGUAGE sql;
```

## Monitoring des Performances

### 1. Analyse des Plans d'Exécution

```sql
-- Vue pour le monitoring des requêtes lentes
CREATE VIEW slow_stats_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%matches%'
  AND mean_time > 1000  -- plus d'1 seconde
ORDER BY total_time DESC;
```

### 2. Métriques de Performance

```sql
-- Fonction pour collecter les métriques
CREATE OR REPLACE FUNCTION collect_performance_metrics()
RETURNS TABLE (
  metric_name text,
  metric_value numeric,
  collected_at timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'index_usage' as metric_name,
    (SELECT ROUND(100.0 * idx_scan / (idx_scan + seq_scan), 2)
     FROM pg_stat_user_tables 
     WHERE schemaname = 'public' 
       AND relname = 'matches') as metric_value,
    NOW() as collected_at
  UNION ALL
  SELECT 
    'cache_hit_ratio',
    (SELECT ROUND(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
     FROM pg_statio_user_tables
     WHERE schemaname = 'public' 
       AND relname = 'matches'),
    NOW();
END;
$$ LANGUAGE plpgsql;
```

## Optimisation du Cache

### 1. Configuration du Cache PostgreSQL

```sql
-- Paramètres recommandés pour le cache
ALTER SYSTEM SET 
  shared_buffers = '1GB',
  effective_cache_size = '3GB',
  work_mem = '16MB',
  maintenance_work_mem = '256MB';
```

### 2. Gestion du Cache Applicatif

```typescript
// services/cache-manager.ts
export class StatsCache {
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly maxSize = 1000;
  
  async get(key: string): Promise<StatsData | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  async set(key: string, data: StatsData, ttl: number): Promise<void> {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      lastAccess: Date.now()
    });
  }
  
  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldest = key;
        oldestTime = entry.lastAccess;
      }
    }
    
    if (oldest) {
      this.cache.delete(oldest);
    }
  }
}
``` 