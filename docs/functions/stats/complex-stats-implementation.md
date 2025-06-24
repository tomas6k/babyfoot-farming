# Implémentation proposée pour get_complex_stats

Cette proposition de code montre comment modifier la fonction `get_complex_stats` pour mettre en œuvre les nouveaux critères.

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
    )
    SELECT 
        CASE
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
    )
    SELECT 
        CASE
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