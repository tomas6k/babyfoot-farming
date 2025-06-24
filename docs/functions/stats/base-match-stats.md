# Statistiques de Base des Matchs (get_base_match_stats)

## Vue d'ensemble

Cette fonction calcule les statistiques fondamentales des matchs de babyfoot, notamment :
1. Les victoires parfaites (score 10-0)
2. Les défaites parfaites (score 0-10)
3. Les victoires serrées (score 10-9)
4. Les défaites serrées (score 9-10)
5. L'activité des joueurs (nombre de matchs joués)

### 1. Victoires Parfaites

#### Critères
- Match gagné avec un score de 10-0
- Affiche uniquement le(s) joueur(s) avec le plus grand nombre de victoires parfaites
- En cas d'égalité, tous les joueurs ayant le même nombre sont affichés
- Tri secondaire par ID pour assurer la cohérence des résultats

### 2. Défaites Parfaites

#### Critères
- Match perdu avec un score de 0-10
- Affiche uniquement le(s) joueur(s) avec le plus grand nombre de défaites parfaites
- En cas d'égalité, tous les joueurs ayant le même nombre sont affichés
- Tri secondaire par ID pour assurer la cohérence des résultats

### 3. Victoires Serrées

#### Critères
- Match gagné avec un score de 10-9
- Affiche uniquement le(s) joueur(s) avec le plus grand nombre de victoires serrées
- En cas d'égalité, tous les joueurs ayant le même nombre sont affichés
- Tri secondaire par ID pour assurer la cohérence des résultats

### 4. Défaites Serrées

#### Critères
- Match perdu avec un score de 9-10
- Affiche uniquement le(s) joueur(s) avec le plus grand nombre de défaites serrées
- En cas d'égalité, tous les joueurs ayant le même nombre sont affichés
- Tri secondaire par ID pour assurer la cohérence des résultats

### 5. Activité des Joueurs

