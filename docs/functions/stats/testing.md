# Tests des Fonctions Statistiques

## Vue d'ensemble

Cette documentation décrit la stratégie de test pour les fonctions statistiques du système. Elle couvre les tests unitaires, d'intégration et de performance.

## Tests Unitaires

### 1. Tests de get_base_match_stats

```sql
-- Test de get_base_match_stats
DO $$
DECLARE
  v_stats jsonb;
BEGIN
  -- 1. Test des Perfect Wins/Losses (pas de seuil minimum)
  TRUNCATE matches;
  
  -- Insérer quelques matchs parfaits
  INSERT INTO matches (
    white_attacker, white_defender,
    black_attacker, black_defender,
    score_white, score_black
  ) VALUES
    ('player1', 'player2', 'player3', 'player4', 10, 0),
    ('player1', 'player2', 'player5', 'player6', 10, 0),
    ('player7', 'player8', 'player1', 'player2', 0, 10);
    
  v_stats := get_base_match_stats();
  
  -- Vérifier que les perfect stats sont présentes même avec peu de matchs
  ASSERT v_stats ? 'perfect_wins' AND v_stats ? 'perfect_losses',
    'Les perfect stats devraient être présentes sans seuil minimum';
    
  -- Vérifier le comptage correct
  ASSERT (
    SELECT count FROM jsonb_array_elements(v_stats->'perfect_wins') s
    WHERE s->>'player_id' = 'player1'
  ) = '2'::jsonb,
    'Player1 devrait avoir 2 perfect wins';
    
  -- 2. Test des Close Wins/Losses (pas de seuil minimum)
  INSERT INTO matches (
    white_attacker, white_defender,
    black_attacker, black_defender,
    score_white, score_black
  ) VALUES
    ('player1', 'player2', 'player3', 'player4', 10, 9),
    ('player3', 'player4', 'player1', 'player2', 10, 9);
    
  v_stats := get_base_match_stats();
  
  ASSERT v_stats ? 'close_wins' AND v_stats ? 'close_losses',
    'Les close stats devraient être présentes sans seuil minimum';
    
  -- 3. Test des stats d'activité (seuil de 25 matchs)
  -- D'abord vérifier qu'elles sont absentes avec peu de matchs
  ASSERT NOT (v_stats ? 'most_active') AND NOT (v_stats ? 'least_active'),
    'Les stats d''activité ne devraient pas être présentes avec moins de 25 matchs';
    
  -- Ajouter plus de matchs pour atteindre le seuil
  INSERT INTO matches (
    white_attacker, white_defender,
    black_attacker, black_defender,
    score_white, score_black
  )
  SELECT
    'player1', 'player2',
    'player3', 'player4',
    CASE WHEN random() > 0.5 THEN 10 ELSE 5 END,
    CASE WHEN random() > 0.5 THEN 10 ELSE 5 END
  FROM generate_series(1, 22); -- Pour atteindre 25+ matchs
  
  v_stats := get_base_match_stats();
  
  -- Vérifier que les stats d'activité sont maintenant présentes
  ASSERT v_stats ? 'most_active' AND v_stats ? 'least_active',
    'Les stats d''activité devraient être présentes avec plus de 25 matchs';
    
  -- Vérifier les critères d'activité
  ASSERT (
    SELECT bool_and(value->>'match_count' >= '10')
    FROM jsonb_array_elements(v_stats->'most_active')
  ), 'Most active devrait avoir minimum 10 matchs';
  
  ASSERT (
    SELECT bool_and(value->>'match_count' > '0')
    FROM jsonb_array_elements(v_stats->'least_active')
  ), 'Least active ne devrait pas inclure les joueurs sans match';
  
  -- 4. Test des joueurs désactivés
  UPDATE players SET disable = true WHERE id = 'player1';
  
  v_stats := get_base_match_stats();
  
  -- Les joueurs désactivés devraient toujours apparaître dans perfect/close
  ASSERT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_stats->'perfect_wins') s
    WHERE s->>'player_id' = 'player1'
  ), 'Les joueurs désactivés devraient apparaître dans perfect stats';
  
  -- Mais pas dans les stats d'activité
  ASSERT NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_stats->'most_active') s
    WHERE s->>'player_id' = 'player1'
  ), 'Les joueurs désactivés ne devraient pas apparaître dans les stats d''activité';
  
  -- 5. Test du tri en cas d'égalité
  INSERT INTO matches (
    white_attacker, white_defender,
    black_attacker, black_defender,
    score_white, score_black
  ) VALUES
    ('player5', 'player6', 'player7', 'player8', 10, 0),
    ('player5', 'player6', 'player7', 'player8', 10, 0);
    
  v_stats := get_base_match_stats();
  
  -- Vérifier le tri par player_id en cas d'égalité
  ASSERT (
    SELECT array_agg(s->>'player_id' ORDER BY ordinality)
    FROM jsonb_array_elements(v_stats->'perfect_wins') WITH ORDINALITY s
    WHERE s->>'count' = '2'
  ) = ARRAY['player1', 'player5']::text[],
    'En cas d''égalité, devrait trier par player_id';
    
END $$;

-- Test d'intégration avec Supabase
describe('get_base_match_stats', () => {
  beforeAll(async () => {
    await supabase.rpc('truncate_all_tables');
  });
  
  it('devrait retourner perfect/close stats sans seuil', async () => {
    // Créer quelques matchs parfaits/serrés
    await supabase.from('matches').insert([
      {
        white_attacker: 'player1',
        white_defender: 'player2',
        black_attacker: 'player3',
        black_defender: 'player4',
        score_white: 10,
        score_black: 0
      }
    ]);
    
    const { data: stats } = await supabase.rpc('get_base_match_stats');
    
    expect(stats).toHaveProperty('perfect_wins');
    expect(stats).toHaveProperty('perfect_losses');
    expect(stats).toHaveProperty('close_wins');
    expect(stats).toHaveProperty('close_losses');
    expect(stats).not.toHaveProperty('most_active');
    expect(stats).not.toHaveProperty('least_active');
  });
  
  it('devrait inclure les stats d\'activité avec 25+ matchs', async () => {
    // Ajouter plus de matchs
    const matches = Array.from({ length: 24 }, () => ({
      white_attacker: 'player1',
      white_defender: 'player2',
      black_attacker: 'player3',
      black_defender: 'player4',
      score_white: 10,
      score_black: 5
    }));
    
    await supabase.from('matches').insert(matches);
    
    const { data: stats } = await supabase.rpc('get_base_match_stats');
    
    expect(stats).toHaveProperty('most_active');
    expect(stats).toHaveProperty('least_active');
    
    // Vérifier les critères d'activité
    stats.most_active.forEach(player => {
      expect(player.match_count).toBeGreaterThanOrEqual(10);
    });
    
    stats.least_active.forEach(player => {
      expect(player.match_count).toBeGreaterThan(0);
    });
  });
});

### 2. Tests de get_complex_stats

```sql
-- Test des séries
DO $$
DECLARE
  v_stats jsonb;
