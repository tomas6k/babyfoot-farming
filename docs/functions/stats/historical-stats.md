# Statistiques Historiques (get_historical_stats)

## Vue d'ensemble

Cette fonction calcule les statistiques qui nécessitent une analyse temporelle approfondie et des critères spécifiques liés à des périodes ou des motifs de jeu particuliers, notamment :
1. Le Premier Sang (Premier Match du Lundi)
2. Les Classicos (Affrontements Récurrents)
3. Le Fidèle (Partenaire Préféré)
4. Le Casanova (Changement de Partenaires)
5. Le Dessert (Matchs entre 12h et 14h30 heure francaise)
6. Le Dessert Looser (Matchs entre 12h et 14h30 heure francaise)
7. Le Comte de Monte-Cristo (Meilleur Vengeur)

### 1. Le Premier Sang (Premier Match du Lundi)

#### Critères
- Premier match de chaque lundi
- Minimum 2 premiers matchs
- Utilisation de taux bayésiens
- Affiche uniquement le(s) joueur(s) avec le meilleur taux de victoire
- En cas d'égalité, tous les joueurs ayant le même taux sont affichés
- Tri secondaire par nombre de matchs puis par ID

### 2. Les Classicos (Affrontements Récurrents)

#### Critères
- Minimum 5 matchs entre les mêmes équipes
- Peu importe la position des joueurs dans l'équipe
- Normalisation de l'ordre des équipes
- Affiche uniquement les 3 paires d'équipes ayant joué le plus de matchs ensemble
- Tri par nombre total de matchs décroissant
- En cas d'égalité, tri par nombre total de victoires puis par ID d'équipe

### 3. Le Fidèle (Partenaire Préféré)

#### Critères
- Au moins 20 matchs joués sur la période (total pour tous les joueurs)
- Calcul du taux de fidélité pour tous les joueurs sans minimum de matchs
- Identification du partenaire favori pour chaque joueur
- Affiche tous les joueurs avec leur taux de fidélité
- Tri par taux de fidélité décroissant
- En cas d'égalité, tri secondaire par nombre de matchs ensemble puis par ID

### 4. Le Casanova (Changement de Partenaires)

#### Critères
- Au moins 20 matchs joués sur la période (total pour tous les joueurs)
- Calcul du taux de changement pour tous les joueurs sans minimum de matchs
- Comptage des partenaires uniques pour chaque joueur
- Affiche tous les joueurs avec leur taux de changement
- Tri par taux de changement décroissant
- En cas d'égalité, tri secondaire par nombre de partenaires distincts puis par ID

### 5. Le Dessert (Matchs entre 12h et 14h30 heure francaise)

#### Critères
- Matchs entre 12h et 14h30 heure francaise
- Minimum 5 matchs sur cette période
- Utilisation de taux bayésiens
- Affiche uniquement le(s) joueur(s) avec le meilleur taux de victoire
- En cas d'égalité, tous les joueurs ayant le même taux sont affichés
- Tri secondaire par nombre de matchs puis par ID

### 6. Le Dessert Looser (Matchs entre 12h et 14h30 heure francaise)

#### Critères
- Matchs entre 12h et 14h30 heure francaise
- Minimum 5 matchs sur cette période
- Utilisation de taux bayésiens basé sur la défaite
- Affiche uniquement le(s) joueur(s) avec le meilleur taux de défaite
- En cas d'égalité, tous les joueurs ayant le même taux sont affichés
- Tri secondaire par nombre de matchs puis par ID

### 7. Le Comte de Monte-Cristo (Meilleur Vengeur)

#### Critères
- Minimum 1 victoire provenant d'une opportunité de revanche
- Une revanche est considérée comme le match suivant contre la même équipe après une défaite
- Calcul du taux de revanche réussie avec ajustement bayésien
- Affiche uniquement le(s) joueur(s) avec le meilleur taux de revanche
- En cas d'égalité, tous les joueurs ayant le même taux sont affichés
- Tri secondaire par nombre d'opportunités puis par ID

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

