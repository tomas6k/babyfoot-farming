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
  - Si gagnant a 0 mana et l'adversaire est de niveau inférieur : exp_given * 0.5
  - Si gagnant a 0 HP et l'adversaire est de niveau ≥ au sien : exp_given * 0.5
  - Sinon : exp_given complet
- Calcul total : somme des XP des deux perdants / 2
- Multiplié par exp_rate depuis game_config

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

## Implémentation SQL
```sql
CREATE OR REPLACE FUNCTION process_match(
    p_white_attacker uuid,
    p_white_defender uuid,
    p_black_attacker uuid,
    p_black_defender uuid,
    p_score_white integer,
    p_score_black integer,
    p_added_by uuid DEFAULT NULL
)
RETURNS TABLE (
    player_id uuid,
    pseudo text,
    old_exp integer,
    new_exp integer,
    old_mana integer,
    new_mana integer,
    old_hp integer,
    new_hp integer
) AS $$
DECLARE
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
    v_match_id uuid;
BEGIN
    -- Récupérer exp_rate de game_config
    SELECT COALESCE((SELECT value::float FROM game_config WHERE key = 'exp_rate'), 1.0)
    INTO v_exp_rate;

    -- Récupérer les statistiques actuelles des joueurs avec leurs niveaux
    SELECT * INTO v_white_attacker_stats FROM get_players_level() WHERE id = p_white_attacker;
    SELECT * INTO v_white_defender_stats FROM get_players_level() WHERE id = p_white_defender;
    SELECT * INTO v_black_attacker_stats FROM get_players_level() WHERE id = p_black_attacker;
    SELECT * INTO v_black_defender_stats FROM get_players_level() WHERE id = p_black_defender;

    -- Initialiser les valeurs after avec les valeurs before
    v_white_attacker_exp_after := v_white_attacker_stats.exp;
    v_white_defender_exp_after := v_white_defender_stats.exp;
    v_black_attacker_exp_after := v_black_attacker_stats.exp;
    v_black_defender_exp_after := v_black_defender_stats.exp;

    -- Calculer les nouvelles valeurs de mana (tous les joueurs perdent 1 mana)
    v_white_attacker_mana_after := GREATEST(0, v_white_attacker_stats.mana - 1);
    v_white_defender_mana_after := GREATEST(0, v_white_defender_stats.mana - 1);
    v_black_attacker_mana_after := GREATEST(0, v_black_attacker_stats.mana - 1);
    v_black_defender_mana_after := GREATEST(0, v_black_defender_stats.mana - 1);

    -- Calculer les nouvelles valeurs de HP et XP selon le vainqueur
    IF p_score_white > p_score_black THEN
        -- L'équipe noire perd
        v_white_attacker_hp_after := v_white_attacker_stats.hp;
        v_white_defender_hp_after := v_white_defender_stats.hp;
        v_black_attacker_hp_after := GREATEST(0, v_black_attacker_stats.hp - 1);
        v_black_defender_hp_after := GREATEST(0, v_black_defender_stats.hp - 1);

        -- Calculer l'XP pour les gagnants (équipe blanche)
        IF get_replayability(p_white_attacker, p_white_defender) <= 0.5 THEN
            -- Calculer l'XP pour l'attaquant blanc
            v_white_attacker_exp_after := v_white_attacker_stats.exp + (
                CASE 
                    WHEN v_white_attacker_stats.mana = 0 AND v_black_attacker_stats.exp < v_white_attacker_stats.exp 
                    THEN v_black_attacker_stats.exp_given * 0.5
                    WHEN v_white_attacker_stats.hp = 0 AND v_black_attacker_stats.exp >= v_white_attacker_stats.exp 
                    THEN v_black_attacker_stats.exp_given * 0.5
                    ELSE v_black_attacker_stats.exp_given
                END +
                CASE 
                    WHEN v_white_attacker_stats.mana = 0 AND v_black_defender_stats.exp < v_white_attacker_stats.exp 
                    THEN v_black_defender_stats.exp_given * 0.5
                    WHEN v_white_attacker_stats.hp = 0 AND v_black_defender_stats.exp >= v_white_attacker_stats.exp 
                    THEN v_black_defender_stats.exp_given * 0.5
                    ELSE v_black_defender_stats.exp_given
                END
            ) * v_exp_rate / 2;
        END IF;

        IF get_replayability(p_white_defender, p_white_attacker) <= 0.5 THEN
            -- Calculer l'XP pour le défenseur blanc
            v_white_defender_exp_after := v_white_defender_stats.exp + (
                CASE 
                    WHEN v_white_defender_stats.mana = 0 AND v_black_attacker_stats.exp < v_white_defender_stats.exp 
                    THEN v_black_attacker_stats.exp_given * 0.5
                    WHEN v_white_defender_stats.hp = 0 AND v_black_attacker_stats.exp >= v_white_defender_stats.exp 
                    THEN v_black_attacker_stats.exp_given * 0.5
                    ELSE v_black_attacker_stats.exp_given
                END +
                CASE 
                    WHEN v_white_defender_stats.mana = 0 AND v_black_defender_stats.exp < v_white_defender_stats.exp 
                    THEN v_black_defender_stats.exp_given * 0.5
                    WHEN v_white_defender_stats.hp = 0 AND v_black_defender_stats.exp >= v_white_defender_stats.exp 
                    THEN v_black_defender_stats.exp_given * 0.5
                    ELSE v_black_defender_stats.exp_given
                END
            ) * v_exp_rate / 2;
        END IF;

    ELSE
        -- L'équipe blanche perd
        v_white_attacker_hp_after := GREATEST(0, v_white_attacker_stats.hp - 1);
        v_white_defender_hp_after := GREATEST(0, v_white_defender_stats.hp - 1);
        v_black_attacker_hp_after := v_black_attacker_stats.hp;
        v_black_defender_hp_after := v_black_defender_stats.hp;

        -- Calculer l'XP pour les gagnants (équipe noire)
        IF get_replayability(p_black_attacker, p_black_defender) <= 0.5 THEN
            -- Calculer l'XP pour l'attaquant noir
            v_black_attacker_exp_after := v_black_attacker_stats.exp + (
                CASE 
                    WHEN v_black_attacker_stats.mana = 0 AND v_white_attacker_stats.exp < v_black_attacker_stats.exp 
                    THEN v_white_attacker_stats.exp_given * 0.5
                    WHEN v_black_attacker_stats.hp = 0 AND v_white_attacker_stats.exp >= v_black_attacker_stats.exp 
                    THEN v_white_attacker_stats.exp_given * 0.5
                    ELSE v_white_attacker_stats.exp_given
                END +
                CASE 
                    WHEN v_black_attacker_stats.mana = 0 AND v_white_defender_stats.exp < v_black_attacker_stats.exp 
                    THEN v_white_defender_stats.exp_given * 0.5
                    WHEN v_black_attacker_stats.hp = 0 AND v_white_defender_stats.exp >= v_black_attacker_stats.exp 
                    THEN v_white_defender_stats.exp_given * 0.5
                    ELSE v_white_defender_stats.exp_given
                END
            ) * v_exp_rate / 2;
        END IF;

        IF get_replayability(p_black_defender, p_black_attacker) <= 0.5 THEN
            -- Calculer l'XP pour le défenseur noir
            v_black_defender_exp_after := v_black_defender_stats.exp + (
                CASE 
                    WHEN v_black_defender_stats.mana = 0 AND v_white_attacker_stats.exp < v_black_defender_stats.exp 
                    THEN v_white_attacker_stats.exp_given * 0.5
                    WHEN v_black_defender_stats.hp = 0 AND v_white_attacker_stats.exp >= v_black_defender_stats.exp 
                    THEN v_white_attacker_stats.exp_given * 0.5
                    ELSE v_white_attacker_stats.exp_given
                END +
                CASE 
                    WHEN v_black_defender_stats.mana = 0 AND v_white_defender_stats.exp < v_black_defender_stats.exp 
                    THEN v_white_defender_stats.exp_given * 0.5
                    WHEN v_black_defender_stats.hp = 0 AND v_white_defender_stats.exp >= v_black_defender_stats.exp 
                    THEN v_white_defender_stats.exp_given * 0.5
                    ELSE v_white_defender_stats.exp_given
                END
            ) * v_exp_rate / 2;
        END IF;
    END IF;

    -- Insérer le match
    INSERT INTO matches (
        date,
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
        added_by,
        created_at,
        updated_at
    ) VALUES (
        NOW(),
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
        p_added_by,
        NOW(),
        NOW()
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
$$ LANGUAGE plpgsql;
```