BEGIN
  -- Préparer une série de victoires
  INSERT INTO matches (
    white_attacker, white_defender,
    black_attacker, black_defender,
    score_white, score_black,
    created_at
  ) VALUES
    /* Série de 4 victoires pour le même joueur */
    ('player1', 'player2', 'player3', 'player4', 10, 5, now() - interval '4 days'),
    ('player1', 'player5', 'player6', 'player7', 10, 7, now() - interval '3 days'),
    ('player1', 'player8', 'player9', 'player10', 10, 8, now() - interval '2 days'),
    ('player1', 'player2', 'player3', 'player4', 10, 6, now() - interval '1 day');
    
  v_stats := get_complex_stats();
  
  -- Vérifier la longueur minimum des séries
  ASSERT (
    SELECT bool_and(value->>'streak_length' >= '3')
    FROM jsonb_array_elements(v_stats->'longest_win_streak')
  ), 'Les séries devraient avoir minimum 3 matchs';
  
  -- Vérifier l'ordre chronologique
  ASSERT (
    SELECT bool_and(
      (value->>'start_date')::timestamp < (value->>'end_date')::timestamp
    )
    FROM jsonb_array_elements(v_stats->'longest_win_streak')
  ), 'Les dates de début devraient être avant les dates de fin';
END $$;

### 3. Tests de get_historical_stats

