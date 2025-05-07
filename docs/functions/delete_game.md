# Fonction delete_game

## Objectif
Supprimer le dernier match enregistré et annuler ses effets sur les statistiques des joueurs, en restaurant leur état avant le match (expérience, points de vie, mana).

## Paramètres d'entrée
- `p_match_id` : UUID du match à supprimer

## Étapes de traitement

### 1. Vérification du match
- Vérifie que le match existe
- Vérifie que c'est bien le dernier match enregistré
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
1. Tout utilisateur peut supprimer un match
2. Seul le dernier match enregistré peut être supprimé
3. La suppression doit être complète (match + effets)
4. Les statistiques des joueurs doivent être cohérentes après suppression
5. L'historique de suppression est conservé pour audit

## Exemple d'utilisation
```sql
-- Supprimer le dernier match et restaurer les statistiques
SELECT * FROM delete_game('uuid-du-dernier-match');
```

## Impact sur le gameplay
- Permet de corriger rapidement une erreur de saisie récente
- Maintient l'intégrité des statistiques
- Limite les abus potentiels en ne permettant que la suppression du dernier match
- Assure la confiance des joueurs dans le système

## Sécurité
- Vérification que le match est bien le dernier
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
1. Correction d'une erreur de saisie immédiate
2. Annulation d'un match invalide récent
3. Correction rapide d'une erreur de score

## Limitations
- Ne peut supprimer que le dernier match
- Ne peut pas restaurer les matchs supprimés
- Ne restaure pas les effets indirects (ex: décroissance hebdomadaire)
- Nécessite que les données d'avant match soient disponibles 