## Règles métier importantes
1. Un match doit avoir un gagnant (pas de match nul)
2. Le score gagnant doit être de 10
3. Les ressources (HP, mana) ne peuvent pas descendre en dessous de 0
4. L'EXP ne peut qu'augmenter après la soumission d'un match
5. L'XP est calculée en fonction du niveau des adversaires
6. La rejouabilité limite les gains d'XP entre partenaires fréquents
7. Les pénalités d'XP s'appliquent en cas de mana = 0 ou HP = 0

## Dépendances
- Fonction `get_players_level()` : Récupère les statistiques et niveaux des joueurs
- Fonction `get_replayability()` : Calcule le taux de rejouabilité entre deux joueurs
- Table `game_config` : Configuration du jeu (exp_rate)
- Table `players` : Données des joueurs
- Table `matches` : Historique des matchs

## Exemple de Test

### Scénario
Match entre :
- Équipe blanche : Dorian (attaquant) et Anthony (défenseur)
- Équipe noire : Remi (attaquant) et Seg (défenseur)
- Score : 10-8 pour l'équipe blanche

### Appel
```sql
SELECT * FROM process_match(
    '006d04cd-9be7-4f94-a92e-09860fded8d9', -- Dorian (white attacker)
    'b18c573a-f1d5-4225-a5e7-bd8b11ed705c', -- Anthony (white defender)
    '1d063428-828e-4ac6-8362-c827037d1a3a', -- Remi (black attacker)
    '959e8e2c-40a4-498f-844b-48396c48ce3f', -- Seg (black defender)
    10, -- score white
    8   -- score black
);
```