## Mécanismes de Calcul


## Format de Retour

```typescript
interface HistoricalStats {
  first_blood: Array<{
    player_id: string;
    pseudo: string;
    total_first_matches: number;
    victories: number;
    win_rate: number;
  }>;
  classicos: Array<{
    team1: {
      player1_id: string;
      player2_id: string;
      player1_pseudo: string;
      player2_pseudo: string;
      victories: number;
    };
    team2: {
      player1_id: string;
      player2_id: string;
      player1_pseudo: string;
      player2_pseudo: string;
      victories: number;
    };
    total_matches: number;
  }>;
  fidele: Array<{
    player_id: string;
    pseudo: string;
    favorite_partner_id: string;
    favorite_partner_pseudo: string;
    matches_together: number;
    victories_together: number;
    total_matches: number;
    fidelity_rate: number;
  }>;
  casanova: Array<{
    player_id: string;
    pseudo: string;
    distinct_partners: number;
    total_matches: number;
    partner_change_rate: number;
  }>;
  dessert: Array<{
    player_id: string;
    pseudo: string;
    total_matches: number;
    victories: number;
    win_rate: number;
  }>;
  dessert_looser: Array<{
    player_id: string;
    pseudo: string;
    total_matches: number;
    defeats: number;
    loss_rate: number;
  }>;
  monte_cristo: Array<{
    player_id: string;
    pseudo: string;
    revenge_wins: number;
    revenge_opportunities: number;
    revenge_rate: number;
  }>;
}
```

## Optimisations

### 1. Table Temporaire
- Utilisation d'une table temporaire `temp_match_data` pour améliorer les performances
- La table est automatiquement supprimée à la fin de la transaction
- Ajout d'un index sur les dates des matchs pour optimiser les calculs de revanche

### 2. Calcul des Taux
- Utilisation de taux bayésiens : `(victories::float + 1) / (total_matches + 2) * 100`
- Les taux sont multipliés par 100 directement dans la base de données
- Pour les revanches : `(revenge_wins::float + 1) / (revenge_opportunities + 2) * 100`

### 3. Gestion des Égalités
- Utilisation de `DENSE_RANK()` pour inclure tous les joueurs/équipes à égalité
- Tri secondaire par ID pour assurer la cohérence des résultats

### 4. Indexation
- Index sur les dates pour les matchs du lundi et du déjeuner
- Index sur les combinaisons de joueurs pour les équipes et partenariats

## Maintenance

- Les noms des colonnes reflètent la structure actuelle de la table matches
- La fonction est compatible avec la nouvelle structure de données
- Les résultats incluent tous les joueurs à égalité pour chaque catégorie
- Le tri est cohérent et prévisible grâce au tri secondaire par ID

## Backup avant modification

### Implémentation originale de la fonction partnership_stats et fidele_stats

```sql
partnership_stats AS (
    SELECT 
        ps.player_id,
        ps.pseudo,
        p2.id as partner_id,
        p2.pseudo as partner_pseudo,
        COUNT(*) as matches_together,
        SUM(CASE 
            WHEN (ps.player_id IN (m.white_attacker, m.white_defender) AND 
                  p2.id IN (m.white_attacker, m.white_defender) AND 
                  m.white_won) OR
                 (ps.player_id IN (m.black_attacker, m.black_defender) AND 
                  p2.id IN (m.black_attacker, m.black_defender) AND 
                  NOT m.white_won)
            THEN 1 
            ELSE 0 
        END) as victories_together,
        COUNT(DISTINCT CASE 
            WHEN ps.player_id IN (m.white_attacker, m.white_defender) THEN
                CASE 
                    WHEN ps.player_id = m.white_attacker THEN m.white_defender
                    ELSE m.white_attacker
                END
            ELSE
                CASE 
                    WHEN ps.player_id = m.black_attacker THEN m.black_defender
                    ELSE m.black_attacker
                END
        END) as distinct_partners,
        ps.total_matches
    FROM player_stats ps
    JOIN temp_match_data m ON ps.player_id IN (
        m.white_attacker, m.white_defender,
        m.black_attacker, m.black_defender
    )
    JOIN players p2 ON p2.id IN (
        m.white_attacker, m.white_defender,
        m.black_attacker, m.black_defender
    ) AND p2.id != ps.player_id
    GROUP BY ps.player_id, ps.pseudo, p2.id, p2.pseudo, ps.total_matches
),
fidele_stats AS (
    SELECT DISTINCT ON (player_id)
        player_id,
        pseudo,
        partner_id as favorite_partner_id,
        partner_pseudo as favorite_partner_pseudo,
        matches_together,
        victories_together,
        total_matches,
        (matches_together::float / total_matches * 100) as fidelity_rate
    FROM partnership_stats
    ORDER BY player_id, matches_together DESC
)
```

