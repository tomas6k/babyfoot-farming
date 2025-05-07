# Fonction get_players_level

## Description
Cette fonction retourne la liste des joueurs avec leurs niveaux et statistiques, incluant les joueurs actifs et désactivés.

## Paramètres
Aucun paramètre requis.

## Valeurs de retour
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique du joueur |
| pseudo | TEXT | Pseudonyme du joueur |
| exp | INTEGER | Points d'expérience |
| level | INTEGER | Niveau actuel du joueur |
| title | VARCHAR(255) | Titre correspondant au niveau |
| description | VARCHAR(255) | Description du niveau |
| illustration_url | VARCHAR(255) | URL de l'illustration du niveau |
| required_exp | INTEGER | Expérience requise pour être à ce niveau |
| exp_given | INTEGER | Expérience donnée quand ce joueur est battu |
| next_level_exp | INTEGER | Points d'expérience requis pour le prochain niveau |
| progress | FLOAT | Pourcentage de progression vers le prochain niveau (0-100) |
| mana | INTEGER | Points de mana actuels |
| hp | INTEGER | Points de vie actuels |
| disable | BOOLEAN | Indique si le joueur est désactivé |

## Implémentation
```sql
CREATE OR REPLACE FUNCTION get_players_level()
RETURNS TABLE (
    id UUID,
    pseudo TEXT,
    exp INTEGER,
    level INTEGER,
    title VARCHAR(255),
    description VARCHAR(255),
    illustration_url VARCHAR(255),
    required_exp INTEGER,
    exp_given INTEGER,
    next_level_exp INTEGER,
    progress FLOAT,
    mana INTEGER,
    hp INTEGER,
    disable BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Récupération du prochain niveau d'expérience pour chaque niveau
    next_levels AS (
        SELECT 
            lwi.level as lvl, 
            lwi.required_exp, 
            LEAD(lwi.required_exp) OVER (ORDER BY lwi.level) as next_level_exp
        FROM levels_with_info lwi
    ),
    -- Association des joueurs avec leurs niveaux
    player_levels AS (
        SELECT 
            p.*,
            l.level,
            l.display_title::VARCHAR(255) as title,
            l.display_description::VARCHAR(255) as description,
            l.display_illustration::VARCHAR(255) as illustration_url,
            l.required_exp,
            l.exp_given,
            nl.next_level_exp
        FROM players p
        LEFT JOIN LATERAL (
            SELECT *
            FROM levels_with_info lwi
            WHERE lwi.required_exp <= p.exp
            ORDER BY lwi.required_exp DESC
            LIMIT 1
        ) l ON true
        LEFT JOIN next_levels nl ON l.level = nl.lvl
    )
    SELECT 
        pl.id,
        pl.pseudo,
        pl.exp,
        COALESCE(pl.level, 1) as level,
        COALESCE(pl.title, 'Gueux'::VARCHAR(255)) as title,
        COALESCE(pl.description, 'L''homme sans terre ni titre, au bas de l''échelle.'::VARCHAR(255)) as description,
        COALESCE(pl.illustration_url, 'https://xkvxpwsyvdvjrxnwtban.supabase.co/storage/v1/object/public/title//1.png'::VARCHAR(255)) as illustration_url,
        COALESCE(pl.required_exp, 0) as required_exp,
        COALESCE(pl.exp_given, 10) as exp_given,
        COALESCE(pl.next_level_exp, 20) as next_level_exp,
        CASE 
            WHEN pl.next_level_exp IS NULL THEN 100
            WHEN (pl.next_level_exp - COALESCE(pl.required_exp, 0)) = 0 THEN 
                CASE 
                    WHEN pl.level = 1 THEN 0  -- Cas spécial pour niveau 1
                    ELSE 100                  -- Cas pour autres niveaux
                END
            ELSE GREATEST(0, LEAST(100, 
                ((pl.exp - COALESCE(pl.required_exp, 0))::FLOAT / 
                 (pl.next_level_exp - COALESCE(pl.required_exp, 0))::FLOAT * 100)))
        END as progress,
        pl.mana,
        pl.hp,
        pl.disable
    FROM player_levels pl
    ORDER BY pl.exp DESC;
END;
$$ LANGUAGE plpgsql;
```

