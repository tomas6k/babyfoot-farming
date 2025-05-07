# Fonction weekly_decay

## Objectif
Appliquer une décroissance hebdomadaire aux statistiques des joueurs pour maintenir un équilibre dans le jeu et encourager une participation régulière.

## Paramètres d'entrée
Aucun paramètre d'entrée - La fonction s'applique à tous les joueurs.

## Étapes de traitement

### 1. Vérification de la dernière décroissance
- Vérifie si une semaine s'est écoulée depuis la dernière décroissance
- Identifie les joueurs éligibles à la décroissance

### 2. Application de la décroissance
- Réduit l'expérience des joueurs inactifs
- Applique un pourcentage de réduction basé sur la configuration du jeu
- Met à jour la date de dernière décroissance

### 3. Mise à jour des statistiques
- Met à jour les niveaux des joueurs si nécessaire
- Enregistre les modifications dans l'historique

## Valeur de retour
```sql
RETURNS TABLE (
    player_id UUID,           -- ID du joueur
    old_exp INTEGER,         -- Expérience avant décroissance
    new_exp INTEGER,         -- Expérience après décroissance
    decay_amount INTEGER     -- Montant de la décroissance
)
```

## Règles métier importantes
1. La décroissance ne s'applique qu'aux joueurs inactifs depuis plus d'une semaine
2. L'expérience ne peut pas descendre en dessous de 0
3. Le taux de décroissance est configurable dans la table `game_config`
4. La décroissance est appliquée de manière automatique via un déclencheur hebdomadaire

## Exemple d'utilisation
```sql
-- Déclencher manuellement la décroissance hebdomadaire
SELECT * FROM weekly_decay();
```

## Impact sur le gameplay
- Encourage une participation régulière
- Évite l'accumulation excessive d'expérience
- Maintient un équilibre entre joueurs actifs et inactifs
- Crée un cycle hebdomadaire d'activité

## Configuration
La fonction utilise les paramètres suivants de la table `game_config` :
```sql
- decay_rate : Pourcentage de décroissance (par défaut 10%)
- decay_threshold : Nombre de jours d'inactivité avant décroissance
```

## Tables associées
```sql
- players : Pour les statistiques des joueurs
- game_config : Pour les paramètres de configuration
- matches : Pour vérifier l'activité des joueurs
```

## Déclenchement
La fonction est normalement déclenchée :
1. Automatiquement chaque semaine via un job programmé
2. Manuellement par les administrateurs si nécessaire 