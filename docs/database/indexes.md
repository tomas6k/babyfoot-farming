# Index de la Base de Données

## Objectif
Ce document répertorie les index créés dans la base de données pour optimiser les performances des requêtes.

## Index pour l'Historique des Matchs

### `idx_matches_date`
```sql
CREATE INDEX idx_matches_date ON matches (date DESC);
```
- **Table**: `matches`
- **Colonnes**: `date` (ordre décroissant)
- **Utilisation**:
  - Optimise le tri des matchs par date
  - Accélère la pagination dans l'historique
  - Utilisé par la fonction `get_match_history_with_levels`

### `idx_matches_players`
```sql
CREATE INDEX idx_matches_players ON matches (
    white_attacker,
    white_defender,
    black_attacker,
    black_defender
);
```
- **Table**: `matches`
- **Colonnes**: tous les IDs des joueurs
- **Utilisation**:
  - Accélère le filtrage des matchs par joueur
  - Optimise les jointures avec la table `players`
  - Essentiel pour la recherche de matchs d'un joueur spécifique

## Index pour les Joueurs et Niveaux

### `idx_players_exp`
```sql
CREATE INDEX idx_players_exp ON players (exp DESC);
```
- **Table**: `players`
- **Colonnes**: `exp` (ordre décroissant)
- **Utilisation**:
  - Optimise le calcul des niveaux basé sur l'expérience
  - Accélère le classement des joueurs par expérience
  - Utilisé par les fonctions `get_players_level` et `get_match_history_with_levels`

### `idx_levels_min_exp`
```sql
CREATE INDEX idx_levels_min_exp ON levels (min_exp);
```
- **Table**: `levels`
- **Colonnes**: `min_exp`
- **Utilisation**:
  - Optimise la recherche des paliers de niveau
  - Aide la vue `levels_with_info` à déterminer les niveaux
  - Améliore les performances du calcul des niveaux

## Impact sur les Performances

### Requêtes Optimisées
1. Historique des matchs paginé
2. Filtrage des matchs par joueur
3. Calcul des niveaux basé sur l'expérience
4. Classement des joueurs

### Gains de Performance Attendus
- Réduction du temps de réponse pour l'historique des matchs
- Amélioration de la réactivité du filtrage
- Optimisation du calcul des niveaux en temps réel

## Maintenance

### Surveillance
- Vérifier régulièrement l'utilisation des index via :
  ```sql
  SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
  FROM pg_stat_user_indexes;
  ```

### Recommandations
1. Reconstruire les index périodiquement :
   ```sql
   REINDEX INDEX idx_matches_date;
   ```
2. Analyser les tables après des modifications importantes :
   ```sql
   ANALYZE matches;
   ANALYZE players;
   ```
3. Surveiller la taille des index :
   ```sql
   SELECT pg_size_pretty(pg_relation_size('idx_matches_players'));
   ```

## Notes d'Implémentation
- Les index sont créés avec `IF NOT EXISTS` pour éviter les erreurs
- L'ordre DESC est utilisé pour optimiser les tris décroissants fréquents
- Les index composites sont créés pour supporter les requêtes multi-colonnes 