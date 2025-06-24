-- Script de déploiement pour la fonction get_base_match_stats
-- À exécuter après validation par l'équipe

-- Étape 1: Renommer la fonction actuelle pour sauvegarde
ALTER FUNCTION public.get_base_match_stats(date, date, date) 
  RENAME TO get_base_match_stats_backup;

-- Étape 2: Remplacer par la nouvelle implémentation
CREATE OR REPLACE FUNCTION public.get_base_match_stats(
    p_date date DEFAULT CURRENT_DATE, 
    p_date_start date DEFAULT NULL::date, 
    p_date_end date DEFAULT NULL::date
)
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result jsonb;
    v_total_matches integer;
BEGIN
    -- Calculer le nombre total de matchs sur la période
    SELECT COUNT(*) INTO v_total_matches 
    FROM matches m
    WHERE CASE 
        WHEN p_date_start IS NOT NULL AND p_date_end IS NOT NULL THEN
            m.created_at::date BETWEEN p_date_start AND p_date_end
        WHEN p_date IS NOT NULL THEN
            DATE_TRUNC('month', m.created_at) = DATE_TRUNC('month', p_date::timestamp)
        ELSE true
    END;

    WITH match_data AS (
        SELECT 
            m.id,
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender,
            m.score_white, m.score_black,
            m.created_at,
            CASE 
                WHEN m.score_white > m.score_black THEN true
                ELSE false
            END as white_won
        FROM matches m
        WHERE CASE 
            WHEN p_date_start IS NOT NULL AND p_date_end IS NOT NULL THEN
                m.created_at::date BETWEEN p_date_start AND p_date_end
            WHEN p_date IS NOT NULL THEN
                DATE_TRUNC('month', m.created_at) = DATE_TRUNC('month', p_date::timestamp)
            ELSE true
        END
    ),
    player_matches AS (
        -- Normaliser les données des matchs par joueur
        SELECT DISTINCT
            m.id as match_id,
            p.id as player_id,
            p.pseudo,
            CASE 
                WHEN p.id IN (m.white_attacker, m.white_defender) AND m.white_won
                    OR p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won
                THEN true
                ELSE false
            END as is_winner,
            -- Perfect win: gagner 10-0
            (
                (m.score_white = 10 AND m.score_black = 0 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 10 AND m.score_white = 0 AND p.id IN (m.black_attacker, m.black_defender))
            ) as is_perfect_win,
            -- Perfect loss: perdre 0-10
            (
                (m.score_white = 0 AND m.score_black = 10 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 0 AND m.score_white = 10 AND p.id IN (m.black_attacker, m.black_defender))
            ) as is_perfect_loss,
            -- Close win: gagner 10-9
            (
                (m.score_white = 10 AND m.score_black = 9 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 10 AND m.score_white = 9 AND p.id IN (m.black_attacker, m.black_defender))
            ) as is_close_win,
            -- Close loss: perdre 9-10
            (
                (m.score_white = 9 AND m.score_black = 10 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 9 AND m.score_white = 10 AND p.id IN (m.black_attacker, m.black_defender))
            ) as is_close_loss,
            m.created_at
        FROM match_data m
        CROSS JOIN players p
        WHERE p.id IN (m.white_attacker, m.white_defender, m.black_attacker, m.black_defender)
    ),
    perfect_wins_ranked AS (
        -- Calculer les victoires parfaites (10-0)
        SELECT 
            player_id,
            pseudo,
            COUNT(*) as count,
            DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) as rnk
        FROM player_matches
        WHERE is_perfect_win
        GROUP BY player_id, pseudo
        HAVING COUNT(*) > 0
    ),
    perfect_losses_ranked AS (
        -- Calculer les défaites parfaites (0-10)
        SELECT 
            player_id,
            pseudo,
            COUNT(*) as count,
            DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) as rnk
        FROM player_matches
        WHERE is_perfect_loss
        GROUP BY player_id, pseudo
        HAVING COUNT(*) > 0
    ),
    close_wins_ranked AS (
        -- Calculer les victoires serrées (10-9)
        SELECT 
            player_id,
            pseudo,
            COUNT(*) as count,
            DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) as rnk
        FROM player_matches
        WHERE is_close_win
        GROUP BY player_id, pseudo
        HAVING COUNT(*) > 0
    ),
    close_losses_ranked AS (
        -- Calculer les défaites serrées (9-10)
        SELECT 
            player_id,
            pseudo,
            COUNT(*) as count,
            DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) as rnk
        FROM player_matches
        WHERE is_close_loss
        GROUP BY player_id, pseudo
        HAVING COUNT(*) > 0
    ),
    activity_stats AS (
        -- Calculer les statistiques d'activité
        SELECT 
            p.id as player_id,
            p.pseudo,
            COUNT(DISTINCT m.id) as match_count,
            MIN(m.created_at) as first_match,
            MAX(m.created_at) as last_match,
            DENSE_RANK() OVER (ORDER BY COUNT(DISTINCT m.id) DESC) as most_active_rank,
            DENSE_RANK() OVER (ORDER BY COUNT(DISTINCT m.id) ASC) as least_active_rank
        FROM players p
        LEFT JOIN match_data m ON p.id IN (
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender
        )
        WHERE NOT p.disable
        GROUP BY p.id, p.pseudo
    )
    SELECT jsonb_build_object(
        'perfect_wins', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'player_id', player_id,
                'pseudo', pseudo,
                'count', count
            ) ORDER BY count DESC, player_id)
            FROM perfect_wins_ranked
            WHERE rnk = 1
        ), '[]'::jsonb),
        'perfect_losses', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'player_id', player_id,
                'pseudo', pseudo,
                'count', count
            ) ORDER BY count DESC, player_id)
            FROM perfect_losses_ranked
            WHERE rnk = 1
        ), '[]'::jsonb),
        'close_wins', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'player_id', player_id,
                'pseudo', pseudo,
                'count', count
            ) ORDER BY count DESC, player_id)
            FROM close_wins_ranked
            WHERE rnk = 1
        ), '[]'::jsonb),
        'close_losses', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'player_id', player_id,
                'pseudo', pseudo,
                'count', count
            ) ORDER BY count DESC, player_id)
            FROM close_losses_ranked
            WHERE rnk = 1
        ), '[]'::jsonb),
        'activity', 
        -- Utilisation d'un CASE pour vérifier le critère global de 15 matchs minimum
        CASE 
            WHEN v_total_matches >= 15 THEN
                jsonb_build_object(
                    'most_active', COALESCE((
                        SELECT jsonb_agg(jsonb_build_object(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'match_count', match_count
                        ) ORDER BY match_count DESC, player_id)
                        FROM activity_stats
                        WHERE most_active_rank = 1 -- Suppression du seuil individuel
                    ), '[]'::jsonb),
                    'least_active', COALESCE((
                        SELECT jsonb_agg(jsonb_build_object(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'match_count', match_count
                        ) ORDER BY match_count ASC, player_id)
                        FROM activity_stats
                        WHERE match_count > 0 AND least_active_rank = 1
                    ), '[]'::jsonb)
                )
            ELSE NULL -- Renvoie NULL si le total est inférieur à 15 matchs
        END
    ) INTO v_result;

    RETURN v_result;
END;
$function$;

-- Étape 3: Supprimer la fonction temporaire de test si elle existe
DROP FUNCTION IF EXISTS public.get_base_match_stats_new;

-- Étape 4: Instructions pour rollback en cas de problème
/*
En cas de problème détecté, exécuter la requête suivante pour revenir à la version précédente:

DROP FUNCTION IF EXISTS public.get_base_match_stats;
ALTER FUNCTION public.get_base_match_stats_backup(date, date, date) 
  RENAME TO get_base_match_stats;
*/

-- Étape 5: Vérification post-déploiement
-- Exécuter cette requête pour vérifier le bon fonctionnement
-- SELECT get_base_match_stats(); 