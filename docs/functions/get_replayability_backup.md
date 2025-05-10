# Sauvegarde de la fonction get_replayability originale

Voici la version originale de la fonction `get_replayability` avant correction :

```sql
CREATE OR REPLACE FUNCTION public.get_replayability(player_id uuid, partner_id uuid)
 RETURNS double precision
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_matches integer;
    matches_with_partner integer;
BEGIN
    -- Récupérer le nombre total de matchs du joueur (limité aux 6 derniers)
    SELECT COUNT(*) INTO total_matches
    FROM (
        SELECT id
        FROM matches
        WHERE white_attacker = player_id OR white_defender = player_id 
           OR black_attacker = player_id OR black_defender = player_id
        ORDER BY date DESC
        LIMIT 6
    ) recent_matches;

    -- Compter combien de ces matchs incluent le partenaire
    SELECT COUNT(*) INTO matches_with_partner
    FROM (
        SELECT id
        FROM matches
        WHERE (white_attacker = player_id OR white_defender = player_id 
            OR black_attacker = player_id OR black_defender = player_id)
        AND (white_attacker = partner_id OR white_defender = partner_id 
            OR black_attacker = partner_id OR black_defender = partner_id)
        ORDER BY date DESC
        LIMIT 6
    ) recent_matches_with_partner;

    -- Calculer le taux de rejouabilité
    RETURN CASE 
        WHEN total_matches = 0 THEN 0
        ELSE matches_with_partner::float / total_matches
    END;
END;
$function$
```

**Problème identifié**:
La fonction calcule actuellement le taux de rejouabilité en utilisant comme dénominateur le nombre total de matchs joués par le joueur (limité à 6). Cela signifie que si un joueur n'a joué que 2 matchs, et qu'il a joué ces 2 matchs avec le même partenaire, son taux de rejouabilité sera de 2/2 = 1 (100%), ce qui empêche tout gain d'XP.

Selon la documentation, l'intention est de calculer le taux sur la base d'un maximum de 6 matchs, ce qui signifie que le taux devrait être de 2/6 = 0.33 dans ce cas précis, permettant ainsi le gain d'XP. 