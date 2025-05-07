# Tâches d'Intégration des Nouvelles Statistiques

## 1. Mise à jour de la Base de Données

### 1.1 Création des Index
- [x] Créer l'index pour l'activité globale
  ```sql
  -- Pour optimiser le comptage global des matchs
  CREATE INDEX idx_matches_count ON matches (id);
  -- Pour le filtrage des joueurs actifs
  CREATE INDEX idx_players_active ON players (disable, id);
  ```
- [x] Optimiser l'index des séries
  ```sql
  -- Index composite pour les séries avec score
  CREATE INDEX idx_matches_streaks ON matches (
    created_at,
    score_white,
    score_black,
    white_attacker,
    white_defender,
    black_attacker,
    black_defender
  );
  -- Index pour le tri chronologique
  CREATE INDEX idx_matches_temporal ON matches (created_at);
  ```
- [ ] Mettre à jour l'index des équipes
  ```sql
  -- Index normalisé pour les équipes (indépendant des positions)
  CREATE INDEX idx_matches_teams_normalized ON matches (
    LEAST(blue_attacker_id, blue_defender_id),
    GREATEST(blue_attacker_id, blue_defender_id),
    LEAST(red_attacker_id, red_defender_id),
    GREATEST(red_attacker_id, red_defender_id)
  );
  -- Index pour les matchs du lundi
  CREATE INDEX idx_matches_monday ON matches (
    created_at,
    EXTRACT(DOW FROM created_at)
  );
  ```

### 1.2 Création des Vues Matérialisées
- [x] Créer la vue pour le comptage global
  ```sql
  CREATE MATERIALIZED VIEW mv_matches_count AS
  SELECT 
    COUNT(*) as total_count,
    MAX(created_at) as last_match_date,
    MIN(created_at) as first_match_date
  FROM matches;
  
  -- Fonction de refresh pour le trigger
  CREATE OR REPLACE FUNCTION refresh_matches_count_trigger()
  RETURNS trigger AS $$
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_matches_count;
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;
  
  -- Trigger pour le refresh automatique
  CREATE TRIGGER trg_refresh_matches_count
  AFTER INSERT OR DELETE ON matches
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_matches_count_trigger();
  ```
- [ ] Mettre à jour la vue des statistiques de base
  ```sql
  CREATE MATERIALIZED VIEW mv_base_stats AS
  WITH total_matches AS (
    SELECT * FROM mv_matches_count
  ),
  player_activity AS (
    SELECT 
      p.id as player_id,
      p.pseudo,
      COUNT(DISTINCT m.id) as match_count,
      MAX(m.created_at) as last_match_at,
      MIN(m.created_at) as first_match_at
    FROM players p
    LEFT JOIN matches m ON p.id IN (
      m.blue_attacker_id, m.blue_defender_id,
      m.red_attacker_id, m.red_defender_id
    )
    WHERE NOT p.disable
    GROUP BY p.id, p.pseudo
  )
  SELECT 
    jsonb_build_object(
      'total_matches', total_matches.total_count,
      'active_players', (
        SELECT COUNT(*) 
        FROM player_activity 
        WHERE match_count >= 10
      ),
      'most_active', (
        SELECT jsonb_agg(pa.*)
        FROM player_activity pa
        WHERE match_count >= 10
        ORDER BY match_count DESC
        LIMIT 3
      ),
      'least_active', (
        SELECT jsonb_agg(pa.*)
        FROM player_activity pa
        WHERE match_count > 0
        ORDER BY match_count ASC
        LIMIT 3
      )
    ) as stats
  FROM total_matches;
  ```

## 2. Mise à jour des Fonctions SQL

