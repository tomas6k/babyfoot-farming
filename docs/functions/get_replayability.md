# Fonction get_replayability

## Objectif
Calculer le taux de rejouabilité d'un joueur avec son partenaire en se basant sur les 6 derniers matchs joués.

## Paramètres d'entrée
- `p_player_id` : UUID du joueur dont on veut calculer la rejouabilité
- `p_partner_id` : UUID du partenaire avec lequel on veut calculer la rejouabilité

## Étapes de traitement

### 1. Récupération des données
- Sélectionne les 6 derniers matchs du joueur depuis la table `matches`
- Identifie les matchs où le joueur a joué avec le partenaire spécifié

### 2. Calcul du taux de rejouabilité
- Compte le nombre total de matchs parmi les 6 derniers
- Compte le nombre de matchs joués avec le partenaire
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
3. Le taux est calculé indépendamment du rôle (attaquant/défenseur) des joueurs
4. Le taux est calculé indépendamment de l'équipe (noir/blanc)

## Exemple d'utilisation
```sql
SELECT get_replayability('uuid-du-joueur', 'uuid-du-partenaire');
-- Retourne par exemple 0.33 si le joueur a joué 2 matchs sur 6 avec ce partenaire
```

## Impact sur le gameplay
- Un taux de rejouabilité supérieur à 0.5 (50%) empêchera le gain d'expérience lors d'un match
- Cette mécanique encourage la diversité des équipes et évite le "farming" d'expérience avec les mêmes partenaires

## Implémentation SQL
```sql
CREATE OR REPLACE FUNCTION public.get_replayability(player_id uuid, partner_id uuid)
RETURNS double precision
LANGUAGE plpgsql
AS $function$
DECLARE
    total_matches integer;
    matches_with_partner integer;
    max_matches integer := 6; -- Nombre maximum de matchs à considérer
BEGIN
    -- Récupérer le nombre total de matchs du joueur (limité aux 6 derniers)
    SELECT COUNT(*) INTO total_matches
    FROM (
        SELECT id
        FROM matches
        WHERE white_attacker = player_id OR white_defender = player_id 
           OR black_attacker = player_id OR black_defender = player_id
        ORDER BY date DESC
        LIMIT max_matches
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
        LIMIT max_matches
    ) recent_matches_with_partner;

    -- Calculer le taux de rejouabilité en utilisant max_matches comme dénominateur
    -- si le joueur a joué moins de 6 matchs
    RETURN CASE 
        WHEN total_matches = 0 THEN 0
        ELSE matches_with_partner::float / max_matches
    END;
END;
$function$; 