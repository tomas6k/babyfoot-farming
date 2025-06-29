# Statistiques Complexes (get_complex_stats)

## Vue d'ensemble

Cette fonction calcule les statistiques complexes utilisées pour l'attribution des titres de saison, notamment :
1. Les séries de victoires et défaites consécutives (Le Saint-Baby, Le Bouffon du Roi)
2. Les performances par position (Messire, Le Charpentier, Monseigneur, Le Boulanger)
3. Les statistiques des paires de joueurs (La Royauté, Les Gueux)

### 1. Séries de Victoires/Défaites (Le Saint-Baby, Le Bouffon du Roi)

#### Critères
- Minimum 3 matchs consécutifs requis
- Séquences consécutives uniquement
- Tri par longueur de série
- En cas d'égalité, tri par player_id
- **Tous les joueurs à égalité sont inclus dans le résultat**
- Inclut les dates de début et fin de série

### 2. Performances par Position (Messire, Le Charpentier, Monseigneur, Le Boulanger)

#### Critères
- Minimum 5 matchs par position
- Visible si au moins 15 matchs sont joués sur la période par l'ensemble des joueurs
- Calcul de taux bayésiens pour les victoires/défaites (multiplié par 100)
- Tri par taux de victoire/défaite
- En cas d'égalité, tri par player_id
- **Tous les joueurs à égalité sont inclus dans le résultat**

### 3. Statistiques des Paires (La Royauté, Les Gueux)

#### Critères
- Minimum 3 matchs ensemble
- Visible si au moins 15 matchs sont joués sur la période par l'ensemble des joueurs
- Calcul de taux bayésiens pour les victoires/défaites (multiplié par 100)
- Tri par taux de victoire/défaite
- En cas d'égalité, tri par player_id de la paire
- **Toutes les paires à égalité sont incluses dans le résultat**

## Paramètres

| Nom | Type | Description | Défaut |
|-----|------|-------------|---------|
| `target_start_date` | TIMESTAMPTZ | Date de début pour filtrer les statistiques | NULL |
| `target_end_date` | TIMESTAMPTZ | Date de fin pour filtrer les statistiques | NULL |
| `target_player_id` | UUID | ID du joueur pour filtrer les statistiques | NULL |

**Note sur la priorité des filtres:**
- Si `target_start_date` ET `target_end_date` sont fournis (non NULL), les statistiques sont calculées pour cette période spécifique.
- Si seul `target_start_date` est fourni (non NULL), les statistiques sont calculées pour le mois correspondant.
- Si tous les paramètres sont NULL, les statistiques sont calculées pour l'ensemble des matchs.

## Mécanismes de Calcul

### Structure de la Fonction

La fonction utilise une table temporaire et plusieurs Common Table Expressions (CTEs) pour organiser le calcul des statistiques :

```sql
-- Création de la table temporaire pour les données des matchs
CREATE TEMP TABLE IF NOT EXISTS temp_match_data ON COMMIT DROP AS
SELECT 
    m.*,
    CASE 
        WHEN m.score_white > m.score_black THEN true 
        ELSE false 
    END as white_won
FROM matches m
WHERE CASE 
    WHEN target_start_date IS NOT NULL AND target_end_date IS NOT NULL THEN
        m.created_at::date BETWEEN target_start_date AND target_end_date
    WHEN target_start_date IS NOT NULL THEN
        DATE_TRUNC('month', m.created_at) = DATE_TRUNC('month', target_start_date)
    ELSE true
END
ORDER BY m.created_at;
```

### Calcul des Séries

Le calcul des séries repose sur une technique d'identification des séquences consécutives en SQL :

1. Pour chaque joueur, on attribue un résultat "win" ou "loss" à chaque match
2. Utilisation de ROW_NUMBER() pour identifier les séquences consécutives
3. Regroupement par groupe de séquence et calcul de la longueur
4. Sélection des séries d'au moins 3 matchs consécutifs
5. Utilisation de DENSE_RANK() pour gérer les égalités