### 2.1 Fonction get_base_match_stats
- [x] Modifier la logique de l'activité
  ```sql
  CREATE OR REPLACE FUNCTION get_base_match_stats()
  RETURNS jsonb AS $$
  DECLARE
    v_total_matches integer;
    v_stats jsonb;
  BEGIN
    -- Vérifier le nombre total de matchs
    SELECT total_count INTO v_total_matches FROM mv_matches_count;
    
    -- Si moins de 25 matchs, retourner null
    IF v_total_matches < 25 THEN
      RETURN NULL;
    END IF;
    
    -- Calculer les statistiques
    WITH player_activity AS (
      SELECT 
        p.id as player_id,
        p.pseudo,
        COUNT(DISTINCT m.id) as match_count,
        MAX(m.created_at) as last_match_at,
        MIN(m.created_at) as first_match_at
      FROM players p
      LEFT JOIN matches m ON p.id IN (
        m.white_attacker, m.white_defender,
        m.black_attacker, m.black_defender
      )
      WHERE NOT p.disable
      GROUP BY p.id, p.pseudo
    )
    SELECT 
      jsonb_build_object(
        'most_active', (
          SELECT jsonb_agg(row_to_json(pa))
          FROM (
            SELECT * FROM player_activity
            WHERE match_count >= 10
            ORDER BY match_count DESC
            LIMIT 3
          ) pa
        ),
        'least_active', (
          SELECT jsonb_agg(row_to_json(pa))
          FROM (
            SELECT * FROM player_activity
            WHERE match_count > 0
            ORDER BY match_count ASC
            LIMIT 3
          ) pa
        )
      )
    INTO v_stats;
    
    RETURN v_stats;
  END;
  $$ LANGUAGE plpgsql;
  ```

### 2.2 Fonction get_complex_stats
- [x] Mettre à jour le calcul des séries
  ```sql
  CREATE OR REPLACE FUNCTION get_complex_stats()
  RETURNS jsonb AS $$
  DECLARE
    v_total_matches integer;
    v_stats jsonb;
  BEGIN
    -- Vérifier le nombre total de matchs
    SELECT total_count INTO v_total_matches FROM mv_matches_count;
    
    -- Calculer les séries avec minimum 3 matchs
    WITH match_results AS (
      SELECT 
        m.id,
        m.created_at,
        p.id as player_id,
        p.pseudo,
        CASE 
          WHEN (p.id IN (m.white_attacker, m.white_defender) AND m.score_white > m.score_black) OR
               (p.id IN (m.black_attacker, m.black_defender) AND m.score_black > m.score_white)
          THEN true
          ELSE false
        END as is_victory
      FROM matches m
      CROSS JOIN players p
      WHERE p.id IN (
        m.white_attacker, m.white_defender,
        m.black_attacker, m.black_defender
      )
      ORDER BY m.created_at
    ),
    streaks AS (
      SELECT
        player_id,
        pseudo,
        is_victory,
        COUNT(*) as streak_length,
        MIN(created_at) as start_date,
        MAX(created_at) as end_date,
        array_agg(id ORDER BY created_at) as match_ids
      FROM (
        SELECT
          *,
          COUNT(CASE WHEN NOT is_victory THEN 1 END) OVER (
            PARTITION BY player_id ORDER BY created_at
          ) as victory_group,
          COUNT(CASE WHEN is_victory THEN 1 END) OVER (
            PARTITION BY player_id ORDER BY created_at
          ) as defeat_group
        FROM match_results
      ) grouped
      GROUP BY player_id, pseudo, is_victory,
        CASE WHEN is_victory THEN victory_group ELSE defeat_group END
      HAVING COUNT(*) >= 3
    )
    SELECT 
      jsonb_build_object(
        'longest_win_streak', (
          SELECT jsonb_agg(row_to_json(s))
          FROM (
            SELECT 
              player_id,
              pseudo,
              streak_length,
              start_date,
              end_date,
              match_ids
            FROM streaks
            WHERE is_victory
            ORDER BY streak_length DESC, end_date DESC
            LIMIT 3
          ) s
        ),
        'longest_lose_streak', (
          SELECT jsonb_agg(row_to_json(s))
          FROM (
            SELECT 
              player_id,
              pseudo,
              streak_length,
              start_date,
              end_date,
              match_ids
            FROM streaks
            WHERE NOT is_victory
            ORDER BY streak_length DESC, end_date DESC
            LIMIT 3
          ) s
        )
      )
    INTO v_stats;
    
    RETURN v_stats;
  END;
  $$ LANGUAGE plpgsql;
  ```

