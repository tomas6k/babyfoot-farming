# Fonction delete_game

## Objectif
Supprimer un match et annuler ses effets sur les statistiques des joueurs, en restaurant leur état avant le match (expérience, points de vie, mana).

## Paramètres d'entrée
- `p_match_id` : UUID du match à supprimer

## Étapes de traitement

### 1. Vérification du match
- Vérifie que le match existe
- Vérifie les permissions de l'utilisateur
- Récupère les données du match avant suppression

### 2. Restauration des statistiques
- Restaure l'expérience des joueurs à leur niveau d'avant match
- Restaure les points de vie à leur valeur d'avant match
- Restaure les points de mana à leur valeur d'avant match

### 3. Suppression et journalisation
- Supprime le match de la table `matches`
- Enregistre l'action dans les logs
- Met à jour les statistiques globales

## Valeur de retour
```sql
RETURNS TABLE (
    match_id UUID,              -- ID du match supprimé
    white_attacker_restored BOOLEAN,  -- Restauration attaquant blanc réussie
    white_defender_restored BOOLEAN,  -- Restauration défenseur blanc réussie
    black_attacker_restored BOOLEAN,  -- Restauration attaquant noir réussie
    black_defender_restored BOOLEAN,  -- Restauration défenseur noir réussie
    deletion_time TIMESTAMP          -- Moment de la suppression
)
```

## Règles métier importantes
1. Seuls les administrateurs peuvent supprimer des matchs
2. La suppression doit être complète (match + effets)
3. Les statistiques des joueurs doivent être cohérentes après suppression
4. L'historique de suppression est conservé pour audit

## Exemple d'utilisation
```sql
-- Supprimer un match et restaurer les statistiques
SELECT * FROM delete_game('uuid-du-match');
```

## Impact sur le gameplay
- Permet de corriger des erreurs de saisie
- Maintient l'intégrité des statistiques
- Évite les abus potentiels
- Assure la confiance des joueurs dans le système

## Sécurité
- Vérification des permissions administrateur
- Journalisation des suppressions
- Vérification de l'intégrité des données
- Protection contre les suppressions en cascade non désirées

## Tables impactées
```sql
- matches : Suppression du match
- players : Restauration des statistiques
- audit_log : Enregistrement de l'action
```

## Cas d'utilisation
1. Correction d'erreurs de saisie
2. Annulation de matchs invalides
3. Maintenance administrative
4. Résolution de litiges

## Limitations
- Ne peut pas restaurer les matchs supprimés
- Ne restaure pas les effets indirects (ex: décroissance hebdomadaire)
- Nécessite que les données d'avant match soient disponibles 