```sql
WITH match_results AS (
    SELECT 
        p.id as player_id,
        p.pseudo,
        m.created_at,
        CASE 
            WHEN (m.white_won AND p.id IN (m.white_attacker, m.white_defender)) OR
                 (NOT m.white_won AND p.id IN (m.black_attacker, m.black_defender))
            THEN 'win'
            ELSE 'loss'
        END as result_type
    FROM players p
    JOIN temp_match_data m ON p.id IN (
        m.white_attacker, m.white_defender,
        m.black_attacker, m.black_defender
    )
    WHERE (target_player_id IS NULL OR p.id = target_player_id)
),
streaks AS (
    SELECT 
        player_id,
        pseudo,
        result_type,
        COUNT(*) as streak_length,
        MIN(created_at) as start_date,
        MAX(created_at) as end_date,
        DENSE_RANK() OVER (
            PARTITION BY result_type 
            ORDER BY COUNT(*) DESC, player_id
        ) as rnk
    FROM (
        SELECT 
            *,
            (ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY created_at) - 
             ROW_NUMBER() OVER (PARTITION BY player_id, result_type ORDER BY created_at)) as grp
        FROM match_results
    ) s
    GROUP BY player_id, pseudo, result_type, grp
    HAVING COUNT(*) >= 3
)
```

### Calcul des Performances par Position

Pour les performances par position, la fonction :

1. Sépare les statistiques par joueur et par position (attaquant/défenseur)
2. Calcule le nombre de victoires et défaites pour chaque joueur à chaque position
3. Applique un ajustement bayésien aux taux de victoire/défaite
4. Filtre les joueurs ayant joué au moins 5 matchs à une position donnée
5. Utilise DENSE_RANK() pour identifier les meilleurs et pires joueurs à chaque position

### Calcul des Statistiques des Paires

Pour les statistiques des paires, la fonction :

1. Identifie toutes les paires de joueurs ayant joué ensemble
2. Normalise l'ordre des joueurs dans chaque paire avec LEAST/GREATEST
3. Calcule le nombre total de matchs, victoires et défaites pour chaque paire
4. Applique un ajustement bayésien aux taux de victoire/défaite
5. Filtre les paires ayant joué au moins 3 matchs ensemble
6. Identifie les meilleures et pires paires avec DENSE_RANK()

## Format de Retour

```typescript
interface ComplexStats {
  streaks: {
    longest_win_streak: Array<{
      player_id: string;
      pseudo: string;
      streak_length: number;
      start_date: string;
      end_date: string;
    }>;
    longest_lose_streak: Array<{
      player_id: string;
      pseudo: string;
      streak_length: number;
      start_date: string;
      end_date: string;
    }>;
  };
  positions: {
    attacker: {
      best: Array<{
        player_id: string;
        pseudo: string;
        wins: number;
        total_matches: number;
        win_rate: number;
      }>;
      worst: Array<{
        player_id: string;
        pseudo: string;
        defeats: number;
        total_matches: number;
        loss_rate: number;
      }>;
    };
    defender: {
      best: Array<{
        player_id: string;
        pseudo: string;
        wins: number;
        total_matches: number;
        win_rate: number;
      }>;
      worst: Array<{
        player_id: string;
        pseudo: string;
        defeats: number;
        total_matches: number;
        loss_rate: number;
      }>;
    };
  };
  pairs: {
    best: Array<{
      player1_id: string;
      player2_id: string;
      player1_pseudo: string;
      player2_pseudo: string;
      wins: number;
      total_matches: number;
      win_rate: number;
    }>;
    worst: Array<{
      player1_id: string;
      player2_id: string;
      player1_pseudo: string;
      player2_pseudo: string;
      defeats: number;
      total_matches: number;
      loss_rate: number;
    }>;
  };
}
```

## Optimisations

### 1. Table Temporaire
- Utilisation d'une table temporaire `temp_match_data` pour améliorer les performances
- La table est automatiquement supprimée à la fin de la transaction
- Préfiltre les données selon les paramètres de date fournis

### 2. Calcul des Taux
- Utilisation de taux bayésiens : `(victories::float + 1) / (total_matches + 2) * 100`
- L'approche bayésienne évite les taux de 0% ou 100% pour les petits échantillons
- Les taux sont multipliés par 100 directement dans la base de données

### 3. Gestion des Égalités
- Utilisation de `DENSE_RANK()` pour inclure tous les joueurs/paires à égalité
- Tri secondaire par ID pour assurer la cohérence des résultats

### 4. Optimisation des Jointures
- Utilisation de `CROSS JOIN` avec filtrage pour les paires
- Jointures optimisées pour les positions et les séries
- Indexation implicite sur les identifiants de joueurs