### 2.3 Fonction get_historical_stats
- [x] Modifier le First Blood
  ```sql
  -- Dans la fonction get_historical_stats
  WITH monday_matches AS (
    SELECT 
      m.*,
      DATE_TRUNC('week', m.created_at) as week_start,
      ROW_NUMBER() OVER (
        PARTITION BY DATE_TRUNC('week', m.created_at)
        ORDER BY m.created_at
      ) as match_order
    FROM matches m
    WHERE EXTRACT(DOW FROM m.created_at) = 1
  ),
  first_blood_stats AS (
    SELECT 
      p.id as player_id,
      p.pseudo,
      COUNT(*) as match_count,
      COUNT(*) FILTER (
        WHERE (p.id IN (m.white_attacker, m.white_defender) AND m.score_white > m.score_black) OR
              (p.id IN (m.black_attacker, m.black_defender) AND m.score_black > m.score_white)
      ) as victories,
      array_agg(m.created_at ORDER BY m.created_at) as match_dates
    FROM monday_matches m
    CROSS JOIN players p
    WHERE 
      match_order = 1 AND
      p.id IN (
        m.white_attacker, m.white_defender,
        m.black_attacker, m.black_defender
      )
    GROUP BY p.id, p.pseudo
    HAVING COUNT(*) >= 2
  ),
  first_blood_with_rate AS (
    SELECT 
      *,
      (victories::float + 1) / (match_count + 2) as bayesian_win_rate
    FROM first_blood_stats
  )
  ```
- [x] Mettre à jour les Classicos
  ```sql
  -- Dans la fonction get_historical_stats
  WITH team_matches AS (
    SELECT 
      m.*,
      ARRAY[
        LEAST(white_attacker, white_defender),
        GREATEST(white_attacker, white_defender)
      ] as white_team,
      ARRAY[
        LEAST(black_attacker, black_defender),
        GREATEST(black_attacker, black_defender)
      ] as black_team
    FROM matches m
  ),
  team_stats AS (
    SELECT 
      LEAST(white_team::text, black_team::text) as team1,
      GREATEST(white_team::text, black_team::text) as team2,
      COUNT(*) as total_matches,
      COUNT(*) FILTER (
        WHERE (white_team::text <= black_team::text AND score_white > score_black) OR
              (white_team::text > black_team::text AND score_black > score_white)
      ) as team1_victories,
      array_agg(
        jsonb_build_object(
          'id', id,
          'date', created_at,
          'score', CASE 
            WHEN white_team::text <= black_team::text 
            THEN array[score_white, score_black]
            ELSE array[score_black, score_white]
          END
        )
        ORDER BY created_at
      ) as matches,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rivalry_rank
    FROM team_matches
    GROUP BY LEAST(white_team::text, black_team::text), GREATEST(white_team::text, black_team::text)
    HAVING COUNT(*) >= 5
  )
  ```

## 3. Mise à jour du Backend

### 3.1 Types TypeScript
- [ ] Mettre à jour les interfaces
  ```typescript
  // types/stats.ts
  
  // Stats de base
  interface ActivityStats {
    total_matches: number;
    player_id: string;
    pseudo: string;
    match_count: number;
    last_match_at: Date;
    first_match_at: Date;
  }
  
  // Stats complexes
  interface StreakStats {
    player_id: string;
    pseudo: string;
    streak_length: number;
    start_date: Date;
    end_date: Date;
    matches: {
      id: string;
      date: Date;
      score: [number, number];
    }[];
  }
  
  // Stats historiques
  interface FirstBloodStats {
    player_id: string;
    pseudo: string;
    match_count: number;
    victories: number;
    win_rate: number;
    dates: Date[];
  }
  
  interface ClassicoTeam {
    player1: {
      id: string;
      pseudo: string;
    };
    player2: {
      id: string;
      pseudo: string;
    };
  }
  
  interface ClassicoStats {
    team1: ClassicoTeam;
    team2: ClassicoTeam;
    total_matches: number;
    team1_victories: number;
    team2_victories: number;
    last_match: Date;
    matches: {
      id: string;
      date: Date;
      score: [number, number];
    }[];
  }
  ```

