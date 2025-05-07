# Fonction regenerate_resources

## Objectif
Gérer la régénération automatique des ressources (points de vie et mana) des joueurs en fonction du temps écoulé depuis leur dernière mise à jour.

## Paramètres d'entrée
- `p_player_id` : UUID du joueur dont on veut régénérer les ressources

## Étapes de traitement

### 1. Vérification du temps écoulé
- Récupère la dernière date de mise à jour des ressources du joueur
- Calcule le temps écoulé depuis cette date
- Détermine le nombre de points à régénérer en fonction du temps écoulé

### 2. Calcul des nouvelles valeurs
- Calcule les nouveaux points de vie (HP)
  - Maximum de 5 points
  - Régénération de 1 point toutes les 24 heures
- Calcule les nouveaux points de mana
  - Maximum de 5 points
  - Régénération de 1 point toutes les 24 heures

### 3. Mise à jour des ressources
- Met à jour les points de vie et de mana du joueur
- Met à jour la date de dernière régénération
- Ne dépasse jamais les valeurs maximales

## Valeur de retour
```sql
RETURNS TABLE (
    hp INTEGER,           -- Nouveaux points de vie
    mana INTEGER,         -- Nouveaux points de mana
    last_regen TIMESTAMP  -- Nouvelle date de dernière régénération
)
```

## Règles métier importantes
1. Les ressources ne peuvent pas dépasser leur maximum (5 points)
2. La régénération est d'1 point toutes les 24 heures
3. Les deux ressources se régénèrent indépendamment
4. La régénération est automatique mais doit être déclenchée par un appel à la fonction
5. Si un joueur a 0 HP, il peut toujours jouer mais avec des malus d'expérience
6. Si un joueur a 0 mana, il peut toujours jouer mais avec des malus d'expérience

## Exemple d'utilisation
```sql
-- Régénérer les ressources d'un joueur
SELECT * FROM regenerate_resources('uuid-du-joueur');
-- Pourrait retourner :
-- hp | mana |      last_regen
--  4 |   3  | 2024-03-14 15:30:00
```

## Impact sur le gameplay
- Encourage une gestion stratégique des ressources
- Crée un cycle de jeu quotidien
- Force les joueurs à faire des pauses entre les sessions intensives
- Permet de récupérer naturellement après des défaites

## Déclenchement
La fonction doit être appelée dans les cas suivants :
1. Lors de la consultation du profil d'un joueur
2. Avant chaque match
3. Après chaque match
4. Lors de l'affichage des statistiques

## Table associée
La fonction met à jour la table `players` qui doit contenir les colonnes suivantes :
```sql
ALTER TABLE players ADD COLUMN IF NOT EXISTS hp INTEGER DEFAULT 5;
ALTER TABLE players ADD COLUMN IF NOT EXISTS mana INTEGER DEFAULT 5;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_regen TIMESTAMP DEFAULT NOW();
``` 