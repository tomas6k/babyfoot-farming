# Stratégie de Mise en Cache des Statistiques

## Vue d'ensemble

La stratégie de mise en cache est conçue pour optimiser les performances tout en maintenant la fraîcheur des données. Elle utilise une approche multi-niveaux avec des durées de cache différenciées selon le type de statistiques.

## Niveaux de Cache

### 1. Cache de Premier Niveau (Mémoire du Navigateur)

```typescript
// hooks/useStatsCache.ts
const CACHE_KEYS = {
  BASE: 'stats:base',
  COMPLEX: 'stats:complex',
  HISTORICAL: 'stats:historical'
} as const;

const CACHE_CONFIG = {
  [CACHE_KEYS.BASE]: {
    ttl: 5 * 60 * 1000,         // 5 minutes
    staleTime: 1 * 60 * 1000    // 1 minute
  },
  [CACHE_KEYS.COMPLEX]: {
    ttl: 15 * 60 * 1000,        // 15 minutes
    staleTime: 5 * 60 * 1000    // 5 minutes
  },
  [CACHE_KEYS.HISTORICAL]: {
    ttl: 60 * 60 * 1000,        // 1 heure
    staleTime: 30 * 60 * 1000   // 30 minutes
  }
} as const;
```

### 2. Cache de Second Niveau (Redis)

```typescript
// lib/redis-cache.ts
const REDIS_CONFIG = {
  baseStats: {
    prefix: 'stats:base',
    ttl: 3600,          // 1 heure
    maxItems: 1000
  },
  complexStats: {
    prefix: 'stats:complex',
    ttl: 7200,          // 2 heures
    maxItems: 500
  },
  historicalStats: {
    prefix: 'stats:historical',
    ttl: 86400,         // 24 heures
    maxItems: 100
  }
} as const;
```

### 3. Cache de Base de Données (Materialized Views)

```sql
-- Vues matérialisées pour les statistiques de base
CREATE MATERIALIZED VIEW mv_base_stats AS
SELECT /* calculs de base */
WITH DATA;

-- Vues matérialisées pour les statistiques complexes
CREATE MATERIALIZED VIEW mv_complex_stats AS
SELECT /* calculs complexes */
WITH DATA;

-- Vues matérialisées pour les statistiques historiques
CREATE MATERIALIZED VIEW mv_historical_stats AS
SELECT /* calculs historiques */
WITH DATA;
```

## Stratégies de Rafraîchissement

### 1. Rafraîchissement Automatique

```typescript
// services/cache-refresh.ts
export class StatsRefreshService {
  private readonly refreshSchedule = {
    baseStats: '*/5 * * * *',      // Toutes les 5 minutes
    complexStats: '*/15 * * * *',   // Toutes les 15 minutes
    historicalStats: '0 * * * *'    // Toutes les heures
  };

  async refreshCache(type: StatsType) {
    try {
      // Invalider le cache actuel
      await this.invalidateCache(type);
      
      // Recalculer les statistiques
      const newStats = await this.recalculateStats(type);
      
      // Mettre à jour le cache
      await this.updateCache(type, newStats);
      
      // Notifier les clients connectés
      await this.notifyClients(type);
    } catch (error) {
      console.error(`Erreur lors du rafraîchissement du cache ${type}:`, error);
    }
  }
}
```

### 2. Invalidation Conditionnelle

```typescript
// services/cache-invalidation.ts
export class StatsInvalidationService {
  private readonly invalidationRules = {
    baseStats: {
      conditions: [
        'new_match_created',
        'match_deleted'
      ],
      threshold: 5  // Invalider après 5 changements
    },
    complexStats: {
      conditions: [
        'streak_broken',
        'position_changed'
      ],
      threshold: 3
    },
    historicalStats: {
      conditions: [
        'week_changed',
        'month_changed'
      ],
      threshold: 1
    }
  };

  async shouldInvalidateCache(type: StatsType, event: CacheEvent): Promise<boolean> {
    const rules = this.invalidationRules[type];
    if (!rules) return false;

    const changeCount = await this.getChangeCount(type);
    return changeCount >= rules.threshold;
  }
}
```

## Gestion des Erreurs et Fallbacks

```typescript
// services/error-handling.ts
export class StatsCacheErrorHandler {
  async handleCacheError(type: StatsType, error: Error): Promise<StatsData> {
    // Logger l'erreur
    console.error(`Erreur de cache pour ${type}:`, error);

    try {
      // Tenter de récupérer depuis le cache de secours
      const fallbackData = await this.getFallbackData(type);
      if (fallbackData) return fallbackData;

      // Si pas de données de secours, recalculer
      return await this.forceRecalculate(type);
    } catch (fallbackError) {
      // En dernier recours, retourner des données vides
      return this.getEmptyStats(type);
    }
  }
}
```

## Monitoring et Métriques

```typescript
// services/cache-monitoring.ts
export class StatsCacheMonitor {
  private metrics = {
    hitRate: new Map<StatsType, number>(),
    avgLoadTime: new Map<StatsType, number>(),
    errorRate: new Map<StatsType, number>(),
    staleRate: new Map<StatsType, number>()
  };

  async collectMetrics(): Promise<CacheMetrics> {
    return {
      hitRate: this.calculateHitRate(),
      avgLoadTime: this.calculateAvgLoadTime(),
      errorRate: this.calculateErrorRate(),
      staleRate: this.calculateStaleRate(),
      cacheSize: await this.getCacheSize()
    };
  }
}
```

## Optimisations Avancées

### 1. Préchargement Intelligent

```typescript
// services/cache-preloading.ts
export class StatsCachePreloader {
  async preloadCache(): Promise<void> {
    // Précharger les statistiques de base pendant les heures creuses
    if (this.isOffPeakHour()) {
      await this.preloadBaseStats();
    }

    // Précharger les statistiques complexes si nécessaire
    if (this.shouldPreloadComplex()) {
      await this.preloadComplexStats();
    }
  }
}
```

### 2. Compression des Données

```typescript
// utils/cache-compression.ts
export const compressStats = (stats: StatsData): CompressedStats => {
  return {
    // Compression des données numériques
    n: stats.numbers.map(n => Math.round(n * 100) / 100),
    // Compression des chaînes
    s: stats.strings.map(s => s.substring(0, 50)),
    // Compression des dates
    d: stats.dates.map(d => d.getTime())
  };
};
```

## Maintenance et Nettoyage

```sql
-- Procédure de nettoyage du cache
CREATE OR REPLACE PROCEDURE cleanup_stats_cache()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Nettoyer les vues matérialisées obsolètes
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_base_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_complex_stats;
  
  -- Supprimer les entrées de cache expirées
  DELETE FROM cache_entries 
  WHERE expires_at < NOW();
  
  -- Optimiser les tables de cache
  VACUUM ANALYZE cache_entries;
END;
$$; 