### 3.2 Validation
- [ ] Mettre à jour les validateurs
  ```typescript
  // validators/stats.ts
  
  export class StatsValidator {
    // Validation de l'activité
    validateActivity(stats: ActivityStats): boolean {
      return (
        stats.total_matches >= 25 &&
        (stats.match_count >= 10 || stats.match_count > 0)
      );
    }
    
    // Validation des séries
    validateStreak(stats: StreakStats): boolean {
      return (
        stats.streak_length >= 3 &&
        stats.matches.length >= 3 &&
        stats.start_date < stats.end_date
      );
    }
    
    // Validation du First Blood
    validateFirstBlood(stats: FirstBloodStats): boolean {
      return (
        stats.match_count >= 2 &&
        stats.victories <= stats.match_count &&
        stats.win_rate >= 0 && 
        stats.win_rate <= 1
      );
    }
    
    // Validation des Classicos
    validateClassico(stats: ClassicoStats): boolean {
      return (
        stats.total_matches >= 5 &&
        stats.team1_victories + stats.team2_victories === stats.total_matches &&
        stats.matches.length === stats.total_matches
      );
    }
  }
  
  // Tests de validation
  describe('StatsValidator', () => {
    const validator = new StatsValidator();
    
    describe('validateActivity', () => {
      it('should validate most active players', () => {
        // Tests
      });
      
      it('should validate least active players', () => {
        // Tests
      });
    });
    
    // ... autres tests ...
  });
  ```

## 4. Mise à jour du Frontend

### 4.1 Composants React
- [ ] Modifier StatsDisplay
  ```typescript
  // components/StatsDisplay.tsx
  
  interface StatsDisplayProps {
    totalMatches: number;
    stats: {
      activity: ActivityStats[];
      streaks: StreakStats[];
      firstBlood: FirstBloodStats[];
      classicos: ClassicoStats[];
    };
  }
  
  const StatsDisplay: React.FC<StatsDisplayProps> = ({ totalMatches, stats }) => {
    // Vérification du nombre total de matchs
    if (totalMatches < 25) {
      return (
        <div className="stats-placeholder">
          <p>Minimum 25 matchs requis pour afficher les statistiques</p>
          <p>Actuellement : {totalMatches} matchs joués</p>
        </div>
      );
    }
    
    return (
      <div className="stats-container">
        <ActivitySection stats={stats.activity} />
        <StreaksSection stats={stats.streaks} />
        <FirstBloodSection stats={stats.firstBlood} />
        <ClassicosSection stats={stats.classicos} />
      </div>
    );
  };
  ```
- [ ] Mettre à jour les cartes de statistiques
  ```typescript
  // components/stats/ActivityCard.tsx
  const ActivityCard: React.FC<{ stats: ActivityStats }> = ({ stats }) => {
    return (
      <StatCard
        title={stats.match_count >= 10 ? "Le Précheur" : "Le Fantôme"}
        value={`${stats.match_count} matchs`}
        player={stats.pseudo}
        trend={{
          value: calculateTrend(stats.match_count),
          label: "vs. moyenne"
        }}
        details={[
          `Premier match : ${formatDate(stats.first_match_at)}`,
          `Dernier match : ${formatDate(stats.last_match_at)}`
        ]}
      />
    );
  };
  
  // components/stats/StreaksCard.tsx
  const StreaksCard: React.FC<{ stats: StreakStats }> = ({ stats }) => {
    return (
      <StatCard
        title="Série"
        value={`${stats.streak_length} matchs`}
        player={stats.pseudo}
        dateRange={{
          start: stats.start_date,
          end: stats.end_date
        }}
        matches={stats.matches}
      />
    );
  };
  
  // ... autres composants ...
  ```

### 4.2 Tests Frontend
- [ ] Ajouter les tests pour les nouveaux critères
  ```typescript
  // __tests__/components/StatsDisplay.test.tsx
  
  describe('StatsDisplay', () => {
    it('should show placeholder when total matches < 25', () => {
      const { getByText } = render(
        <StatsDisplay totalMatches={20} stats={mockStats} />
      );
      
      expect(getByText(/Minimum 25 matchs requis/)).toBeInTheDocument();
    });
    
    it('should filter most active players with < 10 matches', () => {
      const { queryByText } = render(
        <StatsDisplay totalMatches={30} stats={mockStats} />
      );
      
      expect(queryByText('8 matchs')).not.toBeInTheDocument();
    });
    
    // ... autres tests ...
  });
  ```

