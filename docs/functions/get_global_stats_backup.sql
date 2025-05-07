-- Sauvegarde de la fonction get_global_stats() du 2024-03-21

CREATE OR REPLACE FUNCTION public.get_global_stats(p_date date DEFAULT CURRENT_DATE, p_date_start date DEFAULT NULL::date, p_date_end date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    start_date DATE;
    end_date DATE;
    p_month TEXT := NULL;
BEGIN
    IF p_date IS NOT NULL THEN
        p_month := TO_CHAR(p_date, 'YYYY-MM');
    END IF;

    RETURN (
        WITH match_data AS (
            SELECT *,
                CASE WHEN score_white > score_black THEN true ELSE false END as white_won
            FROM matches m
            WHERE (
                CASE 
                    WHEN p_date_start IS NOT NULL AND p_date_end IS NOT NULL THEN
                        m.created_at BETWEEN p_date_start AND p_date_end
                    WHEN p_date IS NOT NULL THEN
                        TO_CHAR(m.created_at, 'YYYY-MM') = p_month
                    ELSE
                        TRUE
                END
            )
        ),
        pair_stats AS (
            SELECT 
                player1_id,
                player2_id,
                COUNT(*) as total_matches,
                SUM(CASE WHEN won THEN 1 ELSE 0 END) as victories,
                SUM(CASE WHEN NOT won THEN 1 ELSE 0 END) as defeats,
                (SUM(CASE WHEN won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) as bayesian_win_rate,
                (SUM(CASE WHEN NOT won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) as bayesian_loss_rate
            FROM (
                SELECT 
                    LEAST(white_attacker, white_defender) as player1_id,
                    GREATEST(white_attacker, white_defender) as player2_id,
                    white_won as won
                FROM match_data
                UNION ALL
                SELECT 
                    LEAST(black_attacker, black_defender) as player1_id,
                    GREATEST(black_attacker, black_defender) as player2_id,
                    NOT white_won as won
                FROM match_data
            ) pairs
            GROUP BY player1_id, player2_id
            HAVING COUNT(*) >= 3
        ),
        position_stats AS (
            SELECT 
                player_id,
                position,
                COUNT(*) as total_matches,
                SUM(CASE WHEN won THEN 1 ELSE 0 END) as victories,
                SUM(CASE WHEN NOT won THEN 1 ELSE 0 END) as defeats,
                (SUM(CASE WHEN won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) as bayesian_win_rate,
                (SUM(CASE WHEN NOT won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) as bayesian_loss_rate
            FROM (
                SELECT white_attacker as player_id, 'attacker' as position, white_won as won FROM match_data
                UNION ALL
                SELECT white_defender, 'defender', white_won FROM match_data
                UNION ALL
                SELECT black_attacker, 'attacker', NOT white_won FROM match_data
                UNION ALL
                SELECT black_defender, 'defender', NOT white_won FROM match_data
            ) positions
            GROUP BY player_id, position
            HAVING COUNT(*) >= 3
        ),
        pair_stats_with_pseudo AS (
            SELECT 
                ps.*,
                p1.pseudo as player1_pseudo,
                p2.pseudo as player2_pseudo
            FROM pair_stats ps
            JOIN players p1 ON ps.player1_id = p1.id
            JOIN players p2 ON ps.player2_id = p2.id
        ),
        position_stats_with_pseudo AS (
            SELECT 
                ps.*,
                p.pseudo
            FROM position_stats ps
            JOIN players p ON ps.player_id = p.id
        ),
        perfect_wins_data AS (
            SELECT 
                p.id as player_id,
                p.pseudo,
                COUNT(*) as count
            FROM players p
            JOIN match_data m ON 
                (m.score_white = 10 AND m.score_black = 0 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 10 AND m.score_white = 0 AND p.id IN (m.black_attacker, m.black_defender))
            GROUP BY p.id, p.pseudo
            HAVING COUNT(*) > 0
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        perfect_losses_data AS (
            SELECT 
                p.id as player_id,
                p.pseudo,
                COUNT(*) as count
            FROM players p
            JOIN match_data m ON 
                (m.score_white = 0 AND m.score_black = 10 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 0 AND m.score_white = 10 AND p.id IN (m.black_attacker, m.black_defender))
            GROUP BY p.id, p.pseudo
            HAVING COUNT(*) > 0
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        close_wins_data AS (
            SELECT 
                p.id as player_id,
                p.pseudo,
                COUNT(*) as count
            FROM players p
            JOIN match_data m ON 
                (m.score_white = 10 AND m.score_black = 9 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 10 AND m.score_white = 9 AND p.id IN (m.black_attacker, m.black_defender))
            GROUP BY p.id, p.pseudo
            HAVING COUNT(*) > 0
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        close_losses_data AS (
            SELECT 
                p.id as player_id,
                p.pseudo,
                COUNT(*) as count
            FROM players p
            JOIN match_data m ON 
                (m.score_white = 9 AND m.score_black = 10 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 9 AND m.score_white = 10 AND p.id IN (m.black_attacker, m.black_defender))
            GROUP BY p.id, p.pseudo
            HAVING COUNT(*) > 0
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        streaks AS (
            SELECT 
                player_id,
                MAX(win_streak) as max_win_streak,
                MAX(lose_streak) as max_lose_streak
            FROM (
                SELECT 
                    player_id,
                    SUM(CASE WHEN NOT won THEN 1 ELSE 0 END) OVER (
                        PARTITION BY player_id, win_group ORDER BY match_order
                    ) as lose_streak,
                    SUM(CASE WHEN won THEN 1 ELSE 0 END) OVER (
                        PARTITION BY player_id, lose_group ORDER BY match_order
                    ) as win_streak
                FROM (
                    SELECT 
                        player_id,
                        won,
                        match_order,
                        SUM(CASE WHEN won THEN 1 ELSE 0 END) OVER (
                            PARTITION BY player_id ORDER BY match_order
                        ) as win_group,
                        SUM(CASE WHEN NOT won THEN 1 ELSE 0 END) OVER (
                            PARTITION BY player_id ORDER BY match_order
                        ) as lose_group
                    FROM (
                        SELECT 
                            p.id as player_id,
                            ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY m.created_at) as match_order,
                            CASE 
                                WHEN p.id IN (m.white_attacker, m.white_defender) THEN m.white_won
                                ELSE NOT m.white_won
                            END as won
                        FROM players p
                        JOIN match_data m ON p.id IN (
                            m.white_attacker, m.white_defender,
                            m.black_attacker, m.black_defender
                        )
                        ORDER BY m.created_at
                    ) ordered_matches
                ) grouped_matches
            ) streak_calc
            GROUP BY player_id
        ),
        streaks_with_pseudo AS (
            SELECT 
                s.*,
                p.pseudo
            FROM streaks s
            JOIN players p ON s.player_id = p.id
        ),
        activity_stats AS (
            SELECT 
                p.id as player_id,
                p.pseudo,
                COUNT(m.*) as match_count
            FROM players p
            LEFT JOIN match_data m ON p.id IN (
                m.white_attacker, m.white_defender,
                m.black_attacker, m.black_defender
            )
            WHERE p.disable = false
            GROUP BY p.id, p.pseudo
        ),
        lunch_stats AS (
            SELECT 
                p.id as player_id,
                p.pseudo,
                COUNT(*) as total_matches,
                SUM(CASE 
                    WHEN p.id IN (m.white_attacker, m.white_defender) AND m.white_won THEN 1
                    WHEN p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won THEN 1
                    ELSE 0
                END) as victories,
                (SUM(CASE 
                    WHEN p.id IN (m.white_attacker, m.white_defender) AND m.white_won THEN 1
                    WHEN p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won THEN 1
                    ELSE 0
                END)::FLOAT + 1) / (COUNT(*) + 2) as win_rate
            FROM players p
            JOIN match_data m ON p.id IN (
                m.white_attacker, m.white_defender,
                m.black_attacker, m.black_defender
            )
            WHERE EXTRACT(HOUR FROM m.created_at) + EXTRACT(MINUTE FROM m.created_at) / 60.0 BETWEEN 12 AND 14.5
            GROUP BY p.id, p.pseudo
            HAVING COUNT(*) >= 5
        ),
        fidelity_stats AS (
            SELECT 
                p1.id as player_id,
                p1.pseudo,
                p2.id as favorite_partner_id,
                p2.pseudo as favorite_partner_pseudo,
                COUNT(*) as max_matches_with_partner,
                (SELECT COUNT(DISTINCT 
                    CASE 
                        WHEN m2.white_attacker = p1.id THEN LEAST(m2.white_attacker, m2.white_defender)
                        WHEN m2.white_defender = p1.id THEN m2.white_attacker
                        WHEN m2.black_attacker = p1.id THEN m2.black_defender
                        ELSE m2.black_attacker
                    END
                )
                FROM match_data m2
                WHERE p1.id IN (m2.white_attacker, m2.white_defender, m2.black_attacker, m2.black_defender)
                ) as total_partners,
                COUNT(*)::FLOAT / (
                    SELECT COUNT(*)
                    FROM match_data m2
                    WHERE p1.id IN (m2.white_attacker, m2.white_defender, m2.black_attacker, m2.black_defender)
                ) as fidelity_rate
            FROM players p1
            JOIN match_data m ON p1.id IN (m.white_attacker, m.white_defender, m.black_attacker, m.black_defender)
            JOIN players p2 ON 
                CASE 
                    WHEN m.white_attacker = p1.id THEN m.white_defender
                    WHEN m.white_defender = p1.id THEN m.white_attacker
                    WHEN m.black_attacker = p1.id THEN m.black_defender
                    ELSE m.black_attacker
                END = p2.id
            GROUP BY p1.id, p1.pseudo, p2.id, p2.pseudo
            HAVING COUNT(*) >= 10
        )
        SELECT JSONB_BUILD_OBJECT(
            'best_pair', (
                SELECT JSONB_BUILD_OBJECT(
                    'player1_id', player1_id,
                    'player2_id', player2_id,
                    'player1_pseudo', player1_pseudo,
                    'player2_pseudo', player2_pseudo,
                    'victories', victories,
                    'total_matches', total_matches,
                    'win_rate', bayesian_win_rate
                )
                FROM pair_stats_with_pseudo
                ORDER BY bayesian_win_rate DESC, total_matches DESC
                LIMIT 1
            ),
            'worst_pair', (
                SELECT JSONB_BUILD_OBJECT(
                    'player1_id', player1_id,
                    'player2_id', player2_id,
                    'player1_pseudo', player1_pseudo,
                    'player2_pseudo', player2_pseudo,
                    'victories', victories,
                    'defeats', defeats,
                    'total_matches', total_matches,
                    'win_rate', bayesian_win_rate,
                    'loss_rate', bayesian_loss_rate
                )
                FROM pair_stats_with_pseudo
                ORDER BY bayesian_loss_rate DESC, total_matches DESC
                LIMIT 1
            ),
            'perfect_wins', (
                SELECT ROW_TO_JSON(perfect_wins_data.*)
                FROM perfect_wins_data
                LIMIT 1
            ),
            'perfect_losses', (
                SELECT ROW_TO_JSON(perfect_losses_data.*)
                FROM perfect_losses_data
                LIMIT 1
            ),
            'close_wins', (
                SELECT ROW_TO_JSON(close_wins_data.*)
                FROM close_wins_data
                LIMIT 1
            ),
            'close_losses', (
                SELECT ROW_TO_JSON(close_losses_data.*)
                FROM close_losses_data
                LIMIT 1
            ),
            'streaks', (
                SELECT JSONB_BUILD_OBJECT(
                    'longest_win_streak', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'streak', max_win_streak
                        )
                        FROM streaks_with_pseudo
                        ORDER BY max_win_streak DESC
                        LIMIT 1
                    ),
                    'longest_lose_streak', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'streak', max_lose_streak
                        )
                        FROM streaks_with_pseudo
                        ORDER BY max_lose_streak DESC
                        LIMIT 1
                    )
                )
            ),
            'positions', (
                SELECT JSONB_BUILD_OBJECT(
                    'best_attacker', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'victories', victories,
                            'total_matches', total_matches,
                            'win_rate', bayesian_win_rate
                        )
                        FROM position_stats_with_pseudo
                        WHERE position = 'attacker'
                        ORDER BY bayesian_win_rate DESC, total_matches DESC
                        LIMIT 1
                    ),
                    'worst_attacker', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'victories', victories,
                            'defeats', defeats,
                            'total_matches', total_matches,
                            'win_rate', bayesian_win_rate,
                            'loss_rate', bayesian_loss_rate
                        )
                        FROM position_stats_with_pseudo
                        WHERE position = 'attacker'
                        ORDER BY bayesian_loss_rate DESC, total_matches DESC
                        LIMIT 1
                    ),
                    'best_defender', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'victories', victories,
                            'total_matches', total_matches,
                            'win_rate', bayesian_win_rate
                        )
                        FROM position_stats_with_pseudo
                        WHERE position = 'defender'
                        ORDER BY bayesian_win_rate DESC, total_matches DESC
                        LIMIT 1
                    ),
                    'worst_defender', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'victories', victories,
                            'defeats', defeats,
                            'total_matches', total_matches,
                            'win_rate', bayesian_win_rate,
                            'loss_rate', bayesian_loss_rate
                        )
                        FROM position_stats_with_pseudo
                        WHERE position = 'defender'
                        ORDER BY bayesian_loss_rate DESC, total_matches DESC
                        LIMIT 1
                    )
                )
            ),
            'activity', (
                SELECT JSONB_BUILD_OBJECT(
                    'most_active', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'match_count', match_count
                        )
                        FROM activity_stats
                        ORDER BY match_count DESC
                        LIMIT 1
                    ),
                    'least_active', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'match_count', match_count
                        )
                        FROM activity_stats
                        ORDER BY match_count ASC
                        LIMIT 1
                    )
                )
            ),
            'fun_stats', (
                SELECT JSONB_BUILD_OBJECT(
                    'le_dessert', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'victories', victories,
                            'total_matches', total_matches,
                            'win_rate', win_rate
                        )
                        FROM lunch_stats
                        ORDER BY win_rate DESC
                        LIMIT 1
                    ),
                    'le_fidele', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'favorite_partner_id', favorite_partner_id,
                            'favorite_partner_pseudo', favorite_partner_pseudo,
                            'max_matches_with_partner', max_matches_with_partner,
                            'total_partners', total_partners,
                            'fidelity_rate', fidelity_rate
                        )
                        FROM fidelity_stats
                        ORDER BY fidelity_rate DESC
                        LIMIT 1
                    ),
                    'le_casanova', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'distinct_partners', distinct_partners,
                            'total_matches', total_matches,
                            'partner_change_rate', partner_change_rate
                        )
                        FROM (
                            SELECT 
                                p.id as player_id,
                                p.pseudo,
                                COUNT(DISTINCT 
                                    CASE 
                                        WHEN m.white_attacker = p.id THEN m.white_defender
                                        WHEN m.white_defender = p.id THEN m.white_attacker
                                        WHEN m.black_attacker = p.id THEN m.black_defender
                                        ELSE m.black_attacker
                                    END
                                ) as distinct_partners,
                                COUNT(*) as total_matches,
                                COUNT(DISTINCT 
                                    CASE 
                                        WHEN m.white_attacker = p.id THEN m.white_defender
                                        WHEN m.white_defender = p.id THEN m.white_attacker
                                        WHEN m.black_attacker = p.id THEN m.black_defender
                                        ELSE m.black_attacker
                                    END
                                )::FLOAT / COUNT(*) as partner_change_rate
                            FROM players p
                            JOIN match_data m ON p.id IN (
                                m.white_attacker, m.white_defender,
                                m.black_attacker, m.black_defender
                            )
                            GROUP BY p.id, p.pseudo
                            HAVING COUNT(*) >= 10
                            ORDER BY partner_change_rate DESC
                            LIMIT 1
                        ) casanova_stats
                    ),
                    'first_blood', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'victories', victories,
                            'total_first_matches', total_first_matches,
                            'win_rate', win_rate
                        )
                        FROM (
                            SELECT 
                                p.id as player_id,
                                p.pseudo,
                                COUNT(*) as total_first_matches,
                                SUM(CASE 
                                    WHEN p.id IN (m.white_attacker, m.white_defender) AND m.white_won THEN 1
                                    WHEN p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won THEN 1
                                    ELSE 0
                                END) as victories,
                                (SUM(CASE 
                                    WHEN p.id IN (m.white_attacker, m.white_defender) AND m.white_won THEN 1
                                    WHEN p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won THEN 1
                                    ELSE 0
                                END)::FLOAT + 1) / (COUNT(*) + 2) as win_rate
                            FROM players p
                            JOIN match_data m ON p.id IN (
                                m.white_attacker, m.white_defender,
                                m.black_attacker, m.black_defender
                            )
                            WHERE m.id IN (
                                SELECT DISTINCT ON (DATE_TRUNC('week', created_at)) id
                                FROM match_data
                                WHERE EXTRACT(DOW FROM created_at) = 1
                                ORDER BY DATE_TRUNC('week', created_at), created_at
                            )
                            GROUP BY p.id, p.pseudo
                            HAVING COUNT(*) >= 3
                            ORDER BY win_rate DESC
                            LIMIT 1
                        ) first_blood_stats
                    ),
                    'le_revenger', (
                        SELECT JSONB_BUILD_OBJECT(
                            'player_id', player_id,
                            'pseudo', pseudo,
                            'total_revenge_matches', total_revenge_matches,
                            'revenge_rate', revenge_rate
                        )
                        FROM (
                            WITH revenge_opportunities AS (
                                SELECT 
                                    m1.id as first_match,
                                    m2.id as revenge_match,
                                    CASE 
                                        WHEN p.id IN (m1.white_attacker, m1.white_defender) THEN NOT m1.white_won
                                        ELSE m1.white_won
                                    END as lost_first,
                                    CASE 
                                        WHEN p.id IN (m2.white_attacker, m2.white_defender) THEN m2.white_won
                                        ELSE NOT m2.white_won
                                    END as won_revenge,
                                    p.id as player_id,
                                    p.pseudo
                                FROM players p
                                JOIN match_data m1 ON p.id IN (
                                    m1.white_attacker, m1.white_defender,
                                    m1.black_attacker, m1.black_defender
                                )
                                JOIN match_data m2 ON m2.created_at > m1.created_at
                                    AND (
                                        (m1.white_attacker IN (m2.black_attacker, m2.black_defender) AND
                                         m1.white_defender IN (m2.black_attacker, m2.black_defender) AND
                                         m1.black_attacker IN (m2.white_attacker, m2.white_defender) AND
                                         m1.black_defender IN (m2.white_attacker, m2.white_defender))
                                        OR
                                        (m1.white_attacker IN (m2.white_attacker, m2.white_defender) AND
                                         m1.white_defender IN (m2.white_attacker, m2.white_defender) AND
                                         m1.black_attacker IN (m2.black_attacker, m2.black_defender) AND
                                         m1.black_defender IN (m2.black_attacker, m2.black_defender))
                                    )
                            )
                            SELECT 
                                player_id,
                                pseudo,
                                COUNT(*) as total_revenge_matches,
                                SUM(CASE WHEN lost_first AND won_revenge THEN 1 ELSE 0 END)::FLOAT / 
                                NULLIF(SUM(CASE WHEN lost_first THEN 1 ELSE 0 END), 0) as revenge_rate
                            FROM revenge_opportunities
                            GROUP BY player_id, pseudo
                            HAVING COUNT(*) >= 2
                            ORDER BY revenge_rate DESC NULLS LAST
                            LIMIT 1
                        ) revenge_stats
                    ),
                    'les_classicos', (
                        SELECT JSONB_BUILD_OBJECT(
                            'team1_player1', LEAST(white_attacker, white_defender),
                            'team1_player2', GREATEST(white_attacker, white_defender),
                            'team2_player1', LEAST(black_attacker, black_defender),
                            'team2_player2', GREATEST(black_attacker, black_defender),
                            'team1_player1_pseudo', (SELECT pseudo FROM players WHERE id = LEAST(white_attacker, white_defender)),
                            'team1_player2_pseudo', (SELECT pseudo FROM players WHERE id = GREATEST(white_attacker, white_defender)),
                            'team2_player1_pseudo', (SELECT pseudo FROM players WHERE id = LEAST(black_attacker, black_defender)),
                            'team2_player2_pseudo', (SELECT pseudo FROM players WHERE id = GREATEST(black_attacker, black_defender)),
                            'total_matches', COUNT(*),
                            'team1_victories', SUM(CASE WHEN white_won THEN 1 ELSE 0 END),
                            'team2_victories', SUM(CASE WHEN NOT white_won THEN 1 ELSE 0 END)
                        )
                        FROM (
                            SELECT 
                                white_attacker,
                                white_defender,
                                black_attacker,
                                black_defender,
                                white_won,
                                COUNT(*) OVER (
                                    PARTITION BY 
                                        LEAST(white_attacker, white_defender),
                                        GREATEST(white_attacker, white_defender),
                                        LEAST(black_attacker, black_defender),
                                        GREATEST(black_attacker, black_defender)
                                ) as match_count
                            FROM match_data
                        ) team_matches
                        WHERE match_count >= 3
                        GROUP BY 
                            white_attacker, white_defender,
                            black_attacker, black_defender
                        ORDER BY COUNT(*) DESC
                        LIMIT 1
                    )
                )
            )
        )
    );
END;
$function$; 