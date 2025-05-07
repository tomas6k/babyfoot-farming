# Fonction reset_hp_mana

## Objectif
Réinitialiser les points de vie (HP) et de mana d'un joueur à leurs valeurs maximales, généralement utilisé pour des événements spéciaux ou des actions administratives.

## Paramètres d'entrée
- `p_player_id` : UUID du joueur dont on veut réinitialiser les ressources

## Étapes de traitement

### 1. Vérification du joueur
- Vérifie que le joueur existe dans la base de données
- Vérifie les permissions de l'utilisateur qui fait l'appel

### 2. Réinitialisation des ressources
- Met les points de vie (HP) à leur maximum (5)
- Met les points de mana à leur maximum (5)
- Met à jour la date de dernière régénération à maintenant

### 3. Enregistrement
- Enregistre la réinitialisation dans l'historique
- Met à jour les statistiques du joueur

## Valeur de retour
```sql
RETURNS TABLE (
    player_id UUID,        -- ID du joueur
    pseudo TEXT,           -- Nom du joueur
    new_hp INTEGER,        -- Nouveaux points de vie (5)
    new_mana INTEGER,      -- Nouveaux points de mana (5)
    reset_time TIMESTAMP   -- Moment de la réinitialisation
)
```

## Règles métier importantes
1. Seuls les administrateurs peuvent utiliser cette fonction
2. Les ressources sont toujours réinitialisées à leur maximum (5)
3. La réinitialisation est immédiate et ne dépend pas du temps écoulé
4. L'historique de régénération est mis à jour pour éviter des régénérations immédiates

## Exemple d'utilisation
```sql
-- Réinitialiser les ressources d'un joueur
SELECT * FROM reset_hp_mana('uuid-du-joueur');
```

## Impact sur le gameplay
- Permet de "sauver" un joueur bloqué avec peu de ressources
- Utilisé pour des événements spéciaux (tournois, événements saisonniers)
- Peut servir de récompense ou de bonus
- Aide à maintenir l'engagement des joueurs

## Sécurité
- Nécessite des droits d'administration
- Les appels sont journalisés
- Vérifie les permissions RLS

## Tables associées
```sql
- players : Pour mettre à jour les ressources
- audit_log : Pour enregistrer l'action (si implémenté)
```

## Cas d'utilisation
1. Récompense pour participation à un événement
2. Correction d'un problème technique
3. Début de tournoi
4. Action administrative 