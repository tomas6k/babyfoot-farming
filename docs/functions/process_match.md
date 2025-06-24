# Fonction process_match

## Objectif
Traiter un match de babyfoot qui vient d'être joué en mettant à jour les statistiques des joueurs et en calculant les gains/pertes de ressources.

## Paramètres d'entrée
```typescript
interface ProcessMatchParams {
  whiteAttacker: UUID;    // ID de l'attaquant blanc
  whiteDefender: UUID;    // ID du défenseur blanc
  blackAttacker: UUID;    // ID de l'attaquant noir
  blackDefender: UUID;    // ID du défenseur noir
  scoreWhite: number;     // Score de l'équipe blanche (0-10)
  scoreBlack: number;     // Score de l'équipe noire (0-10)
  addedBy?: UUID;        // ID de l'utilisateur qui soumet le match (optionnel)
}
```

## Étapes de traitement

### 1. Récupération des données
- Utilise la fonction `get_players_level()` pour récupérer les statistiques actuelles et les niveaux de chaque joueur
- Récupère le multiplicateur d'expérience (`exp_rate`) depuis la table `game_config`
- Vérifie la rejouabilité entre partenaires avec `get_replayability()`

### 2. Calcul de l'expérience
Pour chaque gagnant :
- Si le taux de rejouabilité avec son partenaire est > 0.5 (50%) : 0 exp
- Pour chaque adversaire perdant :
  - Si gagnant a 0 mana et l'adversaire est de niveau inférieur et pas égal au sien : exp_given * 0.5
  - Si gagnant a 0 HP et l'adversaire est de niveau supérieur et égal au sien : exp_given * 0.5
  - Sinon : exp_given complet
- Calcul total : somme des XP des deux perdants / 2
- Multiplié par exp_rate depuis game_config
- Le résultat est arrondi à l'unité supérieure avec CEIL()

### 3. Mise à jour des ressources
- Tous les joueurs : -1 mana (minimum 0)
- Perdants : -1 HP (minimum 0)

### 4. Mise à jour de la base de données
- Crée une nouvelle entrée dans la table `matches` avec toutes les statistiques avant/après
- Met à jour les statistiques de chaque joueur dans la table `players`

## Valeur de retour
```typescript
interface ProcessMatchResult {
  player_id: UUID;        // ID du joueur
  pseudo: string;         // Pseudo du joueur
  old_exp: number;        // Expérience avant le match
  new_exp: number;        // Expérience après le match
  old_mana: number;       // Mana avant le match
  new_mana: number;       // Mana après le match
  old_hp: number;         // HP avant le match
  new_hp: number;         // HP après le match
}[]
```