### 5. Normalisation des Paires
- Utilisation de `LEAST` et `GREATEST` pour normaliser l'ordre des joueurs dans les paires
- Évite les doublons et assure la cohérence des statistiques

## Backup et Restauration

### Stratégie de Sauvegarde
- Les statistiques complexes sont calculées à la volée et ne nécessitent pas de sauvegarde directe
- Les données sources (tables `matches` et `players`) sont sauvegardées quotidiennement par Supabase
- Les séries sont recalculées à chaque appel, assurant leur exactitude

### Restauration
- La restauration des données sources suffit à rétablir toutes les statistiques complexes
- Les séries seront automatiquement recalculées lors du prochain appel
- Aucune intervention manuelle n'est nécessaire pour la reconstruction des statistiques

### Points d'Attention
- Les séries sont particulièrement sensibles à l'ordre chronologique des matchs
- Vérifier l'intégrité des dates après une restauration
- S'assurer que tous les matchs ont été correctement restaurés pour maintenir la précision des séries

## Maintenance

- Les noms des colonnes reflètent la structure actuelle de la table matches
- La fonction est compatible avec la nouvelle structure de données
- Les résultats incluent tous les joueurs à égalité pour chaque catégorie
- Le tri est cohérent et prévisible grâce au tri secondaire par ID 

## Code Source