### Résultat
```json
[
  {
    "player_id": "006d04cd-9be7-4f94-a92e-09860fded8d9",
    "pseudo": "Dorian",
    "old_exp": 300,
    "new_exp": 338,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 5
  },
  {
    "player_id": "b18c573a-f1d5-4225-a5e7-bd8b11ed705c",
    "pseudo": "Anthony",
    "old_exp": 200,
    "new_exp": 200,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 5
  },
  {
    "player_id": "1d063428-828e-4ac6-8362-c827037d1a3a",
    "pseudo": "Remi",
    "old_exp": 250,
    "new_exp": 250,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 4
  },
  {
    "player_id": "959e8e2c-40a4-498f-844b-48396c48ce3f",
    "pseudo": "Seg",
    "old_exp": 200,
    "new_exp": 200,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 4
  }
]
```

### Analyse des Résultats
1. **Mana** : Tous les joueurs ont perdu 1 point de mana (5 → 4)
2. **HP** : 
   - L'équipe gagnante (blanche) conserve ses HP
   - L'équipe perdante (noire) perd 1 HP chacun
3. **EXP** :
   - Seul Dorian (attaquant blanc) gagne de l'expérience (+38)
   - Anthony ne gagne pas d'XP (probablement dû à la rejouabilité)
   - Les perdants ne gagnent pas d'XP

## Test 2 : Match avec joueurs sans mana

### Scénario
Match entre :
- Équipe blanche : Patate (attaquant, 0 mana) et Quentin (défenseur, 0 mana)
- Équipe noire : Toshi (attaquant) et Mickael (défenseur)
- Score : 10-5 pour l'équipe blanche

### Appel
```sql
SELECT * FROM process_match(
    '360a69a8-e106-4c9d-ac18-363184e21e72', -- Patate (white attacker, 0 mana)
    '559c24df-d13b-4cac-a3c9-3f0731d93199', -- Quentin (white defender, 0 mana)
    'f742b196-5955-4a91-b016-f980a270783c', -- Toshi (black attacker)
    '386015a4-6a51-435c-9443-46ee946ca848', -- Mickael (black defender)
    10, -- score white
    5  -- score black
);
```

### Résultat
```json
[
  {
    "player_id": "360a69a8-e106-4c9d-ac18-363184e21e72",
    "pseudo": "Patate",
    "old_exp": 0,
    "new_exp": 10,
    "old_mana": 0,
    "new_mana": 0,
    "old_hp": 5,
    "new_hp": 5
  },
  {
    "player_id": "559c24df-d13b-4cac-a3c9-3f0731d93199",
    "pseudo": "Quentin",
    "old_exp": 0,
    "new_exp": 10,
    "old_mana": 0,
    "new_mana": 0,
    "old_hp": 5,
    "new_hp": 5
  },
  {
    "player_id": "f742b196-5955-4a91-b016-f980a270783c",
    "pseudo": "Toshi",
    "old_exp": 0,
    "new_exp": 0,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 4
  },
  {
    "player_id": "386015a4-6a51-435c-9443-46ee946ca848",
    "pseudo": "Mickael",
    "old_exp": 0,
    "new_exp": 0,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 4
  }
]
```

### Analyse des Résultats
1. **Mana** : 
   - Les joueurs avec mana perdent 1 point (5 → 4)
   - Les joueurs sans mana restent à 0
2. **HP** : 
   - L'équipe gagnante (blanche) conserve ses HP
   - L'équipe perdante (noire) perd 1 HP chacun