```sql
-- Test du First Blood
DO $$
DECLARE
  v_stats jsonb;
BEGIN
  -- Préparer des matchs du lundi
  INSERT INTO matches (
    white_attacker, white_defender,
    black_attacker, black_defender,
    score_white, score_black,
    created_at
  ) VALUES
    /* Premier match d'un lundi */
    ('player1', 'player2', 'player3', 'player4', 10, 5, 
     '2024-04-01 09:00:00'::timestamp),
    /* Deuxième match du même lundi - ne devrait pas compter */
    ('player1', 'player2', 'player3', 'player4', 10, 7,
     '2024-04-01 10:00:00'::timestamp),
    /* Premier match d'un autre lundi */
    ('player1', 'player5', 'player6', 'player7', 10, 8,
     '2024-04-08 09:00:00'::timestamp);
     
  v_stats := get_historical_stats();
  
  -- Vérifier le minimum de matchs pour First Blood
  ASSERT (
    SELECT bool_and(value->>'match_count' >= '2')
    FROM jsonb_array_elements(v_stats->'first_blood')
  ), 'First Blood devrait avoir minimum 2 matchs';
  
  -- Vérifier le tri par taux bayésien
  ASSERT (
    SELECT array_agg((value->>'bayesian_win_rate')::float) IS NOT NULL
    FROM jsonb_array_elements(v_stats->'first_blood')
  ), 'First Blood devrait inclure le taux bayésien';
END $$;

-- Test des Classicos
DO $$
DECLARE
  v_stats jsonb;
BEGIN
  -- Préparer des matchs entre équipes fixes
  INSERT INTO matches (
    white_attacker, white_defender,
    black_attacker, black_defender,
    score_white, score_black,
    created_at
  ) VALUES
    /* 5 matchs entre les mêmes équipes */
    ('team1_p1', 'team1_p2', 'team2_p1', 'team2_p2', 10, 5, now() - interval '5 days'),
    ('team1_p1', 'team1_p2', 'team2_p1', 'team2_p2', 7, 10, now() - interval '4 days'),
    ('team1_p1', 'team1_p2', 'team2_p1', 'team2_p2', 10, 8, now() - interval '3 days'),
    ('team1_p2', 'team1_p1', 'team2_p2', 'team2_p1', 10, 6, now() - interval '2 days'),
    ('team1_p1', 'team1_p2', 'team2_p1', 'team2_p2', 8, 10, now() - interval '1 day');
    
  v_stats := get_historical_stats();
  
  -- Vérifier le minimum de matchs pour les Classicos
  ASSERT (
    SELECT bool_and(value->>'total_matches' >= '5')
    FROM jsonb_array_elements(v_stats->'classicos')
  ), 'Les Classicos devraient avoir minimum 5 matchs';
  
  -- Vérifier la limite de 3 rivalités
  ASSERT (
    SELECT jsonb_array_length(v_stats->'classicos') <= 3
  ), 'Maximum 3 rivalités devraient être retournées';
END $$;

## Tests d'Intégration

```typescript
describe('Statistiques', () => {
  beforeAll(async () => {
    // Préparer les données de test
    await setupTestData();
  });

  describe('Base Match Stats', () => {
    it('devrait respecter le seuil global', async () => {
      const { data: stats } = await supabase.rpc('get_base_match_stats');
      
      if (totalMatches < 25) {
        expect(stats).toBeNull();
      } else {
        expect(stats).not.toBeNull();
      }
    });

    it('devrait filtrer correctement l\'activité', async () => {
      const { data: stats } = await supabase.rpc('get_base_match_stats');
      
      if (stats) {
        // Most active
        stats.most_active.forEach(player => {
          expect(player.match_count).toBeGreaterThanOrEqual(10);
        });
        
        // Least active
        stats.least_active.forEach(player => {
          expect(player.match_count).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Complex Stats', () => {
    it('devrait valider les séries', async () => {
      const { data: stats } = await supabase.rpc('get_complex_stats');
      
      if (stats) {
        // Win streaks
        stats.longest_win_streak.forEach(streak => {
          expect(streak.streak_length).toBeGreaterThanOrEqual(3);
          expect(new Date(streak.start_date)).toBeBefore(new Date(streak.end_date));
        });
        
        // Lose streaks
        stats.longest_lose_streak.forEach(streak => {
          expect(streak.streak_length).toBeGreaterThanOrEqual(3);
          expect(new Date(streak.start_date)).toBeBefore(new Date(streak.end_date));
        });
      }
    });
  });

  describe('Historical Stats', () => {
    it('devrait valider First Blood', async () => {
      const { data: stats } = await supabase.rpc('get_historical_stats');
      
      if (stats) {
        stats.first_blood.forEach(player => {
          expect(player.match_count).toBeGreaterThanOrEqual(2);
          expect(player.bayesian_win_rate).toBeDefined();
        });
        
        // Vérifier le tri
        const rates = stats.first_blood.map(p => p.bayesian_win_rate);
        expect(rates).toBeSorted({ descending: true });
      }
    });

    it('devrait valider les Classicos', async () => {
      const { data: stats } = await supabase.rpc('get_historical_stats');
      
      if (stats) {
        expect(stats.classicos.length).toBeLessThanOrEqual(3);
        
        stats.classicos.forEach(classico => {
          expect(classico.total_matches).toBeGreaterThanOrEqual(5);
          expect(classico.matches.length).toBe(classico.total_matches);
        });
      }
    });
  });
});
```

## Tests de Performance

```typescript
// tests/integration/performance.test.ts
describe('Tests de Performance', () => {
  test('temps de calcul sous seuil', async () => {
    const startTime = performance.now();
    
    await calculateAllStats();
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(1000); // Max 1 seconde
  });

  test('utilisation mémoire sous seuil', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    await calculateAllStats();
    
    const memoryUsed = process.memoryUsage().heapUsed - initialMemory;
    expect(memoryUsed).toBeLessThan(50 * 1024 * 1024); // Max 50MB
  });
});
```

## Tests de Charge

```typescript
// tests/load/stats-load.test.ts
import { LoadTest } from '@k6/k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const response = http.get('http://api.example.com/stats');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
}
```

## Tests de Régression

```typescript
// tests/regression/stats-regression.test.ts
describe('Tests de Régression', () => {
  test('comparaison avec données historiques', async () => {
    const historicalStats = await loadHistoricalStats();
    const currentStats = await calculateAllStats();
    
    expect(currentStats).toMatchSnapshot();
    
    // Vérifier les écarts significatifs
    const deviation = calculateDeviation(historicalStats, currentStats);
    expect(deviation).toBeLessThan(0.1); // Max 10% d'écart
  });
});
```

## Tests de Validation des Données

```typescript
// tests/validation/data-validation.test.ts
describe('Validation des Données', () => {
  test('format des statistiques', () => {
    const stats = calculateAllStats();
    
    expect(stats).toMatchSchema({
      type: 'object',
      required: ['baseStats', 'complexStats', 'historicalStats'],
      properties: {
        baseStats: {
          type: 'object',
          required: ['winRate', 'totalMatches']
        },
        complexStats: {
          type: 'object',
          required: ['streaks', 'positions']
        }
      }
    });
  });

  test('valeurs dans les limites attendues', () => {
    const stats = calculateAllStats();
    
    expect(stats.baseStats.winRate).toBeGreaterThanOrEqual(0);
    expect(stats.baseStats.winRate).toBeLessThanOrEqual(1);
  });
});
```

## Tests de Robustesse

```typescript
// tests/robustness/error-handling.test.ts
describe('Gestion des Erreurs', () => {
  test('gestion données manquantes', async () => {
    const stats = await calculateStatsWithMissingData();
    expect(stats).toBeDefined();
    expect(stats.error).toBe(null);
  });

  test('gestion données invalides', async () => {
    const invalidData = { score: 'invalid' };
    await expect(calculateStats(invalidData))
      .rejects
      .toThrow('Invalid data format');
  });
});
```

## Tests de Cache

```typescript
// tests/cache/cache-behavior.test.ts
describe('Comportement du Cache', () => {
  test('expiration du cache', async () => {
    const stats = await calculateStats();
    await setCacheEntry('test', stats, 100); // TTL 100ms
    
    await new Promise(r => setTimeout(r, 150));
    const cachedStats = await getCacheEntry('test');
    
    expect(cachedStats).toBeNull();
  });

  test('invalidation conditionnelle', async () => {
    await setCacheEntry('test', initialStats);
    await triggerInvalidationCondition();
    
    const cachedStats = await getCacheEntry('test');
    expect(cachedStats).toBeNull();
  });
});
```

## Outils de Test

```typescript
// tests/utils/test-helpers.ts
export const TestHelpers = {
  createTestMatch: (options = {}) => ({
    score_blue: options.scoreBlue || 10,
    score_red: options.scoreRed || 5,
    date: options.date || new Date(),
    players: options.players || ['A', 'B', 'C', 'D']
  }),
  
  setupTestEnvironment: async () => {
    await cleanDatabase();
    await seedTestData();
    await setupTestCache();
  },
  
  compareStats: (stats1, stats2) => {
    const diff = {};
    for (const key in stats1) {
      if (stats1[key] !== stats2[key]) {
        diff[key] = {
          old: stats1[key],
          new: stats2[key]
        };
      }
    }
    return diff;
  }
};
``` 