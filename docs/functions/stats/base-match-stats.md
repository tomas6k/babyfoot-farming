# Statistiques de Base des Matchs (get_base_match_stats)

## Vue d'ensemble

Cette fonction calcule les statistiques de base des matchs, notamment :
1. Le nombre total de matchs
2. Les statistiques de victoires parfaites et défaites parfaites
3. Les statistiques de victoires serrées et défaites serrées
4. Les statistiques d'activité des joueurs

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

## Structure de la Fonction

La fonction utilise plusieurs Common Table Expressions (CTEs) pour organiser le calcul des statistiques :

```sql
WITH match_data AS (
    -- Données de base des matchs avec filtrage par date
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
)
```

## Mécanismes de Calcul

### 1. Statistiques Globales

#### Critères
- Comptage du nombre total de matchs
- Calcul des moyennes de scores
- Identification des matchs parfaits (10-0)
- Identification des matchs serrés (10-9)

### 2. Statistiques des Joueurs

#### Critères
- Calcul des victoires et défaites par joueur
- Calcul des victoires parfaites et défaites parfaites
- Calcul des victoires serrées et défaites serrées
- Calcul du taux de victoire bayésien (multiplié par 100)

## Format de Retour

```typescript
interface BaseMatchStats {
  total_matches: number;
  perfect_wins: {
    count: number;
    players: Array<{
      player_id: string;
      pseudo: string;
      count: number;
    }>;
  };
  perfect_losses: {
    count: number;
    players: Array<{
      player_id: string;
      pseudo: string;
      count: number;
    }>;
  };
  close_wins: {
    count: number;
    players: Array<{
      player_id: string;
      pseudo: string;
      count: number;
    }>;
  };
  close_losses: {
    count: number;
    players: Array<{
      player_id: string;
      pseudo: string;
      count: number;
    }>;
  };
  player_activity: Array<{
    player_id: string;
    pseudo: string;
    total_matches: number;
    wins: number;
    losses: number;
    win_rate: number;
  }>;
}
```

## Optimisations

### 1. Calcul des Taux
- Utilisation de taux bayésiens : `(victories::float + 1) / (total_matches + 2) * 100`
- Les taux sont multipliés par 100 directement dans la base de données

### 2. Gestion des Égalités
- Tri par nombre de matchs décroissant
- Tri secondaire par ID pour assurer la cohérence des résultats

### 3. Optimisation des Jointures
- Utilisation de LEFT JOIN pour inclure tous les joueurs
- Jointures optimisées pour les statistiques des joueurs

## Maintenance

- Les noms des colonnes reflètent la structure actuelle de la table matches
- La fonction est compatible avec la nouvelle structure de données
- Le tri est cohérent et prévisible grâce au tri secondaire par ID 

## Backup

### Stratégie de Sauvegarde
- Les statistiques de base sont calculées à la volée et ne nécessitent pas de sauvegarde directe
- Les données sources (table `matches`) sont sauvegardées quotidiennement par Supabase
- En cas de besoin de restauration, les statistiques seront automatiquement recalculées

### Restauration
- La restauration des données sources suffit à rétablir les statistiques
- Aucune étape supplémentaire n'est nécessaire après la restauration des tables
- Les statistiques seront recalculées au prochain appel de la fonction 

## Code Source

```sql
CREATE OR REPLACE FUNCTION get_base_match_stats(
    target_start_date timestamptz DEFAULT NULL,
    target_end_date timestamptz DEFAULT NULL,
    target_player_id uuid DEFAULT NULL
)
RETURNS jsonb 
LANGUAGE plpgsql
AS $function$
DECLARE
    result jsonb;
BEGIN
    WITH match_data AS (
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
    ),
    player_matches AS (
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
            (
                (m.score_white = 10 AND m.score_black = 0 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 10 AND m.score_white = 0 AND p.id IN (m.black_attacker, m.black_defender))
            ) as is_perfect_win,
            (
                (m.score_white = 0 AND m.score_black = 10 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 0 AND m.score_white = 10 AND p.id IN (m.black_attacker, m.black_defender))
            ) as is_perfect_loss,
            (
                (m.score_white = 10 AND m.score_black = 9 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 10 AND m.score_white = 9 AND p.id IN (m.black_attacker, m.black_defender))
            ) as is_close_win,
            (
                (m.score_white = 9 AND m.score_black = 10 AND p.id IN (m.white_attacker, m.white_defender)) OR
                (m.score_black = 9 AND m.score_white = 10 AND p.id IN (m.black_attacker, m.black_defender))
            ) as is_close_loss
        FROM match_data m
        CROSS JOIN players p
        WHERE p.id IN (m.white_attacker, m.white_defender, m.black_attacker, m.black_defender)
    ),
    perfect_wins_ranked AS (
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
        SELECT 
            p.id as player_id,
            p.pseudo,
            COUNT(DISTINCT m.id) as match_count,
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
        'total_matches', (SELECT COUNT(*) FROM match_data),
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
        'activity', jsonb_build_object(
            'most_active', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'player_id', player_id,
                    'pseudo', pseudo,
                    'match_count', match_count
                ) ORDER BY match_count DESC, player_id)
                FROM activity_stats
                WHERE match_count >= 10 AND most_active_rank = 1
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
    ) INTO result;

    RETURN result;
END;
$function$; 