## Performance
- Utilise un index sur la colonne `exp` de la table `players`
- Utilise un index sur la colonne `required_exp` de la table `levels_with_info`
- Emploie des CTEs pour la lisibilité et la maintenabilité
- JOIN LATERAL pour une recherche efficace du niveau actuel
- Calcul optimisé de la progression avec gestion des cas limites
- Résultats triés par expérience (décroissant)

## Tests effectués
```sql
-- Test : Récupération de tous les joueurs avec leurs informations complètes
SELECT * FROM get_players_level();

-- Résultats réels (au 2024-05-26) :
-- Joueur 1
{
  "id": "a8378bf4-696a-4242-a3b7-c6cf3cb2d62b",
  "pseudo": "Rafa",
  "exp": 90,
  "level": 4,
  "title": "Mendiant",
  "description": "Errant des rues, vivant d'aumônes et de bonté.",
  "illustration_url": "https://xkvxpwsyvdvjrxnwtban.supabase.co/storage/v1/object/public/title//2.png",
  "required_exp": 66,
  "exp_given": 19,
  "next_level_exp": 92,
  "progress": 92.31,
  "mana": 4,
  "hp": 5,
  "disable": false
}

-- Joueur 2
{
  "id": "f4979a15-9cad-4d3a-a79e-56f95b069504",
  "pseudo": "Toshi",
  "exp": 30,
  "level": 2,
  "title": "Gueux",
  "description": "L'homme sans terre ni titre, au bas de l'échelle.",
  "illustration_url": "https://xkvxpwsyvdvjrxnwtban.supabase.co/storage/v1/object/public/title//1.png",
  "required_exp": 20,
  "exp_given": 13,
  "next_level_exp": 42,
  "progress": 45.45,
  "mana": 4,
  "hp": 5,
  "disable": false
}

-- Joueur 3
{
  "id": "e3158b2e-be21-4ad5-8ff0-cf02ca20a519",
  "pseudo": "Tomas",
  "exp": 0,
  "level": 1,
  "title": "Gueux",
  "description": "L'homme sans terre ni titre, au bas de l'échelle.",
  "illustration_url": "https://xkvxpwsyvdvjrxnwtban.supabase.co/storage/v1/object/public/title//1.png",
  "required_exp": 0,
  "exp_given": 10,
  "next_level_exp": 20,
  "progress": 0.0,
  "mana": 4,
  "hp": 4,
  "disable": false
}

-- Joueur 4
{
  "id": "5ea232a9-78d9-46ca-8488-5bfa8148c274",
  "pseudo": "Dodo",
  "exp": 0,
  "level": 1,
  "title": "Gueux",
  "description": "L'homme sans terre ni titre, au bas de l'échelle.",
  "illustration_url": "https://xkvxpwsyvdvjrxnwtban.supabase.co/storage/v1/object/public/title//1.png",
  "required_exp": 0,
  "exp_given": 10,
  "next_level_exp": 20,
  "progress": 0.0,
  "mana": 4,
  "hp": 4,
  "disable": false
}
```

## Modifications apportées
1. Amélioration de la vue `levels_with_info` pour hériter correctement des attributs des niveaux précédents
2. Correction du calcul de progression pour tous les cas spéciaux (niveaux sans next_level_exp ou avec required_exp égal à next_level_exp)
3. Correction des chemins d'accès aux illustrations pour utiliser systématiquement Supabase Storage
4. Optimisation de la récupération du next_level_exp avec une CTE séparée