```sql
CREATE OR REPLACE FUNCTION public.get_complex_stats(
    target_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, 
    target_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, 
    target_player_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    streaks_result jsonb;
    positions_result jsonb;
    pairs_result jsonb;
    match_data_result jsonb;
    total_match_count integer;
BEGIN
    -- Création de la table temporaire pour les données des matchs
    CREATE TEMP TABLE IF NOT EXISTS temp_match_data ON COMMIT DROP AS
    SELECT 
        m.*,
        CASE 
            WHEN m.score_white > m.score_black THEN true 
            ELSE false 
        END as white_won
    FROM matches m
    WHERE CASE 
        WHEN target_start_date IS NOT NULL AND target_end_date IS NOT NULL THEN
            m.created_at::date BETWEEN target_start_date AND target_end_date
        WHEN target_start_date IS NOT NULL THEN
            DATE_TRUNC('month', m.created_at) = DATE_TRUNC('month', target_start_date)
        ELSE true
    END
    ORDER BY m.created_at;
    
    -- Calcul du nombre total de matchs
    SELECT COUNT(*) INTO total_match_count FROM temp_match_data;

    -- Calcul des séries
    WITH match_results AS (
        SELECT 
            p.id as player_id,
            p.pseudo,
            m.created_at,
            CASE 
                WHEN (m.white_won AND p.id IN (m.white_attacker, m.white_defender)) OR
                     (NOT m.white_won AND p.id IN (m.black_attacker, m.black_defender))
                THEN 'win'
                ELSE 'loss'
            END as result_type
        FROM players p
        JOIN temp_match_data m ON p.id IN (
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender
        )
        WHERE (target_player_id IS NULL OR p.id = target_player_id)
    ),
    streaks AS (
        SELECT 
            player_id,
            pseudo,
            result_type,
            COUNT(*) as streak_length,
            MIN(created_at) as start_date,
            MAX(created_at) as end_date,
            DENSE_RANK() OVER (
                PARTITION BY result_type 
                ORDER BY COUNT(*) DESC, player_id
            ) as rnk
        FROM (
            SELECT 
                *,
                (ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY created_at) - 
                 ROW_NUMBER() OVER (PARTITION BY player_id, result_type ORDER BY created_at)) as grp
            FROM match_results
        ) s
        GROUP BY player_id, pseudo, result_type, grp
        HAVING COUNT(*) >= 3
    )
    SELECT jsonb_build_object(
        'longest_win_streak', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'player_id', player_id,
                'pseudo', pseudo,
                'streak_length', streak_length,
                'start_date', start_date,
                'end_date', end_date
            ) ORDER BY streak_length DESC, player_id)
            FROM streaks
            WHERE result_type = 'win' AND rnk = 1
        ), '[]'::jsonb),
        'longest_lose_streak', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'player_id', player_id,
                'pseudo', pseudo,
                'streak_length', streak_length,
                'start_date', start_date,
                'end_date', end_date
            ) ORDER BY streak_length DESC, player_id)
            FROM streaks
            WHERE result_type = 'loss' AND rnk = 1
        ), '[]'::jsonb)
    ) INTO streaks_result;

    -- Calcul des positions
    WITH position_stats AS (
        SELECT 
            p.id as player_id,
            p.pseudo,
            'attacker' as position,
            COUNT(*) as total_matches,
            COUNT(*) FILTER (WHERE 
                (m.white_won AND p.id = m.white_attacker) OR
                (NOT m.white_won AND p.id = m.black_attacker)
            ) as victories,
            COUNT(*) FILTER (WHERE 
                (NOT m.white_won AND p.id = m.white_attacker) OR
                (m.white_won AND p.id = m.black_attacker)
            ) as defeats
        FROM players p
        JOIN temp_match_data m ON p.id IN (m.white_attacker, m.black_attacker)
        GROUP BY p.id, p.pseudo
        
        UNION ALL
        
        SELECT 
            p.id as player_id,
            p.pseudo,
            'defender' as position,
            COUNT(*) as total_matches,
            COUNT(*) FILTER (WHERE 
                (m.white_won AND p.id = m.white_defender) OR
                (NOT m.white_won AND p.id = m.black_defender)
            ) as victories,
            COUNT(*) FILTER (WHERE 
                (NOT m.white_won AND p.id = m.white_defender) OR
                (m.white_won AND p.id = m.black_defender)
            ) as defeats
        FROM players p
        JOIN temp_match_data m ON p.id IN (m.white_defender, m.black_defender)
        GROUP BY p.id, p.pseudo
    ),
    position_stats_ranked AS (
        SELECT 
            player_id,
            pseudo,
            position,
            total_matches,
            victories,
            defeats,
            (victories::float + 1) / (total_matches + 2) * 100 as win_rate,
            (defeats::float + 1) / (total_matches + 2) * 100 as loss_rate,
            DENSE_RANK() OVER (
                PARTITION BY position 
                ORDER BY (victories::float + 1) / (total_matches + 2) DESC, player_id
            ) as win_rank,
            DENSE_RANK() OVER (
                PARTITION BY position 
                ORDER BY (defeats::float + 1) / (total_matches + 2) DESC, player_id
            ) as loss_rank
        FROM position_stats
        WHERE total_matches >= 5 -- Maintien du minimum de 5 matchs par position
    )
    SELECT 
        CASE
            -- Condition de 15 matchs minimum sur la période
            WHEN total_match_count >= 15 THEN
                jsonb_build_object(
                    'attacker', jsonb_build_object(
                        'best', COALESCE((
                            SELECT jsonb_agg(jsonb_build_object(
                                'player_id', player_id,
                                'pseudo', pseudo,
                                'wins', victories,
                                'total_matches', total_matches,
                                'win_rate', win_rate
                            ) ORDER BY win_rate DESC, player_id)
                            FROM position_stats_ranked
                            WHERE position = 'attacker' AND win_rank = 1
                        ), '[]'::jsonb),
                        'worst', COALESCE((
                            SELECT jsonb_agg(jsonb_build_object(
                                'player_id', player_id,
                                'pseudo', pseudo,
                                'defeats', defeats,
                                'total_matches', total_matches,
                                'loss_rate', loss_rate
                            ) ORDER BY loss_rate DESC, player_id)
                            FROM position_stats_ranked
                            WHERE position = 'attacker' AND loss_rank = 1
                        ), '[]'::jsonb)
                    ),
                    'defender', jsonb_build_object(
                        'best', COALESCE((
                            SELECT jsonb_agg(jsonb_build_object(
                                'player_id', player_id,
                                'pseudo', pseudo,
                                'wins', victories,
                                'total_matches', total_matches,
                                'win_rate', win_rate
                            ) ORDER BY win_rate DESC, player_id)
                            FROM position_stats_ranked
                            WHERE position = 'defender' AND win_rank = 1
                        ), '[]'::jsonb),
                        'worst', COALESCE((
                            SELECT jsonb_agg(jsonb_build_object(
                                'player_id', player_id,
                                'pseudo', pseudo,
                                'defeats', defeats,
                                'total_matches', total_matches,
                                'loss_rate', loss_rate
                            ) ORDER BY loss_rate DESC, player_id)
                            FROM position_stats_ranked
                            WHERE position = 'defender' AND loss_rank = 1
                        ), '[]'::jsonb)
                    )
                )
            ELSE NULL
        END INTO positions_result;

    -- Calcul des paires
    WITH pair_stats AS (
        SELECT 
            LEAST(p1.id, p2.id) as player1_id,
            GREATEST(p1.id, p2.id) as player2_id,
            CASE WHEN p1.id < p2.id THEN p1.pseudo ELSE p2.pseudo END as player1_pseudo,
            CASE WHEN p1.id < p2.id THEN p2.pseudo ELSE p1.pseudo END as player2_pseudo,
            COUNT(*) as total_matches,
            COUNT(*) FILTER (WHERE 
                (m.white_won AND p1.id IN (m.white_attacker, m.white_defender) AND p2.id IN (m.white_attacker, m.white_defender)) OR
                (NOT m.white_won AND p1.id IN (m.black_attacker, m.black_defender) AND p2.id IN (m.black_attacker, m.black_defender))
            ) as victories,
            COUNT(*) FILTER (WHERE 
                (NOT m.white_won AND p1.id IN (m.white_attacker, m.white_defender) AND p2.id IN (m.white_attacker, m.white_defender)) OR
                (m.white_won AND p1.id IN (m.black_attacker, m.black_defender) AND p2.id IN (m.black_attacker, m.black_defender))
            ) as defeats
        FROM players p1
        CROSS JOIN players p2
        JOIN temp_match_data m ON 
            (p1.id IN (m.white_attacker, m.white_defender) AND p2.id IN (m.white_attacker, m.white_defender)) OR
            (p1.id IN (m.black_attacker, m.black_defender) AND p2.id IN (m.black_attacker, m.black_defender))
        WHERE p1.id < p2.id
        GROUP BY p1.id, p2.id, p1.pseudo, p2.pseudo
    ),
    pair_stats_ranked AS (
        SELECT 
            player1_id,
            player2_id,
            player1_pseudo,
            player2_pseudo,
            total_matches,
            victories,
            defeats,
            (victories::float + 1) / (total_matches + 2) * 100 as win_rate,
            (defeats::float + 1) / (total_matches + 2) * 100 as loss_rate,
            DENSE_RANK() OVER (
                ORDER BY (victories::float + 1) / (total_matches + 2) DESC, 
                LEAST(player1_id, player2_id)
            ) as win_rank,
            DENSE_RANK() OVER (
                ORDER BY (defeats::float + 1) / (total_matches + 2) DESC, 
                LEAST(player1_id, player2_id)
            ) as loss_rank
        FROM pair_stats
        WHERE total_matches >= 3 -- Maintien du minimum de 3 matchs par paire
    )
    SELECT 
        CASE
            -- Condition de 15 matchs minimum sur la période
            WHEN total_match_count >= 15 THEN
                jsonb_build_object(
                    'best', COALESCE((
                        SELECT jsonb_agg(jsonb_build_object(
                            'player1_id', player1_id,
                            'player2_id', player2_id,
                            'player1_pseudo', player1_pseudo,
                            'player2_pseudo', player2_pseudo,
                            'wins', victories,
                            'total_matches', total_matches,
                            'win_rate', win_rate
                        ) ORDER BY win_rate DESC, LEAST(player1_id, player2_id))
                        FROM pair_stats_ranked
                        WHERE win_rank = 1
                    ), '[]'::jsonb),
                    'worst', COALESCE((
                        SELECT jsonb_agg(jsonb_build_object(
                            'player1_id', player1_id,
                            'player2_id', player2_id,
                            'player1_pseudo', player1_pseudo,
                            'player2_pseudo', player2_pseudo,
                            'defeats', defeats,
                            'total_matches', total_matches,
                            'loss_rate', loss_rate
                        ) ORDER BY loss_rate DESC, LEAST(player1_id, player2_id))
                        FROM pair_stats_ranked
                        WHERE loss_rank = 1
                    ), '[]'::jsonb)
                )
            ELSE NULL
        END INTO pairs_result;

    -- Nettoyage de la table temporaire
    DROP TABLE IF EXISTS temp_match_data;

    -- Combinaison des résultats
    RETURN jsonb_build_object(
        'streaks', streaks_result,
        'positions', positions_result,
        'pairs', pairs_result
    );
END;
$function$; 