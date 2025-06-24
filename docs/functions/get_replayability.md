# Fonction get_replayability

## Objectif
Calculer le taux de rejouabilité d'un joueur avec son partenaire en se basant sur les 6 derniers matchs joués.

## Paramètres d'entrée
- `p_player_id` : UUID du joueur dont on veut calculer la rejouabilité
- `p_partner_id` : UUID du partenaire avec lequel on veut calculer la rejouabilité

## Étapes de traitement

### 1. Récupération des données
- Sélectionne les 6 derniers matchs du joueur depuis la table `matches`
- Identifie les matchs où le joueur a joué avec le partenaire spécifié dans la même équipe

### 2. Calcul du taux de rejouabilité
- Compte le nombre total de matchs parmi les 6 derniers
- Compte le nombre de matchs joués avec le partenaire dans la même équipe
- Calcule le ratio : (matchs avec partenaire) / 6

## Valeur de retour
- Retourne un nombre décimal (float) entre 0 et 1
- 0 signifie que le joueur n'a pas joué avec ce partenaire dans ses 6 derniers matchs
- 1 signifie que le joueur a joué tous ses 6 derniers matchs avec ce partenaire
- Une valeur de 0.5 signifie que le joueur a joué 3 de ses 6 derniers matchs avec ce partenaire

## Règles métier importantes
1. Seuls les 6 derniers matchs sont pris en compte
2. Si le joueur a joué moins de 6 matchs, le dénominateur reste 6 (et non le nombre de matchs joués)
   - Exemple : Si un joueur a joué 2 matchs au total et tous les deux avec le même partenaire, sa rejouabilité sera de 2/6 = 0.33 et non 2/2 = 1
3. Le taux est calculé uniquement pour les matchs où les joueurs étaient dans la même équipe
4. Les joueurs doivent être dans la même équipe (noir ou blanc) pour que le match soit compté
5. La rejouabilité peut être différente dans les deux sens :
   - A → B peut avoir une rejouabilité différente de B → A
   - Cela dépend des 6 derniers matchs de chaque joueur

## Exemple d'utilisation
```sql
-- Vérifier la rejouabilité entre deux joueurs
SELECT get_replayability('uuid-du-joueur', 'uuid-du-partenaire');
-- Retourne par exemple 0.33 si le joueur a joué 2 matchs sur 6 avec ce partenaire

-- Vérifier la rejouabilité dans les deux sens
SELECT 
    get_replayability('joueur-a', 'joueur-b') as a_vers_b,
    get_replayability('joueur-b', 'joueur-a') as b_vers_a;
```

## Impact sur le gameplay
- Un taux de rejouabilité supérieur à 0.5 (50%) empêchera le gain d'expérience lors d'un match
- Cette mécanique encourage la diversité des équipes et évite le "farming" d'expérience avec les mêmes partenaires
- Le système prend en compte uniquement les partenaires de la même équipe, pas les adversaires

## Implémentation SQL
```sql
CREATE OR REPLACE FUNCTION public.get_replayability(player_id uuid, partner_id uuid)
RETURNS double precision
LANGUAGE plpgsql
AS $function$
DECLARE
    matches_with_partner integer;
    max_matches integer := 6; -- Nombre maximum de matchs à considérer
BEGIN
    WITH player_matches AS (
        SELECT id, date
        FROM matches
        WHERE white_attacker = player_id 
           OR white_defender = player_id 
           OR black_attacker = player_id 
           OR black_defender = player_id
        ORDER BY date DESC
        LIMIT max_matches
    )
    SELECT COUNT(*) INTO matches_with_partner
    FROM player_matches pm
    WHERE EXISTS (
        SELECT 1 
        FROM matches m 
        WHERE m.id = pm.id
        AND (
            -- Même équipe blanche
            (m.white_attacker = player_id AND m.white_defender = partner_id)
            OR (m.white_defender = player_id AND m.white_attacker = partner_id)
            -- Même équipe noire
            OR (m.black_attacker = player_id AND m.black_defender = partner_id)
            OR (m.black_defender = player_id AND m.black_attacker = partner_id)
        )
    );

    RETURN matches_with_partner::float / max_matches;
END;
$function$;
```

## Exemples de cas réels

### Cas 1 : Rejouabilité asymétrique
```sql
-- Joueur A a fait 6 matchs récents, dont 2 avec B
SELECT get_replayability('joueur-a', 'joueur-b'); -- Retourne 0.33

-- Joueur B a fait 6 matchs récents, dont 3 avec A
SELECT get_replayability('joueur-b', 'joueur-a'); -- Retourne 0.5
```

### Cas 2 : Joueur avec peu de matchs
```sql
-- Joueur C n'a fait que 2 matchs, tous avec D
SELECT get_replayability('joueur-c', 'joueur-d'); -- Retourne 0.33 (2/6)

-- Pas 1.0 (2/2) car le dénominateur est toujours 6
```

### Cas 3 : Adversaires non comptés
```sql
-- Même si A et B ont joué 6 matchs l'un contre l'autre
-- S'ils n'étaient jamais dans la même équipe
SELECT get_replayability('joueur-a', 'joueur-b'); -- Retourne 0.0
``` 