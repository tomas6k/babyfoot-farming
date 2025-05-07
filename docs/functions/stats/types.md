# Types et Interfaces

## Vue d'ensemble

Ce document détaille les types et interfaces TypeScript utilisés dans le système de statistiques, assurant une typage fort et une meilleure maintenabilité du code.

## Types de Base

### 1. Structures de Match

```typescript
// types/match.ts
export interface Match {
  id: number;
  score_blue: number;
  score_red: number;
  blue_attacker_id: number;
  blue_defender_id: number;
  red_attacker_id: number;
  red_defender_id: number;
  created_at: Date;
}

export interface MatchResult {
  winner: 'blue' | 'red';
  score_difference: number;
  is_perfect: boolean;
  duration_seconds: number;
}

export interface MatchWithPlayers extends Match {
  blue_attacker: Player;
  blue_defender: Player;
  red_attacker: Player;
  red_defender: Player;
}
```

### 2. Structures de Joueur

```typescript
// types/player.ts
export interface Player {
  id: number;
  pseudo: string;
  created_at: Date;
  last_match_at: Date | null;
}

export interface PlayerStats {
  player_id: number;
  pseudo: string;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  perfect_wins: number;
  perfect_losses: number;
  avg_score_for: number;
  avg_score_against: number;
}

export interface PlayerPosition {
  attack_matches: number;
  attack_wins: number;
  attack_win_rate: number;
  defense_matches: number;
  defense_wins: number;
  defense_win_rate: number;
}
```

## Types de Statistiques

### 1. Statistiques Globales

```typescript
// types/stats.ts
export interface GlobalStats {
  streaks: {
    longest_win: WinningStreak[];
    longest_lose: LosingStreak[];
  };
  activity: {
    most_active: PlayerActivity[];
    least_active: PlayerActivity[];
  };
  positions: {
    best_attacker: PlayerPosition[];
    worst_attacker: PlayerPosition[];
    best_defender: PlayerPosition[];
    worst_defender: PlayerPosition[];
  };
  pairs: {
    best_pair: TeamPair[];
    worst_pair: TeamPair[];
  };
  fun_stats: {
    first_blood: FirstBlood | null;
    les_classicos: Classicos | null;
    le_fidele: Fidele | null;
    le_dessert: Dessert | null;
  };
}

export interface WinningStreak {
  player_id: number;
  pseudo: string;
  streak_length: number;
  start_date: Date;
  end_date: Date;
}

export interface LosingStreak extends WinningStreak {}

export interface PlayerActivity {
  player_id: number;
  pseudo: string;
  match_count: number;
  last_match_at: Date;
}
```

### 2. Statistiques d'Équipe

```typescript
// types/team.ts
export interface TeamPair {
  attacker_id: number;
  attacker_pseudo: string;
  defender_id: number;
  defender_pseudo: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_score_for: number;
  avg_score_against: number;
}

export interface TeamStats {
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  perfect_wins: number;
  perfect_losses: number;
  avg_score_for: number;
  avg_score_against: number;
  longest_win_streak: number;
  longest_lose_streak: number;
}
```

## Types de Statistiques Spéciales

### 1. Statistiques Fun

```typescript
// types/fun-stats.ts
export interface FirstBlood {
  player_id: number;
  pseudo: string;
  match_count: number;
  win_rate: number;
}

export interface Classicos {
  team1: {
    attacker_id: number;
    attacker_pseudo: string;
    defender_id: number;
    defender_pseudo: string;
    victories: number;
  };
  team2: {
    attacker_id: number;
    attacker_pseudo: string;
    defender_id: number;
    defender_pseudo: string;
    victories: number;
  };
  total_matches: number;
}

export interface Fidele {
  player_id: number;
  pseudo: string;
  consecutive_days: number;
  start_date: Date;
  end_date: Date;
}

export interface Dessert {
  player_id: number;
  pseudo: string;
  late_matches: number;
  avg_time: string;
}
```

## Types Utilitaires

### 1. Filtres et Options

```typescript
// types/filters.ts
export interface StatsFilter {
  start_date?: Date;
  end_date?: Date;
  player_id?: number;
  min_matches?: number;
  include_positions?: boolean;
  include_pairs?: boolean;
  include_fun_stats?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}
```

### 2. Types de Cache

```typescript
// types/cache.ts
export interface CacheEntry<T> {
  data: T;
  expires: number;
  lastAccess: number;
}

export interface CacheConfig {
  ttl: number;
  staleTime: number;
  maxSize: number;
}

export type CacheKey = string;

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  size: number;
  avgLoadTime: number;
}
```

### 3. Types d'Erreur

```typescript
// types/errors.ts
export interface ValidationError extends Error {
  type: 'validation';
  field: string;
  value: any;
  constraint: string;
}

export interface CalculationError extends Error {
  type: 'calculation';
  operation: string;
  input: any;
}

export interface StatsError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export type ErrorType = 
  | 'validation'
  | 'calculation'
  | 'permission'
  | 'database'
  | 'cache'
  | 'unknown';

export interface ErrorContext {
  userId: string;
  action: string;
  input?: any;
  timestamp: Date;
}
```

### 4. Types de Monitoring

```typescript
// types/monitoring.ts
export interface PerformanceMetrics {
  queryTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface AnomalyReport {
  hasAnomalies: boolean;
  anomalies: Anomaly[];
  timestamp: Date;
}

export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
  context?: any;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    cache: boolean;
    api: boolean;
  };
  lastCheck: Date;
}
``` 