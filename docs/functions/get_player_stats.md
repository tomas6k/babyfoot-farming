# Fonction `get_player_stats`

## Table des matières
1. [Description](#description)
2. [Paramètres](#paramètres)
3. [Valeurs de retour](#valeurs-de-retour)
4. [Implémentation](#implémentation)
5. [Performance](#performance)
6. [Tests](#tests)
7. [Utilisation](#utilisation)
8. [Maintenance](#maintenance)
9. [Historique des migrations](#historique-des-migrations)

## Description
Cette fonction calcule les statistiques détaillées des joueurs actifs, incluant leurs performances en tant qu'attaquant et défenseur, ainsi que leurs partenaires et adversaires préférés.

### Ordre de tri des résultats
Les joueurs sont triés selon les critères suivants (par ordre de priorité) :
1. `total_exp_gained` (décroissant) - Expérience gagnée sur la période
2. `victory_ratio` (décroissant) - En cas d'égalité d'EXP gagnée
3. `total_matches` (décroissant) - En cas d'égalité de ratio de victoires

## Paramètres

| Nom | Type | Description | Défaut |
|-----|------|-------------|---------|
| `p_player_id` | UUID | ID du joueur à analyser (NULL pour tous les joueurs) | NULL |
| `p_month` | DATE | Mois pour filtrer les statistiques (NULL pour toutes les dates) | NULL |

## Valeurs de retour

### Informations générales
- `player_id` (UUID) : ID du joueur
- `pseudo` (TEXT) : Pseudonyme du joueur
- `exp` (INTEGER) : Points d'expérience totaux
- `level` (INTEGER) : Niveau actuel
- `title` (TEXT) : Titre correspondant au niveau
- `description` (TEXT) : Description du titre correspondant au niveau

### Statistiques globales
- `total_matches` (INTEGER) : Nombre total de matches joués
- `victories` (INTEGER) : Nombre total de victoires
- `defeats` (INTEGER) : Nombre total de défaites
- `victory_ratio` (DECIMAL) : Ratio de victoires (en pourcentage)
- `goals_scored` (INTEGER) : Nombre total de buts marqués
- `goals_conceded` (INTEGER) : Nombre total de buts encaissés
- `goals_ratio` (DECIMAL) : Ratio buts marqués/encaissés
- `total_exp_gained` (INTEGER) : Somme de l'expérience gagnée sur la période, calculée à partir des différences d'expérience avant/après chaque match

### Statistiques par rôle
#### Attaquant
- `total_matches_attacker` (INTEGER) : Nombre de matches en tant qu'attaquant
- `victories_attacker` (INTEGER) : Nombre de victoires en tant qu'attaquant
- `defeats_attacker` (INTEGER) : Nombre de défaites en tant qu'attaquant
- `goals_for_attacker` (INTEGER) : Buts marqués en tant qu'attaquant
- `goals_against_attacker` (INTEGER) : Buts encaissés en tant qu'attaquant

#### Défenseur
- `total_matches_defender` (INTEGER) : Nombre de matches en tant que défenseur
- `victories_defender` (INTEGER) : Nombre de victoires en tant que défenseur
- `defeats_defender` (INTEGER) : Nombre de défaites en tant que défenseur
- `goals_for_defender` (INTEGER) : Buts marqués en tant que défenseur
- `goals_against_defender` (INTEGER) : Buts encaissés en tant que défenseur

### Statistiques par équipe
#### Équipe blanche
- `white_team_matches` (INTEGER) : Nombre de matchs joués en équipe blanche
- `white_team_victories` (INTEGER) : Nombre de victoires en équipe blanche
- `white_team_defeats` (INTEGER) : Nombre de défaites en équipe blanche
- `white_team_goals_scored` (INTEGER) : Buts marqués en équipe blanche
- `white_team_goals_conceded` (INTEGER) : Buts encaissés en équipe blanche

#### Équipe noire
- `black_team_matches` (INTEGER) : Nombre de matchs joués en équipe noire
- `black_team_victories` (INTEGER) : Nombre de victoires en équipe noire
- `black_team_defeats` (INTEGER) : Nombre de défaites en équipe noire
- `black_team_goals_scored` (INTEGER) : Buts marqués en équipe noire
- `black_team_goals_conceded` (INTEGER) : Buts encaissés en équipe noire

### Meilleurs/Pires partenaires et adversaires
#### Partenaires
- `best_partner_id` (UUID) : ID du meilleur partenaire
- `best_partner_pseudo` (TEXT) : Pseudo du meilleur partenaire
- `best_partner_matches` (INTEGER) : Nombre de matches avec le meilleur partenaire
- `best_partner_victories` (INTEGER) : Nombre de victoires avec le meilleur partenaire
- `worst_partner_id` (UUID) : ID du pire partenaire
- `worst_partner_pseudo` (TEXT) : Pseudo du pire partenaire
- `worst_partner_matches` (INTEGER) : Nombre de matches avec le pire partenaire
- `worst_partner_victories` (INTEGER) : Nombre de victoires avec le pire partenaire

#### Adversaires
- `best_opponent_id` (UUID) : ID du meilleur adversaire
- `best_opponent_pseudo` (TEXT) : Pseudo du meilleur adversaire
- `best_opponent_matches` (INTEGER) : Nombre de matches contre le meilleur adversaire
- `best_opponent_victories` (INTEGER) : Nombre de victoires contre le meilleur adversaire
- `worst_opponent_id` (UUID) : ID du pire adversaire
- `worst_opponent_pseudo` (TEXT) : Pseudo du pire adversaire
- `worst_opponent_matches` (INTEGER) : Nombre de matches contre le pire adversaire
- `worst_opponent_victories` (INTEGER) : Nombre de victoires contre le pire adversaire

## Implémentation

### Structure de la requête
La fonction utilise plusieurs CTEs pour organiser le calcul des statistiques :
1. `filtered_matches` : Filtre les matchs par période
2. `player_matches` : Associe les joueurs à leurs matchs
3. `player_stats` : Calcule les statistiques globales
4. `role_stats` : Calcule les statistiques par rôle
5. `team_stats` : Calcule les statistiques par équipe
6. `exp_gained` : Calcule l'expérience gagnée
7. `partner_stats` et `opponent_stats` : Identifie les meilleurs/pires partenaires et adversaires

### Règles métier
1. Un match compte comme victoire uniquement si l'équipe du joueur a marqué exactement 10 buts
2. Les ratios sont calculés avec une précision de 2 décimales
3. En cas d'absence de matchs, les ratios sont à 0
4. Les statistiques sont calculées indépendamment du rôle et de l'équipe

## Performance

### Environnement de test
- Nombre de joueurs : 4
- Nombre de matchs : ~1000
- Période : 6 derniers mois

### Résultats
1. Requête pour un joueur spécifique
   - Temps d'exécution : ~28.8ms
   - Limite requise : 2000ms ✅

2. Requête pour tous les joueurs
   - Temps d'exécution : ~103.5ms
   - Limite requise : 10000ms ✅

### Index optimisés
```sql
-- Filtrage temporel
CREATE INDEX idx_matches_date ON matches (date);

-- Calcul des victoires
CREATE INDEX idx_matches_scores ON matches (score_white, score_black);

-- Recherche par équipe
CREATE INDEX idx_matches_white_team ON matches (white_attacker, white_defender);
CREATE INDEX idx_matches_black_team ON matches (black_attacker, black_defender);

-- Tri par expérience
CREATE INDEX idx_players_exp ON players (exp DESC);
```

## Tests

### Tests unitaires
La fonction `test_get_player_stats()` vérifie :
1. ✅ Retour pour tous les joueurs
2. ✅ Calcul des ratios (0-100%)
3. ✅ Filtrage par mois
4. ✅ Cohérence des totaux
5. ✅ Statistiques par rôle
6. ✅ Statistiques par équipe
7. ✅ Gestion des joueurs sans match

### Exécution des tests
```sql
SELECT * FROM test_get_player_stats();
```

## Utilisation

### Exemples de requêtes

1. Statistiques d'un joueur spécifique
```sql
SELECT * FROM get_player_stats('123e4567-e89b-12d3-a456-426614174000');
```

2. Statistiques mensuelles
```sql
SELECT * FROM get_player_stats(NULL, '2024-03-01');
```

3. Classement des joueurs
```sql
SELECT pseudo, victories, victory_ratio 
FROM get_player_stats() 
ORDER BY victory_ratio DESC;
```

### Cas d'utilisation
1. Affichage du profil joueur
2. Génération de classements
3. Analyse des performances
4. Formation d'équipes équilibrées

## Maintenance

### Recommandations
1. Maintenance des index
   - Reconstruire périodiquement
   - Surveiller l'utilisation
   - Ajuster selon l'évolution

2. Monitoring
   - Temps d'exécution
   - Utilisation des index
   - Requêtes lentes

3. Optimisations futures
   - Partitionnement par date
   - Matérialisation des vues
   - Cache applicatif

### Dépendances
- Table `matches`
- Table `players`
- Table `levels`

### Mises à jour
Pour toute modification :
1. Exécuter les tests unitaires
2. Vérifier les performances
3. Mettre à jour la documentation

## Historique des migrations

### Version du 2024-03-21
- Correction des noms de colonnes pour correspondre à la structure de la table `matches`
- Ajout du calcul de `total_exp_gained` basé sur les différences d'expérience avant/après chaque match
- Ajout de colonnes pour les statistiques détaillées par rôle :
  - `total_matches_attacker`, `victories_attacker`, `defeats_attacker`
  - `total_matches_defender`, `victories_defender`, `defeats_defender`
- Amélioration des calculs pour les partenaires et adversaires :
  - Ajout du nombre total de matchs joués ensemble
  - Distinction entre matchs en tant qu'attaquant et défenseur
- Optimisation des performances avec des index sur les colonnes fréquemment utilisées
- Mise à jour des tests unitaires pour couvrir les nouveaux cas d'utilisation

### Version du 2024-03-XX (Version initiale)
```sql
CREATE OR REPLACE FUNCTION get_player_stats(
    p_player_id UUID DEFAULT NULL,
    p_month DATE DEFAULT NULL
) RETURNS TABLE (
    player_id UUID,
    pseudo TEXT,
    exp INTEGER,
    total_matches INTEGER,
    victories INTEGER,
    defeats INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    total_matches_attacker INTEGER,
    victories_attacker INTEGER,
    defeats_attacker INTEGER,
    goals_for_attacker INTEGER,
    goals_against_attacker INTEGER,
    total_matches_defender INTEGER,
    victories_defender INTEGER,
    defeats_defender INTEGER,
    goals_for_defender INTEGER,
    goals_against_defender INTEGER,
    best_partner_id UUID,
    best_partner_pseudo TEXT,
    best_partner_matches INTEGER,
    best_partner_victories INTEGER,
    worst_partner_id UUID,
    worst_partner_pseudo TEXT,
    worst_partner_matches INTEGER,
    worst_partner_victories INTEGER,
    best_opponent_id UUID,
    best_opponent_pseudo TEXT,
    best_opponent_matches INTEGER,
    best_opponent_victories INTEGER,
    worst_opponent_id UUID,
    worst_opponent_pseudo TEXT,
    worst_opponent_matches INTEGER,
    worst_opponent_victories INTEGER
) AS $$
WITH filtered_matches AS (
    SELECT *
    FROM matches
    WHERE (p_month IS NULL OR DATE_TRUNC('month', date) = DATE_TRUNC('month', p_month))
),
player_matches AS (
    SELECT 
        p.id as player_id,
        p.pseudo,
        p.exp,
        m.*,
        CASE 
            WHEN m.white_attacker = p.id OR m.white_defender = p.id THEN 
                CASE WHEN m.score_white = 10 THEN true ELSE false END
            ELSE 
                CASE WHEN m.score_black = 10 THEN true ELSE false END
        END as is_victory,
        CASE 
            WHEN m.white_attacker = p.id OR m.white_defender = p.id THEN m.score_white
            ELSE m.score_black
        END as goals_for,
        CASE 
            WHEN m.white_attacker = p.id OR m.white_defender = p.id THEN m.score_black
            ELSE m.score_white
        END as goals_against,
        CASE 
            WHEN m.white_attacker = p.id OR m.black_attacker = p.id THEN 'attacker'
            ELSE 'defender'
        END as player_role,
        CASE
            WHEN m.white_attacker = p.id THEN m.white_attacker_exp_after - m.white_attacker_exp_before
            WHEN m.white_defender = p.id THEN m.white_defender_exp_after - m.white_defender_exp_before
            WHEN m.black_attacker = p.id THEN m.black_attacker_exp_after - m.black_attacker_exp_before
            WHEN m.black_defender = p.id THEN m.black_defender_exp_after - m.black_defender_exp_before
            ELSE 0
        END as exp_gained
    FROM players p
    CROSS JOIN filtered_matches m
    WHERE p.id = COALESCE(p_player_id, p.id)
        AND (
            m.white_attacker = p.id OR m.white_defender = p.id OR
            m.black_attacker = p.id OR m.black_defender = p.id
        )
),
player_stats AS (
    SELECT 
        player_id,
        pseudo,
        exp,
        COUNT(*) as total_matches,
        COUNT(*) FILTER (WHERE is_victory) as victories,
        COUNT(*) FILTER (WHERE NOT is_victory) as defeats,
        SUM(goals_for) as goals_for,
        SUM(goals_against) as goals_against
    FROM player_matches
    GROUP BY player_id, pseudo, exp
),
role_stats AS (
    SELECT 
        player_id,
        COUNT(*) FILTER (WHERE player_role = 'attacker') as total_matches_attacker,
        COUNT(*) FILTER (WHERE player_role = 'attacker' AND is_victory) as victories_attacker,
        COUNT(*) FILTER (WHERE player_role = 'attacker' AND NOT is_victory) as defeats_attacker,
        SUM(goals_for) FILTER (WHERE player_role = 'attacker') as goals_for_attacker,
        SUM(goals_against) FILTER (WHERE player_role = 'attacker') as goals_against_attacker,
        COUNT(*) FILTER (WHERE player_role = 'defender') as total_matches_defender,
        COUNT(*) FILTER (WHERE player_role = 'defender' AND is_victory) as victories_defender,
        COUNT(*) FILTER (WHERE player_role = 'defender' AND NOT is_victory) as defeats_defender,
        SUM(goals_for) FILTER (WHERE player_role = 'defender') as goals_for_defender,
        SUM(goals_against) FILTER (WHERE player_role = 'defender') as goals_against_defender
    FROM player_matches
    GROUP BY player_id
),
partner_stats AS (
    SELECT 
        pm.player_id,
        p2.id as partner_id,
        p2.pseudo as partner_pseudo,
        COUNT(*) as matches_together,
        COUNT(*) FILTER (WHERE pm.is_victory) as victories_together
    FROM player_matches pm
    JOIN players p2 ON (
        (pm.white_attacker = pm.player_id AND pm.white_defender = p2.id) OR
        (pm.white_defender = pm.player_id AND pm.white_attacker = p2.id) OR
        (pm.black_attacker = pm.player_id AND pm.black_defender = p2.id) OR
        (pm.black_defender = pm.player_id AND pm.black_attacker = p2.id)
    )
    GROUP BY pm.player_id, p2.id, p2.pseudo
),
ranked_partners AS (
    SELECT 
        player_id,
        partner_id,
        partner_pseudo,
        matches_together,
        victories_together,
        ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY victories_together DESC, matches_together DESC) as best_rank,
        ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY victories_together ASC, matches_together DESC) as worst_rank
    FROM partner_stats
),
opponent_stats AS (
    SELECT 
        pm.player_id,
        p2.id as opponent_id,
        p2.pseudo as opponent_pseudo,
        COUNT(*) as matches_against,
        COUNT(*) FILTER (WHERE pm.is_victory) as victories_against
    FROM player_matches pm
    JOIN players p2 ON (
        (pm.white_attacker = pm.player_id AND (pm.black_attacker = p2.id OR pm.black_defender = p2.id)) OR
        (pm.white_defender = pm.player_id AND (pm.black_attacker = p2.id OR pm.black_defender = p2.id)) OR
        (pm.black_attacker = pm.player_id AND (pm.white_attacker = p2.id OR pm.white_defender = p2.id)) OR
        (pm.black_defender = pm.player_id AND (pm.white_attacker = p2.id OR pm.white_defender = p2.id))
    )
    GROUP BY pm.player_id, p2.id, p2.pseudo
),
ranked_opponents AS (
    SELECT 
        player_id,
        opponent_id,
        opponent_pseudo,
        matches_against,
        victories_against,
        ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY victories_against DESC, matches_against DESC) as best_rank,
        ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY victories_against ASC, matches_against DESC) as worst_rank
    FROM opponent_stats
)
SELECT 
    ps.player_id,
    ps.pseudo,
    ps.exp,
    ps.total_matches,
    ps.victories,
    ps.defeats,
    ps.goals_for,
    ps.goals_against,
    COALESCE(rs.total_matches_attacker, 0) as total_matches_attacker,
    COALESCE(rs.victories_attacker, 0) as victories_attacker,
    COALESCE(rs.defeats_attacker, 0) as defeats_attacker,
    COALESCE(rs.goals_for_attacker, 0) as goals_for_attacker,
    COALESCE(rs.goals_against_attacker, 0) as goals_against_attacker,
    COALESCE(rs.total_matches_defender, 0) as total_matches_defender,
    COALESCE(rs.victories_defender, 0) as victories_defender,
    COALESCE(rs.defeats_defender, 0) as defeats_defender,
    COALESCE(rs.goals_for_defender, 0) as goals_for_defender,
    COALESCE(rs.goals_against_defender, 0) as goals_against_defender,
    bp.partner_id as best_partner_id,
    bp.partner_pseudo as best_partner_pseudo,
    bp.matches_together as best_partner_matches,
    bp.victories_together as best_partner_victories,
    wp.partner_id as worst_partner_id,
    wp.partner_pseudo as worst_partner_pseudo,
    wp.matches_together as worst_partner_matches,
    wp.victories_together as worst_partner_victories,
    bo.opponent_id as best_opponent_id,
    bo.opponent_pseudo as best_opponent_pseudo,
    bo.matches_against as best_opponent_matches,
    bo.victories_against as best_opponent_victories,
    wo.opponent_id as worst_opponent_id,
    wo.opponent_pseudo as worst_opponent_pseudo,
    wo.matches_against as worst_opponent_matches,
    wo.victories_against as worst_opponent_victories,
    ps.exp_gained as total_exp_gained
FROM player_stats ps
LEFT JOIN role_stats rs ON rs.player_id = ps.player_id
LEFT JOIN ranked_partners bp ON bp.player_id = ps.player_id AND bp.best_rank = 1
LEFT JOIN ranked_partners wp ON wp.player_id = ps.player_id AND wp.worst_rank = 1
LEFT JOIN ranked_opponents bo ON bo.player_id = ps.player_id AND bo.best_rank = 1
LEFT JOIN ranked_opponents wo ON wo.player_id = ps.player_id AND wo.worst_rank = 1
ORDER BY 
    COALESCE(ps.total_exp_gained, 0) DESC,
    CASE 
        WHEN ps.total_matches = 0 OR ps.total_matches IS NULL THEN 0
        ELSE CAST(ps.victories AS FLOAT) / ps.total_matches
    END DESC,
    COALESCE(ps.total_matches, 0) DESC;
$$ LANGUAGE SQL;
```

#### Format JSON attendu
```json
{
  "player_id": "f4979a15-9cad-4d3a-a79e-56f95b069504",
  "pseudo": "Toshi",
  "exp": 10,
  "total_matches": 1001,
  "victories": 509,
  "defeats": 492,
  "goals_for": 7050,
  "goals_against": 6981,
  "total_matches_attacker": 483,
  "victories_attacker": 238,
  "defeats_attacker": 245,
  "goals_for_attacker": 3395,
  "goals_against_attacker": 3397,
  "total_matches_defender": 518,
  "victories_defender": 271,
  "defeats_defender": 247,
  "goals_for_defender": 3655,
  "goals_against_defender": 3584,
  "best_partner_id": "e3158b2e-be21-4ad5-8ff0-cf02ca20a519",
  "best_partner_pseudo": "Tomas",
  "best_partner_matches": 310,
  "best_partner_victories": 162,
  "worst_partner_id": "a8378bf4-696a-4242-a3b7-c6cf3cb2d62b",
  "worst_partner_pseudo": "Rafa",
  "worst_partner_matches": 335,
  "worst_partner_victories": 167,
  "best_opponent_id": "a8378bf4-696a-4242-a3b7-c6cf3cb2d62b",
  "best_opponent_pseudo": "Rafa",
  "best_opponent_matches": 324,
  "best_opponent_victories": 167,
  "worst_opponent_id": "5ea232a9-78d9-46ca-8488-5bfa8148c274",
  "worst_opponent_pseudo": "Dodo",
  "worst_opponent_matches": 324,
  "worst_opponent_victories": 162,
  "total_exp_gained": 150
}
```