3. **EXP** :
   - Les gagnants reçoivent moins d'XP (10 points) car ils n'ont pas de mana
   - Les perdants ne gagnent pas d'XP

## Test 3 : Match avec joueurs sans HP

### Scénario
Match entre :
- Équipe blanche : Diep (attaquant, 0 HP) et Houss (défenseur, 0 HP)
- Équipe noire : Max la menace (attaquant) et Rafa (défenseur)
- Score : 10-7 pour l'équipe blanche

### Appel
```sql
SELECT * FROM process_match(
    'e043db0d-66a3-47a1-a5f0-2a802fed076b', -- Diep (white attacker, 0 HP)
    '7e0c95af-c1df-4ef5-9358-2313373069d9', -- Houss (white defender, 0 HP)
    '7b392cc2-afb7-4933-b380-3721f14f8da1', -- Max la menace (black attacker)
    '3fd9be1d-bd56-47ea-86db-d68d78d9a9c5', -- Rafa (black defender)
    10, -- score white
    7  -- score black
);
```

### Résultat
```json
[
  {
    "player_id": "e043db0d-66a3-47a1-a5f0-2a802fed076b",
    "pseudo": "Diep",
    "old_exp": 0,
    "new_exp": 5,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 0,
    "new_hp": 0
  },
  {
    "player_id": "7e0c95af-c1df-4ef5-9358-2313373069d9",
    "pseudo": "Houss",
    "old_exp": 0,
    "new_exp": 5,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 0,
    "new_hp": 0
  },
  {
    "player_id": "7b392cc2-afb7-4933-b380-3721f14f8da1",
    "pseudo": "Max la menace",
    "old_exp": 0,
    "new_exp": 0,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 4
  },
  {
    "player_id": "3fd9be1d-bd56-47ea-86db-d68d78d9a9c5",
    "pseudo": "Rafa",
    "old_exp": 0,
    "new_exp": 0,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 4
  }
]
```

### Analyse des Résultats
1. **Mana** : Tous les joueurs perdent 1 point de mana (5 → 4)
2. **HP** : 
   - Les joueurs avec 0 HP restent à 0
   - L'équipe perdante (noire) perd 1 HP chacun
3. **EXP** :
   - Les gagnants reçoivent moins d'XP (5 points) car ils n'ont pas de HP
   - Les perdants ne gagnent pas d'XP

## Test 4 : Match avec rejouabilité élevée

### Scénario
Match entre des joueurs ayant déjà joué 5 matchs ensemble dans la dernière heure :
- Équipe blanche : Dorian (attaquant) et Anthony (défenseur)
- Équipe noire : Remi (attaquant) et Seg (défenseur)
- Score : 10-6 pour l'équipe blanche
- Rejouabilité : 100% entre les partenaires

### Appel
```sql
SELECT * FROM process_match(
    '006d04cd-9be7-4f94-a92e-09860fded8d9', -- Dorian (white attacker)
    'b18c573a-f1d5-4225-a5e7-bd8b11ed705c', -- Anthony (white defender)
    '1d063428-828e-4ac6-8362-c827037d1a3a', -- Remi (black attacker)
    '959e8e2c-40a4-498f-844b-48396c48ce3f', -- Seg (black defender)
    10, -- score white
    6  -- score black
);
```

### Résultat
```json
[
  {
    "player_id": "006d04cd-9be7-4f94-a92e-09860fded8d9",
    "pseudo": "Dorian",
    "old_exp": 0,
    "new_exp": 0,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 5
  },
  {
    "player_id": "b18c573a-f1d5-4225-a5e7-bd8b11ed705c",
    "pseudo": "Anthony",
    "old_exp": 0,
    "new_exp": 0,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 5
  },
  {
    "player_id": "1d063428-828e-4ac6-8362-c827037d1a3a",
    "pseudo": "Remi",
    "old_exp": 0,
    "new_exp": 0,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 4
  },
  {
    "player_id": "959e8e2c-40a4-498f-844b-48396c48ce3f",
    "pseudo": "Seg",
    "old_exp": 0,
    "new_exp": 0,
    "old_mana": 5,
    "new_mana": 4,
    "old_hp": 5,
    "new_hp": 4
  }
]
```

### Analyse des Résultats
1. **Mana** : Tous les joueurs perdent 1 point de mana (5 → 4)
2. **HP** : 
   - L'équipe gagnante (blanche) conserve ses HP
   - L'équipe perdante (noire) perd 1 HP chacun
3. **EXP** :
   - Aucun joueur ne gagne d'XP à cause de la rejouabilité élevée (> 50%)
   - La fonction `get_replayability()` retourne 100% pour les deux paires

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