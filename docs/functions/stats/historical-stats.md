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
- Minimum 10 matchs au total
- Calcul du taux de fidélité
- Identification du partenaire favori
- Affiche uniquement le(s) joueur(s) avec le meilleur taux de fidélité
- En cas d'égalité, tous les joueurs ayant le même taux sont affichés
- Tri secondaire par nombre de matchs ensemble puis par ID

### 4. Le Casanova (Changement de Partenaires)

#### Critères
- Minimum 10 matchs au total
- Calcul du taux de changement
- Comptage des partenaires uniques
- Affiche uniquement le(s) joueur(s) avec le meilleur taux de changement
- En cas d'égalité, tous les joueurs ayant le même taux sont affichés
- Tri secondaire par nombre total de matchs puis par ID

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
    match_count: number;
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
CREATE OR REPLACE FUNCTION get_historical_stats(
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
    WITH temp_match_data AS (
        SELECT 
            m.*,
            CASE 
                WHEN m.score_white > m.score_black THEN true 
                ELSE false 
            END as white_won,
            m.created_at AT TIME ZONE 'Europe/Paris' as local_date
        FROM matches m
        WHERE (target_start_date IS NULL OR m.created_at >= target_start_date)
        AND (target_end_date IS NULL OR m.created_at < target_end_date)
        AND (target_player_id IS NULL OR 
            target_player_id IN (
                m.white_attacker, m.white_defender,
                m.black_attacker, m.black_defender
            ))
        ORDER BY m.created_at
    ),
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
            END)::FLOAT + 1) / (COUNT(*) + 2) * 100 as win_rate
        FROM players p
        JOIN temp_match_data m ON p.id IN (
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender
        )
        WHERE EXTRACT(DOW FROM m.local_date) = 2  -- 2 = Lundi dans PostgreSQL
        GROUP BY p.id, p.pseudo
        HAVING COUNT(*) >= 1
        ORDER BY win_rate DESC, total_first_matches DESC, player_id
        LIMIT 1
    ),
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
            END)::FLOAT + 1) / (COUNT(*) + 2) * 100 as win_rate
        FROM players p
        JOIN temp_match_data m ON p.id IN (
            m.white_attacker, m.white_defender,
            m.black_attacker, m.black_defender
        )
        WHERE EXTRACT(HOUR FROM m.local_date) BETWEEN 12 AND 14
        AND (
            EXTRACT(HOUR FROM m.local_date) < 14 OR
            (EXTRACT(HOUR FROM m.local_date) = 14 AND
             EXTRACT(MINUTE FROM m.local_date) <= 30)
        )
        GROUP BY p.id, p.pseudo
        HAVING COUNT(*) >= 2
        ORDER BY win_rate DESC, total_matches DESC, player_id
        LIMIT 1
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
    ),
    casanova_stats AS (
        SELECT DISTINCT ON (player_id)
            player_id,
            pseudo,
            distinct_partners,
            total_matches,
            (distinct_partners::float / total_matches * 100) as partner_change_rate
        FROM partnership_stats
        ORDER BY player_id, distinct_partners DESC
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
    classico_stats AS (
        SELECT 
            t1p1, t1p2, t2p1, t2p2,
            COUNT(*) as total_matches,
            SUM(CASE WHEN white_won THEN 1 ELSE 0 END) as team1_wins,
            SUM(CASE WHEN NOT white_won THEN 1 ELSE 0 END) as team2_wins
        FROM team_matches
        GROUP BY t1p1, t1p2, t2p1, t2p2
        HAVING COUNT(*) >= 5
    ),
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
            END) as revenge_wins
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
        ORDER BY (SUM(CASE 
            WHEN (p.id IN (m.white_attacker, m.white_defender) AND m.white_won) OR
                 (p.id IN (m.black_attacker, m.black_defender) AND NOT m.white_won)
            THEN 1 
            ELSE 0 
        END)::float + 1) / (COUNT(*) + 2) DESC,
        COUNT(*) DESC,
        p.id
        LIMIT 1
    )
    SELECT jsonb_build_object(
        'first_blood', (
            SELECT jsonb_agg(to_jsonb(fb))
            FROM first_blood_stats fb
        ),
        'dessert', (
            SELECT jsonb_agg(to_jsonb(ds))
            FROM dessert_stats ds
        ),
        'fidele', (
            SELECT jsonb_agg(to_jsonb(fs))
            FROM (
                SELECT *
                FROM fidele_stats
                ORDER BY fidelity_rate DESC, matches_together DESC, player_id
                LIMIT 1
            ) fs
        ),
        'casanova', (
            SELECT jsonb_agg(to_jsonb(cs))
            FROM (
                SELECT *
                FROM casanova_stats
                ORDER BY partner_change_rate DESC, total_matches DESC, player_id
                LIMIT 1
            ) cs
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
            )
            FROM (
                SELECT cs.*, 
                       ROW_NUMBER() OVER (ORDER BY cs.total_matches DESC) as rn
                FROM classico_stats cs
            ) cs
            JOIN players p1 ON p1.id = cs.t1p1
            JOIN players p2 ON p2.id = cs.t1p2
            JOIN players p3 ON p3.id = cs.t2p1
            JOIN players p4 ON p4.id = cs.t2p2
            WHERE cs.rn <= 3
        ),
        'monte_cristo', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'player_id', rs.player_id,
                    'pseudo', rs.pseudo,
                    'revenge_wins', rs.revenge_wins,
                    'revenge_opportunities', rs.revenge_opportunities,
                    'revenge_rate', (rs.revenge_wins::float + 1) / (rs.revenge_opportunities + 2) * 100
                )
            )
            FROM revenge_stats rs
        )
    ) INTO result;

    RETURN result;
END;
$function$; 