## 5. Tests et Validation

### 5.1 Tests Unitaires
- [ ] Tests des fonctions SQL
  ```sql
  -- tests/sql/test_stats.sql
  
  -- Test du comptage global
  DO $$
  BEGIN
    -- Préparer les données de test
    INSERT INTO matches (/* ... */) VALUES (/* ... */);
    
    -- Vérifier le comptage
    ASSERT (SELECT total_count FROM mv_matches_count) = 30;
    
    -- Nettoyer
    DELETE FROM matches WHERE /* condition de test */;
  END $$;
  
  -- Test des minimums de matchs
  DO $$
  BEGIN
    -- Test most_active
    ASSERT (
      SELECT COUNT(*)
      FROM get_base_match_stats()->'most_active'
      WHERE (value->>'match_count')::int < 10
    ) = 0;
    
    -- Test streaks
    ASSERT (
      SELECT COUNT(*)
      FROM get_complex_stats()->'streaks'
      WHERE (value->>'streak_length')::int < 3
    ) = 0;
    
    -- ... autres assertions ...
  END $$;
  ```

### 5.2 Tests d'Intégration
- [ ] Test du flux complet
  ```typescript
  // tests/integration/stats.test.ts
  
  describe('Stats Integration', () => {
    beforeAll(async () => {
      // Créer des matchs de test
      await createTestMatches();
    });
    
    it('should calculate all stats correctly', async () => {
      // Récupérer les stats
      const stats = await supabase.rpc('get_all_stats');
      
      // Vérifier l'activité
      expect(stats.base.most_active).toSatisfyAll(
        player => player.match_count >= 10
      );
      
      // Vérifier les séries
      expect(stats.complex.streaks).toSatisfyAll(
        streak => streak.length >= 3
      );
      
      // Vérifier le first blood
      expect(stats.historical.first_blood).toSatisfyAll(
        player => player.match_count >= 2
      );
      
      // Vérifier les classicos
      expect(stats.historical.classicos).toHaveLength(3);
      expect(stats.historical.classicos).toSatisfyAll(
        classico => classico.total_matches >= 5
      );
    });
  });
  ```

### 5.3 Tests de Performance
- [ ] Benchmarking des nouvelles requêtes
  ```sql
  -- tests/performance/benchmark_stats.sql
  
  -- Analyse des performances
  EXPLAIN ANALYZE
  SELECT * FROM get_base_match_stats();
  
  EXPLAIN ANALYZE
  SELECT * FROM get_complex_stats();
  
  EXPLAIN ANALYZE
  SELECT * FROM get_historical_stats();
  
  -- Test de charge
  DO $$
  DECLARE
    v_start timestamp;
    v_end timestamp;
    v_duration interval;
  BEGIN
    -- Générer des données de test
    INSERT INTO matches (/* ... */)
    SELECT /* ... */
    FROM generate_series(1, 10000);
    
    -- Mesurer les performances
    v_start := clock_timestamp();
    PERFORM get_all_stats();
    v_end := clock_timestamp();
    v_duration := v_end - v_start;
    
    RAISE NOTICE 'Durée totale: %', v_duration;
    
    -- Vérifier les index
    ANALYZE matches;
    SELECT * FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND tablename = 'matches';
  END $$;
  ```

## 6. Documentation

### 6.1 Documentation Technique
- [ ] Mettre à jour la documentation SQL
  ```markdown
  # Documentation Technique des Statistiques

  ## Critères de Calcul

  ### Activité
  - Minimum global : 25 matchs
  - Most Active : minimum 10 matchs
  - Least Active : exclusion des joueurs sans match

  ### Séries
  - Minimum : 3 matchs consécutifs
  - Ordre chronologique strict
  - Dates de début et fin incluses

  ### First Blood
  - Premier match du lundi
  - Minimum : 2 matchs
  - Taux bayésien : (victoires + 1) / (matchs + 2)

  ### Classicos
  - Minimum : 5 matchs entre équipes
  - Positions flexibles
  - Maximum : 3 rivalités affichées
  ```