## Correction appliquée

### Nouvelle implémentation de partnership_stats

La fonction `partnership_stats` a été modifiée pour ne prendre en compte que les partenaires (joueurs de la même équipe) et non les adversaires. Voici les principales modifications :

1. Création d'une table temporaire `team_pairs` qui génère explicitement une ligne pour chaque paire de joueurs dans la même équipe
2. Utilisation de cette table pour joindre les joueurs uniquement avec leurs partenaires
3. Simplification du calcul des victoires ensemble
4. Séparation du calcul du nombre de partenaires distincts dans une CTE dédiée

```sql
-- Nouvelle implémentation qui ne prend en compte que les partenaires
partnership_stats AS (
    SELECT 
        ps.player_id,
        ps.pseudo,
        partner.id as partner_id,
        partner.pseudo as partner_pseudo,
        COUNT(*) as matches_together,
        SUM(CASE 
            WHEN (is_white AND m.white_won) OR (NOT is_white AND NOT m.white_won)
            THEN 1 
            ELSE 0 
        END) as victories_together,
        ps.total_matches
    FROM player_stats ps
    JOIN (
        -- Pour chaque match, générer une ligne pour chaque paire de joueurs dans la même équipe
        SELECT 
            m.id as match_id,
            m.white_won,
            p1.id as player1_id,
            p2.id as player2_id,
            TRUE as is_white
        FROM temp_match_data m
        JOIN players p1 ON p1.id = m.white_attacker
        JOIN players p2 ON p2.id = m.white_defender
        
        UNION ALL
        
        SELECT 
            m.id as match_id,
            m.white_won,
            p1.id as player1_id,
            p2.id as player2_id,
            FALSE as is_white
        FROM temp_match_data m
        JOIN players p1 ON p1.id = m.black_attacker
        JOIN players p2 ON p2.id = m.black_defender
    ) team_pairs ON (ps.player_id = team_pairs.player1_id OR ps.player_id = team_pairs.player2_id)
    JOIN temp_match_data m ON m.id = team_pairs.match_id
    JOIN players partner ON 
        (team_pairs.player1_id = ps.player_id AND team_pairs.player2_id = partner.id) OR
        (team_pairs.player2_id = ps.player_id AND team_pairs.player1_id = partner.id)
    GROUP BY ps.player_id, ps.pseudo, partner.id, partner.pseudo, ps.total_matches
),
-- Compte le nombre total de partenaires distincts pour chaque joueur
distinct_partners_count AS (
    SELECT
        player_id,
        COUNT(DISTINCT partner_id) as distinct_partners
    FROM partnership_stats
    GROUP BY player_id
)
```

Cela garantit que seuls les véritables partenaires sont pris en compte pour les statistiques "Le Fidèle" et "L'esclave", ce qui donne des résultats plus précis.

## Backup

### Stratégie de Sauvegarde
- Les statistiques historiques sont calculées à la volée et ne nécessitent pas de sauvegarde directe
- Les données sources (tables `matches` et `players`) sont sauvegardées quotidiennement par Supabase
- Les calculs temporels sont reconstruits à chaque appel, assurant leur exactitude