## Implémentation SQL actuelle
```sql
CREATE OR REPLACE FUNCTION public.process_match(
    p_white_attacker uuid,
    p_white_defender uuid,
    p_black_attacker uuid,
    p_black_defender uuid,
    p_score_white integer,
    p_score_black integer,
    p_added_by uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
    player_id uuid,
    pseudo text,
    old_exp integer,
    new_exp integer,
    old_mana integer,
    new_mana integer,
    old_hp integer,
    new_hp integer
)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_match_id uuid;
    v_white_attacker_stats record;
    v_white_defender_stats record;
    v_black_attacker_stats record;
    v_black_defender_stats record;
    v_white_attacker_exp_after integer;
    v_white_defender_exp_after integer;
    v_black_attacker_exp_after integer;
    v_black_defender_exp_after integer;
    v_white_attacker_hp_after integer;
    v_white_defender_hp_after integer;
    v_black_attacker_hp_after integer;
    v_black_defender_hp_after integer;
    v_white_attacker_mana_after integer;
    v_white_defender_mana_after integer;
    v_black_attacker_mana_after integer;
    v_black_defender_mana_after integer;
    v_exp_rate float;
    v_white_replayability float;
    v_black_replayability float;
BEGIN
    -- 1. Récupération des données
    SELECT * INTO v_white_attacker_stats FROM get_players_level() WHERE id = p_white_attacker;
    SELECT * INTO v_white_defender_stats FROM get_players_level() WHERE id = p_white_defender;
    SELECT * INTO v_black_attacker_stats FROM get_players_level() WHERE id = p_black_attacker;
    SELECT * INTO v_black_defender_stats FROM get_players_level() WHERE id = p_black_defender;

    SELECT COALESCE((SELECT value::float FROM game_config WHERE key = 'exp_rate'), 1.0)
    INTO v_exp_rate;

    SELECT get_replayability(p_white_attacker, p_white_defender) INTO v_white_replayability;
    SELECT get_replayability(p_black_attacker, p_black_defender) INTO v_black_replayability;

    -- Initialiser les valeurs
    v_white_attacker_exp_after := v_white_attacker_stats.exp;
    v_white_defender_exp_after := v_white_defender_stats.exp;
    v_black_attacker_exp_after := v_black_attacker_stats.exp;
    v_black_defender_exp_after := v_black_defender_stats.exp;

    -- Mana (tous les joueurs perdent 1 mana)
    v_white_attacker_mana_after := GREATEST(0, v_white_attacker_stats.mana - 1);
    v_white_defender_mana_after := GREATEST(0, v_white_defender_stats.mana - 1);
    v_black_attacker_mana_after := GREATEST(0, v_black_attacker_stats.mana - 1);
    v_black_defender_mana_after := GREATEST(0, v_black_defender_stats.mana - 1);

    -- Calcul de l'XP avec CEIL pour arrondir à l'unité supérieure
    IF p_score_white > p_score_black THEN
        -- L'équipe blanche gagne
        v_white_attacker_hp_after := v_white_attacker_stats.hp;
        v_white_defender_hp_after := v_white_defender_stats.hp;
        v_black_attacker_hp_after := GREATEST(0, v_black_attacker_stats.hp - 1);
        v_black_defender_hp_after := GREATEST(0, v_black_defender_stats.hp - 1);

        IF v_white_replayability <= 0.5 THEN
            -- Calculer l'XP pour l'attaquant blanc avec CEIL
            v_white_attacker_exp_after := v_white_attacker_stats.exp + CEIL((
                CASE 
                    WHEN v_white_attacker_stats.mana = 0 AND v_black_attacker_stats.level < v_white_attacker_stats.level 
                    THEN v_black_attacker_stats.exp_given * 0.5
                    WHEN v_white_attacker_stats.hp = 0 AND v_black_attacker_stats.level >= v_white_attacker_stats.level 
                    THEN v_black_attacker_stats.exp_given * 0.5
                    ELSE v_black_attacker_stats.exp_given
                END +
                CASE 
                    WHEN v_white_attacker_stats.mana = 0 AND v_black_defender_stats.level < v_white_attacker_stats.level 
                    THEN v_black_defender_stats.exp_given * 0.5
                    WHEN v_white_attacker_stats.hp = 0 AND v_black_defender_stats.level >= v_white_attacker_stats.level 
                    THEN v_black_defender_stats.exp_given * 0.5
                    ELSE v_black_defender_stats.exp_given
                END
            ) * v_exp_rate / 2);

            -- Calculer l'XP pour le défenseur blanc avec CEIL
            v_white_defender_exp_after := v_white_defender_stats.exp + CEIL((
                CASE 
                    WHEN v_white_defender_stats.mana = 0 AND v_black_attacker_stats.level < v_white_defender_stats.level 
                    THEN v_black_attacker_stats.exp_given * 0.5
                    WHEN v_white_defender_stats.hp = 0 AND v_black_attacker_stats.level >= v_white_defender_stats.level 
                    THEN v_black_attacker_stats.exp_given * 0.5
                    ELSE v_black_attacker_stats.exp_given
                END +
                CASE 
                    WHEN v_white_defender_stats.mana = 0 AND v_black_defender_stats.level < v_white_defender_stats.level 
                    THEN v_black_defender_stats.exp_given * 0.5
                    WHEN v_white_defender_stats.hp = 0 AND v_black_defender_stats.level >= v_white_defender_stats.level 
                    THEN v_black_defender_stats.exp_given * 0.5
                    ELSE v_black_defender_stats.exp_given
                END
            ) * v_exp_rate / 2);
        END IF;

    ELSE
        -- L'équipe noire gagne
        v_white_attacker_hp_after := GREATEST(0, v_white_attacker_stats.hp - 1);
        v_white_defender_hp_after := GREATEST(0, v_white_defender_stats.hp - 1);
        v_black_attacker_hp_after := v_black_attacker_stats.hp;
        v_black_defender_hp_after := v_black_defender_stats.hp;

        IF v_black_replayability <= 0.5 THEN
            -- Calculer l'XP pour l'attaquant noir avec CEIL
            v_black_attacker_exp_after := v_black_attacker_stats.exp + CEIL((
                CASE 
                    WHEN v_black_attacker_stats.mana = 0 AND v_white_attacker_stats.level < v_black_attacker_stats.level 
                    THEN v_white_attacker_stats.exp_given * 0.5
                    WHEN v_black_attacker_stats.hp = 0 AND v_white_attacker_stats.level >= v_black_attacker_stats.level 
                    THEN v_white_attacker_stats.exp_given * 0.5
                    ELSE v_white_attacker_stats.exp_given
                END +
                CASE 
                    WHEN v_black_attacker_stats.mana = 0 AND v_white_defender_stats.level < v_black_attacker_stats.level 
                    THEN v_white_defender_stats.exp_given * 0.5
                    WHEN v_black_attacker_stats.hp = 0 AND v_white_defender_stats.level >= v_black_attacker_stats.level 
                    THEN v_white_defender_stats.exp_given * 0.5
                    ELSE v_white_defender_stats.exp_given
                END
            ) * v_exp_rate / 2);

            -- Calculer l'XP pour le défenseur noir avec CEIL
            v_black_defender_exp_after := v_black_defender_stats.exp + CEIL((
                CASE 
                    WHEN v_black_defender_stats.mana = 0 AND v_white_attacker_stats.level < v_black_defender_stats.level 
                    THEN v_white_attacker_stats.exp_given * 0.5
                    WHEN v_black_defender_stats.hp = 0 AND v_white_attacker_stats.level >= v_black_defender_stats.level 
                    THEN v_white_attacker_stats.exp_given * 0.5
                    ELSE v_white_attacker_stats.exp_given
                END +
                CASE 
                    WHEN v_black_defender_stats.mana = 0 AND v_white_defender_stats.level < v_black_defender_stats.level 
                    THEN v_white_defender_stats.exp_given * 0.5
                    WHEN v_black_defender_stats.hp = 0 AND v_white_defender_stats.level >= v_black_defender_stats.level 
                    THEN v_white_defender_stats.exp_given * 0.5
                    ELSE v_white_defender_stats.exp_given
                END
            ) * v_exp_rate / 2);
        END IF;
    END IF;

    -- Insérer le match
    INSERT INTO matches (
        white_attacker, white_defender,
        black_attacker, black_defender,
        score_white, score_black,
        white_attacker_exp_before, white_defender_exp_before,
        black_attacker_exp_before, black_defender_exp_before,
        white_attacker_exp_after, white_defender_exp_after,
        black_attacker_exp_after, black_defender_exp_after,
        white_attacker_hp_before, white_defender_hp_before,
        black_attacker_hp_before, black_defender_hp_before,
        white_attacker_hp_after, white_defender_hp_after,
        black_attacker_hp_after, black_defender_hp_after,
        white_attacker_mana_before, white_defender_mana_before,
        black_attacker_mana_before, black_defender_mana_before,
        white_attacker_mana_after, white_defender_mana_after,
        black_attacker_mana_after, black_defender_mana_after,
        added_by
    ) VALUES (
        p_white_attacker, p_white_defender,
        p_black_attacker, p_black_defender,
        p_score_white, p_score_black,
        v_white_attacker_stats.exp, v_white_defender_stats.exp,
        v_black_attacker_stats.exp, v_black_defender_stats.exp,
        v_white_attacker_exp_after, v_white_defender_exp_after,
        v_black_attacker_exp_after, v_black_defender_exp_after,
        v_white_attacker_stats.hp, v_white_defender_stats.hp,
        v_black_attacker_stats.hp, v_black_defender_stats.hp,
        v_white_attacker_hp_after, v_white_defender_hp_after,
        v_black_attacker_hp_after, v_black_defender_hp_after,
        v_white_attacker_stats.mana, v_white_defender_stats.mana,
        v_black_attacker_stats.mana, v_black_defender_stats.mana,
        v_white_attacker_mana_after, v_white_defender_mana_after,
        v_black_attacker_mana_after, v_black_defender_mana_after,
        p_added_by
    ) RETURNING id INTO v_match_id;

    -- Mettre à jour les joueurs
    UPDATE players SET
        exp = v_white_attacker_exp_after,
        hp = v_white_attacker_hp_after,
        mana = v_white_attacker_mana_after
    WHERE id = p_white_attacker;

    UPDATE players SET
        exp = v_white_defender_exp_after,
        hp = v_white_defender_hp_after,
        mana = v_white_defender_mana_after
    WHERE id = p_white_defender;

    UPDATE players SET
        exp = v_black_attacker_exp_after,
        hp = v_black_attacker_hp_after,
        mana = v_black_attacker_mana_after
    WHERE id = p_black_attacker;

    UPDATE players SET
        exp = v_black_defender_exp_after,
        hp = v_black_defender_hp_after,
        mana = v_black_defender_mana_after
    WHERE id = p_black_defender;

    -- Retourner les résultats
    RETURN QUERY
    SELECT p.id, p.pseudo, 
           v_white_attacker_stats.exp, v_white_attacker_exp_after,
           v_white_attacker_stats.mana, v_white_attacker_mana_after,
           v_white_attacker_stats.hp, v_white_attacker_hp_after
    FROM players p WHERE p.id = p_white_attacker
    UNION ALL
    SELECT p.id, p.pseudo,
           v_white_defender_stats.exp, v_white_defender_exp_after,
           v_white_defender_stats.mana, v_white_defender_mana_after,
           v_white_defender_stats.hp, v_white_defender_hp_after
    FROM players p WHERE p.id = p_white_defender
    UNION ALL
    SELECT p.id, p.pseudo,
           v_black_attacker_stats.exp, v_black_attacker_exp_after,
           v_black_attacker_stats.mana, v_black_attacker_mana_after,
           v_black_attacker_stats.hp, v_black_attacker_hp_after
    FROM players p WHERE p.id = p_black_attacker
    UNION ALL
    SELECT p.id, p.pseudo,
           v_black_defender_stats.exp, v_black_defender_exp_after,
           v_black_defender_stats.mana, v_black_defender_mana_after,
           v_black_defender_stats.hp, v_black_defender_hp_after
    FROM players p WHERE p.id = p_black_defender;
END;
$function$
```