### 6.2 Documentation Utilisateur
- [ ] Mettre à jour les descriptions des statistiques
  ```markdown
  # Guide des Statistiques

  ## Comment sont calculées les statistiques ?

  ### Le Précheur & Le Fantôme
  Ces titres sont attribués aux joueurs les plus et moins actifs.
  - Un minimum de 25 matchs au total est requis
  - Pour être "Précheur", il faut au moins 10 matchs
  - Les joueurs sans match ne peuvent pas être "Fantôme"

  ### Les Séries
  Une série représente des victoires ou défaites consécutives.
  - Il faut au moins 3 matchs d'affilée
  - L'ordre des matchs est important
  - Les dates de début et fin sont indiquées

  ### First Blood
  Ce titre récompense les performances lors du premier match du lundi.
  - Seul le tout premier match compte
  - Il faut au moins 2 "first blood" pour apparaître
  - Le classement prend en compte les victoires et le nombre de matchs

  ### Les Classicos
  Ces statistiques montrent les plus grandes rivalités.
  - 5 matchs minimum entre les mêmes équipes
  - L'ordre des joueurs dans l'équipe n'est pas important
  - Les 3 plus grandes rivalités sont affichées
  ```

## 7. Déploiement

### 7.1 Préparation
- [ ] Créer le script de migration
  ```sql
  -- migrations/YYYYMMDD_update_stats.sql
  
  -- 1. Sauvegarder les anciennes vues
  CREATE TABLE backup_mv_stats AS
  SELECT * FROM mv_base_stats;
  
  -- 2. Supprimer les anciens objets
  DROP MATERIALIZED VIEW IF EXISTS mv_base_stats;
  DROP INDEX IF EXISTS idx_matches_count;
  
  -- 3. Créer les nouveaux index
  CREATE INDEX idx_matches_count ON matches (id);
  -- ... autres index ...
  
  -- 4. Créer les nouvelles vues
  CREATE MATERIALIZED VIEW mv_matches_count AS
  -- ... code de la vue ...
  
  -- 5. Script de rollback
  CREATE OR REPLACE PROCEDURE rollback_stats_update()
  LANGUAGE plpgsql
  AS $$
  BEGIN
    -- Restaurer les anciennes vues
    DROP MATERIALIZED VIEW IF EXISTS mv_base_stats;
    CREATE MATERIALIZED VIEW mv_base_stats AS
    SELECT * FROM backup_mv_stats;
    
    -- Supprimer les nouveaux index
    DROP INDEX IF EXISTS idx_matches_count;
    -- ... autres rollbacks ...
  END;
  $$;
  ```

### 7.2 Déploiement
- [ ] Déployer les changements de base de données
  ```bash
  # Script de déploiement
  
  # 1. Backup
  pg_dump -t matches -t players > backup_$(date +%Y%m%d).sql
  
  # 2. Appliquer les migrations
  psql -f migrations/YYYYMMDD_update_stats.sql
  
  # 3. Vérifier les index
  psql -c "SELECT * FROM pg_indexes WHERE tablename = 'matches';"
  
  # 4. Rafraîchir les vues
  psql -c "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_matches_count;"
  ```

### 7.3 Post-déploiement
- [ ] Monitorer les performances
  ```sql
  -- Requête de monitoring
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE tablename = 'matches'
  ORDER BY idx_scan DESC;
  
  -- Temps d'exécution des fonctions
  SELECT 
    calls,
    total_time / calls as avg_time,
    rows / calls as avg_rows
  FROM pg_stat_user_functions
  WHERE funcname LIKE '%stats%'
  ORDER BY total_time DESC;
  ```
- [ ] Vérifier les statistiques
  ```typescript
  // scripts/verify_stats.ts
  
  async function verifyStats() {
    const stats = await supabase.rpc('get_all_stats');
    
    // Vérifier les critères
    console.log('Activité :', 
      stats.base.most_active.every(p => p.match_count >= 10)
    );
    
    console.log('Séries :',
      stats.complex.streaks.every(s => s.length >= 3)
    );
    
    console.log('First Blood :',
      stats.historical.first_blood.every(p => p.match_count >= 2)
    );
    
    console.log('Classicos :',
      stats.historical.classicos.length <= 3 &&
      stats.historical.classicos.every(c => c.total_matches >= 5)
    );
  }
  ``` 