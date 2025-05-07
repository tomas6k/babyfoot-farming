# Fonction get_match_history_with_levels

## Description
Fonction PostgreSQL qui récupère l'historique des matchs avec les niveaux calculés des joueurs et la pagination. Les niveaux sont calculés en utilisant la vue `levels_with_info` qui définit les paliers d'expérience.

## Signature
```sql
FUNCTION get_match_history_with_levels(
  p_player_id TEXT DEFAULT NULL,
  p_page_number INTEGER DEFAULT 1,
  p_items_per_page INTEGER DEFAULT 10
) RETURNS JSON
```

## Paramètres

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|---------|
| p_player_id | TEXT | UUID du joueur pour filtrer les matchs | NULL |
| p_page_number | INTEGER | Numéro de la page à retourner | 1 |
| p_items_per_page | INTEGER | Nombre d'éléments par page | 10 |

## Retour
Objet JSON avec la structure suivante :
```json
{
  "matches": [
    {
      "id": "UUID",
      "date": "TIMESTAMP",
      "score_white": "INTEGER",
      "score_black": "INTEGER",
      "white_attacker_pseudo": "TEXT",
      "white_attacker_level": "INTEGER",
      "white_attacker_exp_gained": "INTEGER",
      "white_defender_pseudo": "TEXT",
      "white_defender_level": "INTEGER",
      "white_defender_exp_gained": "INTEGER",
      "white_team_level": "INTEGER",
      "black_attacker_pseudo": "TEXT",
      "black_attacker_level": "INTEGER",
      "black_attacker_exp_gained": "INTEGER",
      "black_defender_pseudo": "TEXT",
      "black_defender_level": "INTEGER",
      "black_defender_exp_gained": "INTEGER",
      "black_team_level": "INTEGER"
    }
  ],
  "total_count": "INTEGER"
}
```

## Calculs

### Niveau des joueurs
```sql
LEFT JOIN LATERAL (
    SELECT l.level
    FROM levels_with_info l
    WHERE l.required_exp <= player.exp_before
    ORDER BY l.required_exp DESC
    LIMIT 1
) player_level ON true
```
- Utilise la vue `levels_with_info` pour déterminer le niveau
- Basé sur l'expérience du joueur avant le match
- Valeur par défaut : niveau 1 (Gueux)
- Hérite des attributs des niveaux précédents via la vue

### Expérience gagnée
```sql
(m.player_exp_after - m.player_exp_before) as player_exp_gained
```
- Calculé comme la différence entre l'expérience après et avant le match
- Peut être négatif en cas de pénalité

### Niveau d'équipe
```sql
(COALESCE(attacker_level.level, 1) + COALESCE(defender_level.level, 1)) as team_level
```
- Somme des niveaux de l'attaquant et du défenseur
- Utilise le niveau 1 par défaut si un niveau est NULL

## Filtrage

### Par joueur
```sql
CASE 
  WHEN p_player_id IS NOT NULL THEN
    p_player_id::UUID IN (
      m.white_attacker,
      m.white_defender,
      m.black_attacker,
      m.black_defender
    )
  ELSE TRUE
END
```
- Vérifie si le joueur a participé au match dans n'importe quel rôle
- Conversion sécurisée de TEXT en UUID
- Utilise l'index `idx_matches_players` pour les performances

## Pagination
```sql
ORDER BY m.date DESC
LIMIT GREATEST(1, p_items_per_page)
OFFSET (GREATEST(1, p_page_number) - 1) * GREATEST(1, p_items_per_page)
```
- Tri par date décroissante (plus récent d'abord)
- Calcul sécurisé de l'offset basé sur le numéro de page
- Utilise l'index `idx_matches_date` pour les performances
- Validation des paramètres pour éviter les valeurs négatives

## Optimisations

### Indexes utilisés
```sql
-- Tri et pagination
CREATE INDEX idx_matches_date ON matches (date DESC);

-- Filtrage par joueur
CREATE INDEX idx_matches_players ON matches (
  white_attacker,
  white_defender,
  black_attacker,
  black_defender
);

-- Calcul des niveaux
CREATE INDEX idx_players_exp ON players (exp DESC);
CREATE INDEX idx_levels_min_exp ON levels (min_exp);
```

### Jointures optimisées
- Utilisation de LEFT JOIN pour gérer les joueurs manquants
- LATERAL joins pour la récupération efficace des niveaux
- Calcul du total_count optimisé avec index

## Gestion des erreurs

### Valeurs NULL
- Utilisation de COALESCE pour les niveaux (défaut: 1)
- json_agg avec tableau vide par défaut
- Conversion sécurisée des UUID

### Pagination
- Validation des paramètres avec GREATEST
- Gestion des résultats vides
- Protection contre les valeurs négatives

## Exemple d'utilisation

### Tous les matchs
```sql
SELECT * FROM get_match_history_with_levels();
```

### Matchs d'un joueur spécifique
```sql
SELECT * FROM get_match_history_with_levels(
  p_player_id := 'player-uuid',
  p_page_number := 1,
  p_items_per_page := 20
);
```

## Dépendances
- Table `matches`
- Table `players`
- Table `levels`
- Vue `levels_with_info`
- Extension `uuid-ossp`

## Maintenance
- Surveiller l'utilisation des index (voir docs/database/indexes.md)
- Analyser les tables après des modifications importantes
- Vérifier régulièrement les plans d'exécution
- Optimiser les index selon l'usage réel 