#### Critères
- Joueurs les plus actifs (Visible si au moins 15 matchs sont joués sur la période par l'ensemble des joueurs)
  - Dans le code actuel, cette visibilité est basée sur un seuil individuel de 10 matchs minimum par joueur et non sur un total global
- Joueurs les moins actifs (Visible si au moins 15 matchs sont joués sur la période par l'ensemble des joueurs)
  - Inclut tous les joueurs ayant joué au moins 1 match
  - Exclu les joueurs non actifs
- Tri primaire par nombre de matchs (décroissant pour les plus actifs, croissant pour les moins actifs)
- Tri secondaire par ID pour assurer la cohérence des résultats
- Stockage des dates du premier et dernier match pour chaque joueur (non retourné dans le résultat)

## Paramètres

| Nom | Type | Description | Défaut |
|-----|------|-------------|---------|
| `p_date` | DATE | Date de référence pour filtrer les statistiques du mois | CURRENT_DATE |
| `p_date_start` | DATE | Date de début pour filtrer les statistiques | NULL |
| `p_date_end` | DATE | Date de fin pour filtrer les statistiques | NULL |

**Note sur la priorité des filtres:**
- Si `p_date_start` ET `p_date_end` sont fournis (non NULL), les statistiques sont calculées pour cette période spécifique.
- Si seul `p_date` est fourni (non NULL), les statistiques sont calculées pour le mois correspondant à cette date.
- Si tous les paramètres sont NULL ou par défaut, les statistiques sont calculées pour l'ensemble des matchs.

## Structure de la Fonction

La fonction calcule d'abord le nombre total de matchs sur la période (stocké dans `v_total_matches`), puis utilise plusieurs Common Table Expressions (CTEs) pour organiser le calcul des statistiques :

```sql
WITH match_data AS (
    -- Données de base des matchs avec filtrage par date
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
    -- Association joueurs-matchs avec calcul des indicateurs de victoire/défaite
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
        -- Détection des différents types de matchs spéciaux
        (
            (m.score_white = 10 AND m.score_black = 0 AND p.id IN (m.white_attacker, m.white_defender)) OR
            (m.score_black = 10 AND m.score_white = 0 AND p.id IN (m.black_attacker, m.black_defender))
        ) as is_perfect_win,
        -- Autres détections similaires
        ...
        m.created_at
    FROM match_data m
    CROSS JOIN players p
    WHERE p.id IN (m.white_attacker, m.white_defender, m.black_attacker, m.black_defender)
)
```

## Mécanismes de Calcul

La fonction utilise des CTEs spécifiques pour chaque type de statistique :

### 1. Victoires/Défaites Parfaites et Serrées

```sql
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
)
```

- Utilisation de `DENSE_RANK()` pour gérer les égalités
- Filtrage avec `HAVING COUNT(*) > 0` pour éliminer les joueurs sans statistiques
- Même structure pour les autres types de victoires/défaites

### 2. Activité des Joueurs

```sql
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
```

- Utilisation de `LEFT JOIN` pour inclure même les joueurs sans match
- Double classement pour identifier les plus actifs et les moins actifs
- Filtrage des joueurs désactivés avec `WHERE NOT p.disable`
- Stockage des dates du premier et dernier match pour chaque joueur

## Format de Retour

```typescript
interface BaseMatchStats {
  perfect_wins: Array<{
    player_id: string;
    pseudo: string;
    count: number;
  }>;
  perfect_losses: Array<{
    player_id: string;
    pseudo: string;
    count: number;
  }>;
  close_wins: Array<{
    player_id: string;
    pseudo: string;
    count: number;
  }>;
  close_losses: Array<{
    player_id: string;
    pseudo: string;
    count: number;
  }>;
  activity: {
    most_active: Array<{
      player_id: string;
      pseudo: string;
      match_count: number;
    }>;
    least_active: Array<{
      player_id: string;
      pseudo: string;
      match_count: number;
    }>;
  };
}
```

**Note importante**: Contrairement à ce qui pourrait être attendu, le nombre total de matchs (`total_matches`) est calculé dans la fonction mais n'est pas inclus dans le résultat JSON retourné.

## Optimisations

### 1. Gestion des Égalités
- Utilisation de `DENSE_RANK()` pour inclure tous les joueurs/équipes à égalité
- Tri par nombre de matchs décroissant pour favoriser les joueurs avec plus d'expérience
- Tri secondaire par ID pour assurer la cohérence et la prévisibilité des résultats

### 2. Optimisation des Jointures
- Utilisation de `LEFT JOIN` dans l'activité pour inclure tous les joueurs, même sans match
- Utilisation de `CROSS JOIN` avec filtre pour les statistiques de joueur-match, ce qui simplifie la logique
- Jointures optimisées avec filtrage précis pour réduire le nombre de lignes traitées

### 3. Gestion des Valeurs Nulles
- Utilisation de `COALESCE` pour retourner des tableaux vides `[]` au lieu de `NULL`
- Cette approche facilite le traitement côté client en évitant les vérifications supplémentaires

### 4. Performance
- Calcul en une seule passe du nombre total de matchs
- Attribut `SECURITY DEFINER` pour exécuter la fonction avec les privilèges du créateur
- Utilisation de variables pour stocker des valeurs intermédiaires

## Maintenance

### Points Forts
- Les noms des colonnes reflètent la structure actuelle de la table matches
- La fonction est compatible avec la nouvelle structure de données
- Le tri est cohérent et prévisible grâce au tri secondaire par ID
- La gestion des égalités est équitable pour tous les joueurs

### Points d'Attention
- Les seuils (10 matchs minimum pour les joueurs les plus actifs) sont codés en dur, tandis que la documentation suggère un critère de visibilité global de 15 matchs
- Le format des scores parfaits (10-0) et serrés (10-9) est également codé en dur
- Ces valeurs pourraient nécessiter des ajustements si les règles du jeu changent
- Le nombre total de matchs n'est pas inclus dans le résultat JSON

## Backup et Restauration

### Stratégie de Sauvegarde
- Les statistiques de base sont calculées à la volée et ne nécessitent pas de sauvegarde directe
- Les données sources (table `matches`) sont sauvegardées quotidiennement par Supabase
- En cas de besoin de restauration, les statistiques seront automatiquement recalculées

### Restauration
- La restauration des données sources (tables `matches` et `players`) suffit à rétablir les statistiques
- Aucune étape supplémentaire n'est nécessaire après la restauration des tables
- Les statistiques seront recalculées au prochain appel de la fonction

## Code Source Complet

```sql
CREATE OR REPLACE FUNCTION get_base_match_stats(
    p_date DATE DEFAULT CURRENT_DATE,
    p_date_start DATE DEFAULT NULL,
    p_date_end DATE DEFAULT NULL
)
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result jsonb;
    v_total_matches integer;
    v_min_matches integer;
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
    ),
    -- Trouver le nombre minimum de matchs (parmi les joueurs ayant joué au moins un match)
    min_matches AS (
        SELECT MIN(match_count) as min_count
        FROM activity_stats
        WHERE match_count > 0
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
                        FROM activity_stats a, min_matches m
                        WHERE a.match_count = m.min_count AND a.match_count > 0
                    ), '[]'::jsonb)
                )
            ELSE NULL -- Renvoie NULL si le total est inférieur à 15 matchs
        END
    ) INTO v_result;

    RETURN v_result;
END;
$function$; 