### Restauration
- La restauration des données sources suffit à rétablir toutes les statistiques historiques
- Les calculs temporels seront automatiquement reconstruits lors du prochain appel
- Aucune intervention manuelle n'est nécessaire pour la reconstruction des statistiques

### Points d'Attention
- Les calculs temporels sont sensibles à l'intégrité des dates des matchs
- Vérifier la cohérence des fuseaux horaires après une restauration
- S'assurer que tous les matchs ont été correctement restaurés pour maintenir la précision des statistiques
- Pour les revanches, l'ordre chronologique des matchs est crucial

## Code Source

```sql
CREATE OR REPLACE FUNCTION public.get_historical_stats(
    p_target_player_id uuid DEFAULT NULL::uuid, 
    p_target_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, 
    p_target_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    result jsonb;
BEGIN
    WITH temp_match_data AS (
        SELECT 
            m.*,
            CASE 
                WHEN m.score_white > m.score_black THEN true 
                ELSE false 
            END as white_won,
            m.created_at AT TIME ZONE 'Europe/Paris' as local_date,
            m.date AT TIME ZONE 'Europe/Paris' as local_game_date
        FROM matches m
        WHERE (p_target_start_date IS NULL OR m.created_at >= p_target_start_date)
        AND (p_target_end_date IS NULL OR m.created_at < p_target_end_date)
        AND (p_target_player_id IS NULL OR 
            p_target_player_id IN (
                m.white_attacker, m.white_defender,
                m.black_attacker, m.black_defender
            ))
        ORDER BY m.created_at
    ),
    -- Premier match du lundi avec gestion des égalités
    first_blood_stats AS (
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
            END)::FLOAT + 1) / (COUNT(*) + 2) * 100 as win_rate,
            DENSE_RANK() OVER (
                ORDER BY (SUM(CASE 
                    WHEN p.id IN (m.white_attacker, m.white_defender) AND m.white_won THEN 1
                    WHEN p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won THEN 1
                    ELSE 0
                END)::FLOAT + 1) / (COUNT(*) + 2) DESC, 
                COUNT(*) DESC
            ) as rnk
        FROM players p
        JOIN temp_match_data m ON p.id IN (
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender
        )
        WHERE EXTRACT(DOW FROM m.local_game_date) = 1  -- 1 = Lundi dans PostgreSQL
        GROUP BY p.id, p.pseudo
        HAVING COUNT(*) >= 1
    ),
    -- Dessert avec gestion des égalités
    dessert_stats AS (
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
            END)::FLOAT + 1) / (COUNT(*) + 2) * 100 as win_rate,
            DENSE_RANK() OVER (
                ORDER BY (SUM(CASE 
                    WHEN p.id IN (m.white_attacker, m.white_defender) AND m.white_won THEN 1
                    WHEN p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won THEN 1
                    ELSE 0
                END)::FLOAT + 1) / (COUNT(*) + 2) DESC, 
                COUNT(*) DESC
            ) as rnk
        FROM players p
        JOIN temp_match_data m ON p.id IN (
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender
        )
        WHERE EXTRACT(HOUR FROM m.local_game_date) BETWEEN 12 AND 14
        AND (
            EXTRACT(HOUR FROM m.local_game_date) < 14 OR
            (EXTRACT(HOUR FROM m.local_game_date) = 14 AND
             EXTRACT(MINUTE FROM m.local_game_date) <= 30)
        )
        GROUP BY p.id, p.pseudo
        HAVING COUNT(*) >= 2
    ),
    -- Dessert looser avec gestion des égalités
    dessert_looser_stats AS (
        SELECT 
            p.id as player_id,
            p.pseudo,
            COUNT(*) as total_matches,
            SUM(CASE 
                WHEN p.id IN (m.white_attacker, m.white_defender) AND NOT m.white_won THEN 1
                WHEN p.id IN (m.black_attacker, m.black_defender) AND m.white_won THEN 1
                ELSE 0
            END) as defeats,
            (SUM(CASE 
                WHEN p.id IN (m.white_attacker, m.white_defender) AND NOT m.white_won THEN 1
                WHEN p.id IN (m.black_attacker, m.black_defender) AND m.white_won THEN 1
                ELSE 0
            END)::FLOAT + 1) / (COUNT(*) + 2) * 100 as loss_rate,
            DENSE_RANK() OVER (
                ORDER BY (SUM(CASE 
                    WHEN p.id IN (m.white_attacker, m.white_defender) AND NOT m.white_won THEN 1
                    WHEN p.id IN (m.black_attacker, m.black_defender) AND m.white_won THEN 1
                    ELSE 0
                END)::FLOAT + 1) / (COUNT(*) + 2) DESC, 
                COUNT(*) DESC
            ) as rnk
        FROM players p
        JOIN temp_match_data m ON p.id IN (
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender
        )
        WHERE EXTRACT(HOUR FROM m.local_game_date) BETWEEN 12 AND 14
        AND (
            EXTRACT(HOUR FROM m.local_game_date) < 14 OR
            (EXTRACT(HOUR FROM m.local_game_date) = 14 AND
             EXTRACT(MINUTE FROM m.local_game_date) <= 30)
        )
        GROUP BY p.id, p.pseudo
        HAVING COUNT(*) >= 2
    ),
    player_stats AS (
        SELECT 
            p.id as player_id,
            p.pseudo,
            COUNT(*) as total_matches,
            SUM(CASE 
                WHEN (p.id IN (m.white_attacker, m.white_defender) AND m.white_won) OR
                     (p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won)
                THEN 1 
                ELSE 0 
            END) as victories
        FROM players p
        JOIN temp_match_data m ON p.id IN (
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender
        )
        GROUP BY p.id, p.pseudo
        HAVING COUNT(*) >= 10
    ),
    partnership_stats AS (
        SELECT 
            ps.player_id,
            ps.pseudo,
            partner.id as partner_id,
            partner.pseudo as partner_pseudo,
            COUNT(*) as matches_together,
            SUM(CASE 
                WHEN (is_white AND m.white_won) OR (NOT is_white AND NOT m.white_won)
                THEN 1 
                ELSE 0 
            END) as victories_together,
            ps.total_matches
        FROM player_stats ps
        JOIN (
            SELECT 
                m.id as match_id,
                m.white_won,
                p1.id as player1_id,
                p2.id as player2_id,
                TRUE as is_white
            FROM temp_match_data m
            JOIN players p1 ON p1.id = m.white_attacker
            JOIN players p2 ON p2.id = m.white_defender
            
            UNION ALL
            
            SELECT 
                m.id as match_id,
                m.white_won,
                p1.id as player1_id,
                p2.id as player2_id,
                FALSE as is_white
            FROM temp_match_data m
            JOIN players p1 ON p1.id = m.black_attacker
            JOIN players p2 ON p2.id = m.black_defender
        ) team_pairs ON (ps.player_id = team_pairs.player1_id OR ps.player_id = team_pairs.player2_id)
        JOIN temp_match_data m ON m.id = team_pairs.match_id
        JOIN players partner ON 
            (team_pairs.player1_id = ps.player_id AND team_pairs.player2_id = partner.id) OR
            (team_pairs.player2_id = ps.player_id AND team_pairs.player1_id = partner.id)
        GROUP BY ps.player_id, ps.pseudo, partner.id, partner.pseudo, ps.total_matches
    ),
    distinct_partners_count AS (
        SELECT
            player_id,
            COUNT(DISTINCT partner_id) as distinct_partners
        FROM partnership_stats
        GROUP BY player_id
    ),
    -- Fidèle avec gestion des égalités
    fidele_stats AS (
        SELECT
            ps.player_id,
            ps.pseudo,
            favorite.partner_id as favorite_partner_id,
            favorite.partner_pseudo as favorite_partner_pseudo,
            favorite.matches_together,
            favorite.victories_together,
            ps.total_matches,
            (favorite.matches_together::float / ps.total_matches * 100) as fidelity_rate,
            DENSE_RANK() OVER (
                ORDER BY (favorite.matches_together::float / ps.total_matches) DESC,
                favorite.matches_together DESC
            ) as rnk
        FROM player_stats ps
        JOIN LATERAL (
            SELECT partner_id, partner_pseudo, matches_together, victories_together
            FROM partnership_stats
            WHERE player_id = ps.player_id
            ORDER BY matches_together DESC
            LIMIT 1
        ) favorite ON true
    ),
    -- Casanova avec gestion des égalités
    casanova_stats AS (
        SELECT
            ps.player_id,
            ps.pseudo,
            dpc.distinct_partners,
            ps.total_matches,
            (dpc.distinct_partners::float / ps.total_matches * 100) as partner_change_rate,
            DENSE_RANK() OVER (
                ORDER BY (dpc.distinct_partners::float / ps.total_matches) DESC,
                dpc.distinct_partners DESC
            ) as rnk
        FROM player_stats ps
        JOIN distinct_partners_count dpc ON ps.player_id = dpc.player_id
    ),
    team_matches AS (
        SELECT 
            LEAST(m.white_attacker, m.white_defender) as t1p1,
            GREATEST(m.white_attacker, m.white_defender) as t1p2,
            LEAST(m.black_attacker, m.black_defender) as t2p1,
            GREATEST(m.black_attacker, m.black_defender) as t2p2,
            m.white_won
        FROM temp_match_data m
    ),
    -- Classicos avec gestion des égalités
    classico_stats AS (
        SELECT 
            t1p1, t1p2, t2p1, t2p2,
            COUNT(*) as total_matches,
            SUM(CASE WHEN white_won THEN 1 ELSE 0 END) as team1_wins,
            SUM(CASE WHEN NOT white_won THEN 1 ELSE 0 END) as team2_wins,
            DENSE_RANK() OVER (
                ORDER BY COUNT(*) DESC
            ) as rnk
        FROM team_matches
        GROUP BY t1p1, t1p2, t2p1, t2p2
        HAVING COUNT(*) >= 5
    ),
    -- Le Comte de Monte-Cristo (revenge_stats) avec ajout du classement
    revenge_stats AS (
        SELECT 
            p.id as player_id,
            p.pseudo,
            COUNT(*) as revenge_opportunities,
            SUM(CASE 
                WHEN (p.id IN (m.white_attacker, m.white_defender) AND m.white_won) OR
                     (p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won)
                THEN 1 
                ELSE 0 
            END) as revenge_wins,
            (SUM(CASE 
                WHEN (p.id IN (m.white_attacker, m.white_defender) AND m.white_won) OR
                     (p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won)
                THEN 1 
                ELSE 0 
            END)::FLOAT + 1) / (COUNT(*) + 2) * 100 as revenge_rate,
            DENSE_RANK() OVER (
                ORDER BY (SUM(CASE 
                    WHEN (p.id IN (m.white_attacker, m.white_defender) AND m.white_won) OR
                         (p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won)
                    THEN 1 
                    ELSE 0 
                END)::FLOAT + 1) / (COUNT(*) + 2) DESC,
                COUNT(*) DESC
            ) as rnk
        FROM temp_match_data m
        JOIN players p ON p.id IN (
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender
        )
        WHERE EXISTS (
            SELECT 1 
            FROM temp_match_data prev
            WHERE prev.created_at < m.created_at
            AND (
                (p.id IN (prev.white_attacker, prev.white_defender) AND NOT (prev.score_white > prev.score_black))
                OR 
                (p.id IN (prev.black_attacker, prev.black_defender) AND (prev.score_white > prev.score_black))
            )
            AND prev.created_at = (
                SELECT MAX(created_at)
                FROM temp_match_data prev2
                WHERE prev2.created_at < m.created_at
            )
        )
        GROUP BY p.id, p.pseudo
        HAVING COUNT(*) >= 1
    )
    SELECT jsonb_build_object(
        'first_blood', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'player_id', fb.player_id,
                    'pseudo', fb.pseudo,
                    'total_first_matches', fb.total_first_matches,
                    'victories', fb.victories,
                    'win_rate', fb.win_rate
                )
                ORDER BY fb.win_rate DESC, fb.total_first_matches DESC, fb.player_id
            )
            FROM first_blood_stats fb
            WHERE fb.rnk = 1
        ),
        'dessert', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'player_id', ds.player_id,
                    'pseudo', ds.pseudo,
                    'total_matches', ds.total_matches,
                    'victories', ds.victories,
                    'win_rate', ds.win_rate
                )
                ORDER BY ds.win_rate DESC, ds.total_matches DESC, ds.player_id
            )
            FROM dessert_stats ds
            WHERE ds.rnk = 1
        ),
        'dessert_looser', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'player_id', dl.player_id,
                    'pseudo', dl.pseudo,
                    'total_matches', dl.total_matches,
                    'defeats', dl.defeats,
                    'loss_rate', dl.loss_rate
                )
                ORDER BY dl.loss_rate DESC, dl.total_matches DESC, dl.player_id
            )
            FROM dessert_looser_stats dl
            WHERE dl.rnk = 1
        ),
        'fidele', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'player_id', fs.player_id,
                    'pseudo', fs.pseudo,
                    'favorite_partner_id', fs.favorite_partner_id,
                    'favorite_partner_pseudo', fs.favorite_partner_pseudo,
                    'matches_together', fs.matches_together,
                    'victories_together', fs.victories_together,
                    'total_matches', fs.total_matches,
                    'fidelity_rate', fs.fidelity_rate
                )
                ORDER BY fs.fidelity_rate DESC, fs.matches_together DESC, fs.player_id
            )
            FROM fidele_stats fs
            WHERE fs.rnk = 1
        ),
        'casanova', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'player_id', cs.player_id,
                    'pseudo', cs.pseudo,
                    'distinct_partners', cs.distinct_partners,
                    'total_matches', cs.total_matches,
                    'partner_change_rate', cs.partner_change_rate
                )
                ORDER BY cs.partner_change_rate DESC, cs.distinct_partners DESC, cs.player_id
            )
            FROM casanova_stats cs
            WHERE cs.rnk = 1
        ),
        'classicos', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'team1', jsonb_build_object(
                        'player1_id', cs.t1p1,
                        'player2_id', cs.t1p2,
                        'player1_pseudo', p1.pseudo,
                        'player2_pseudo', p2.pseudo,
                        'victories', cs.team1_wins
                    ),
                    'team2', jsonb_build_object(
                        'player1_id', cs.t2p1,
                        'player2_id', cs.t2p2,
                        'player1_pseudo', p3.pseudo,
                        'player2_pseudo', p4.pseudo,
                        'victories', cs.team2_wins
                    ),
                    'total_matches', cs.total_matches
                )
                ORDER BY cs.total_matches DESC, LEAST(cs.t1p1, cs.t1p2, cs.t2p1, cs.t2p2)
            )
            FROM classico_stats cs
            JOIN players p1 ON p1.id = cs.t1p1
            JOIN players p2 ON p2.id = cs.t1p2
            JOIN players p3 ON p3.id = cs.t2p1
            JOIN players p4 ON p4.id = cs.t2p2
            WHERE cs.rnk <= 3
        ),
        'monte_cristo', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'player_id', rs.player_id,
                    'pseudo', rs.pseudo,
                    'revenge_wins', rs.revenge_wins,
                    'revenge_opportunities', rs.revenge_opportunities,
                    'revenge_rate', rs.revenge_rate
                )
                ORDER BY rs.revenge_rate DESC, rs.revenge_opportunities DESC, rs.player_id
            )
            FROM revenge_stats rs
            WHERE rs.rnk = 1
        )
    ) INTO result;

    RETURN result;
END;
$function$; 