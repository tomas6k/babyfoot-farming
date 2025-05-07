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
- Calcule le ratio : (matchs avec partenaire) / (total des matchs)

## Valeur de retour
- Retourne un nombre décimal (float) entre 0 et 1
- 0 signifie que le joueur n'a pas joué avec ce partenaire dans ses 6 derniers matchs
- 1 signifie que le joueur a joué tous ses derniers matchs avec ce partenaire
- Une valeur de 0.5 signifie que le joueur a joué 50% de ses derniers matchs avec ce partenaire

## Règles métier importantes
1. Seuls les 6 derniers matchs sont pris en compte
2. Si le joueur a joué moins de 6 matchs, le calcul se fait sur le nombre de matchs disponibles
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