## Statistiques actuelles
- Nombre total de joueurs : 4
- Joueurs actifs : 4
- Joueurs désactivés : 0
- Niveau maximum atteint : 4 (Rafa)
- Expérience maximum : 90
- Progression maximum : 92.31% (Rafa vers niveau 5)

## Règles métier importantes
1. Un joueur est toujours au moins niveau 1 (Gueux)
2. Le niveau est déterminé par la table `levels_with_info` basée sur l'expérience du joueur
3. L'expérience requise pour le prochain niveau est déterminée via la fonction LEAD SQL
4. La progression est un pourcentage entre 0 et 100, calculé comme suit:
   - `(exp_actuel - exp_requis_niveau_actuel) / (exp_requis_niveau_suivant - exp_requis_niveau_actuel) * 100`
5. Cas particuliers de progression:
   - Si le joueur est au niveau maximum (next_level_exp est NULL): 100%
   - Si le joueur est niveau 1 avec 0 exp: 0%
   - Pour les autres niveaux où required_exp = next_level_exp: 100%
6. Le statut de désactivation (`disable`) est retourné pour permettre un filtrage côté application

## Impact sur le gameplay
- Permet d'afficher le niveau et les informations associées dans l'interface utilisateur
- Utilisé pour le calcul des gains d'expérience lors des matchs
- Permet de suivre la progression des joueurs vers le niveau suivant
- Affiche les titres et illustrations correspondant au niveau
- Permet de filtrer les joueurs actifs/désactivés selon les besoins de l'interface

## Tables associées
1. Table `players` :
```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    pseudo TEXT NOT NULL UNIQUE CHECK (char_length(pseudo) >= 3 AND char_length(pseudo) <= 20),
    exp INTEGER NOT NULL DEFAULT 0 CHECK (exp >= 0),
    mana INTEGER NOT NULL DEFAULT 5 CHECK (mana >= 0 AND mana <= 10),
    hp INTEGER NOT NULL DEFAULT 5 CHECK (hp >= 0 AND hp <= 10),
    disable BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

2. Table `levels` et vue `levels_with_info` :
```sql
CREATE TABLE levels (
    level INTEGER PRIMARY KEY,
    min_exp INTEGER NOT NULL,
    exp_given INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    illustration VARCHAR(255)
);

-- Vue récursive qui gère l'héritage des attributs manquants entre niveaux
CREATE OR REPLACE VIEW levels_with_info AS 
WITH RECURSIVE level_inheritance AS (
    -- Niveau de base
    SELECT 
        l.level,
        l.min_exp AS required_exp,
        l.exp_given,
        l.title AS display_title,
        l.description AS display_description,
        l.illustration AS display_illustration
    FROM levels l
    WHERE level = 1
    
    UNION ALL
    
    -- Niveaux suivants avec héritage
    SELECT 
        l.level,
        l.min_exp AS required_exp,
        l.exp_given,
        COALESCE(l.title, li.display_title) AS display_title,
        COALESCE(l.description, li.display_description) AS display_description,
        COALESCE(l.illustration, li.display_illustration) AS display_illustration
    FROM levels l
    JOIN level_inheritance li ON l.level = li.level + 1
)
SELECT DISTINCT ON (level)
    level,
    required_exp,
    exp_given,
    display_title,
    display_description,
    display_illustration
FROM level_inheritance
ORDER BY level;
```

## Exemple de retour JSON
```json
{
  "id": "f4979a15-9cad-4d3a-a79e-56f95b069504",
  "pseudo": "Toshi",
  "exp": 30,
  "level": 2,
  "title": "Gueux",
  "description": "L'homme sans terre ni titre, au bas de l'échelle.",
  "illustration_url": "https://xkvxpwsyvdvjrxnwtban.supabase.co/storage/v1/object/public/title//1.png",
  "required_exp": 20,
  "exp_given": 13,
  "next_level_exp": 42,
  "progress": 45.45,
  "mana": 4,
  "hp": 5,
  "disable": false
}
```