## Règles métier importantes
1. Un match doit avoir un gagnant (pas de match nul)
2. Le score gagnant doit être de 10
3. Les ressources (HP, mana) ne peuvent pas descendre en dessous de 0
4. L'EXP ne peut qu'augmenter après la soumission d'un match
5. L'XP est calculée en fonction du niveau des adversaires
6. La rejouabilité limite les gains d'XP entre partenaires fréquents
7. Les pénalités d'XP s'appliquent en cas de mana = 0 ou HP = 0
8. Tous les calculs d'XP sont arrondis à l'unité supérieure

## Dépendances
- Fonction `get_players_level()` : Récupère les statistiques et niveaux des joueurs
- Fonction `get_replayability()` : Calcule le taux de rejouabilité entre deux joueurs
- Table `game_config` : Configuration du jeu (exp_rate)
- Table `players` : Données des joueurs
- Table `matches` : Historique des matchs

## Règles de Pénalités d'XP

La fonction applique des pénalités d'XP dans les cas suivants :

1. **Joueur avec 0 mana** :
   - Reçoit 50% de l'XP si l'adversaire est d'un niveau inférieur
   - Exemple : Un joueur niveau 10 avec 0 mana gagnant contre un joueur niveau 5

2. **Joueur avec 0 HP** :
   - Reçoit 50% de l'XP si l'adversaire est d'un niveau supérieur ou égal
   - Exemple : Un joueur niveau 5 avec 0 HP gagnant contre un joueur niveau 10

3. **Rejouabilité élevée** :
   - Aucune XP si la rejouabilité avec son partenaire est > 50%
   - La rejouabilité augmente en fonction du nombre de matchs joués ensemble récemment