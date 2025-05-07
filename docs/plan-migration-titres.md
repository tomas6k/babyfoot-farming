# Plan de Migration pour les Titres de Saison

## Objectif
Implémenter les améliorations documentées pour la fonction `get_global_stats()` et le composant frontend `SeasonTitles.tsx`, en particulier:
1. L'adaptation des titres négatifs (Les Gueux, Le Charpentier, Le Boulanger) pour utiliser le taux d'échec (loss_rate)
2. L'ajout des paramètres de filtrage par date (p_date_start et p_date_end)

## Vue d'ensemble des modifications
### Modifications backend:
- Ajout de paramètres de filtrage supplémentaires
- Calcul du taux d'échec (loss_rate) pour les titres négatifs
- Adaptation du tri pour les titres négatifs
- Conservation des champs existants pour la rétrocompatibilité

### Modifications frontend:
- Affichage du taux d'échec au lieu du taux de victoire pour les titres négatifs
- Affichage du nombre de défaites au lieu du nombre de victoires dans les tooltips

## Plan d'action détaillé

### Phase 1: Préparation (J1)

#### 1.1 Sauvegarde et documentation
- Exporter la fonction SQL actuelle pour référence
- Créer un environnement de test pour les modifications
- Documenter le comportement actuel pour validation

#### 1.2 Validation des exigences
- Confirmer les règles métier pour les titres négatifs
- Valider la logique de filtrage par date
- Définir les critères de succès de la migration

### Phase 2: Implémentation backend (J2-J3)

#### 2.1 Modification de la signature de la fonction
```sql
CREATE OR REPLACE FUNCTION get_global_stats(
  p_date DATE DEFAULT NULL,
  p_date_start DATE DEFAULT NULL, 
  p_date_end DATE DEFAULT NULL
) RETURNS JSONB
```

#### 2.2 Adaptation du filtrage par date
```sql
WITH filtered_matches AS (
  SELECT *
  FROM matches
  WHERE (
    CASE 
      WHEN p_date_start IS NOT NULL AND p_date_end IS NOT NULL THEN
        created_at BETWEEN p_date_start AND p_date_end
      WHEN p_date IS NOT NULL THEN
        DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_date)
      ELSE
        TRUE
    END
  )
  AND NOT deleted
),
-- Reste des CTEs
```

#### 2.3 Implémentation des calculs de taux d'échec
Pour `worst_pair`, `worst_attacker` et `worst_defender`, ajouter les champs:
- `defeats`: Nombre de défaites
- `loss_rate`: Taux d'échec avec ajustement bayésien

Exemple pour worst_pair:
```sql
worst_pairs AS (
  SELECT
    p1.id AS player1_id,
    p2.id AS player2_id,
    p1.pseudo AS player1_pseudo,
    p2.pseudo AS player2_pseudo,
    COUNT(*) AS total_matches,
    SUM(CASE WHEN p.won THEN 1 ELSE 0 END) AS victories,
    SUM(CASE WHEN NOT p.won THEN 1 ELSE 0 END) AS defeats,
    (SUM(CASE WHEN p.won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) AS bayesian_win_rate,
    (SUM(CASE WHEN NOT p.won THEN 1 ELSE 0 END)::FLOAT + 1) / (COUNT(*) + 2) AS bayesian_loss_rate
  FROM player_match p
  JOIN players p1 ON p.player_id = p1.id
  JOIN player_match p2_match ON p2_match.match_id = p.match_id AND p2_match.player_id != p.player_id AND p2_match.team = p.team
  JOIN players p2 ON p2_match.player_id = p2.id
  JOIN filtered_matches m ON p.match_id = m.id
  GROUP BY p1.id, p2.id, p1.pseudo, p2.pseudo
  HAVING COUNT(*) >= 3
  ORDER BY bayesian_loss_rate DESC, total_matches DESC
  LIMIT 1
)
```

#### 2.4 Adaptation de la construction du JSON
```sql
'worst_pair', (
  SELECT jsonb_build_object(
    'player1_id', player1_id,
    'player2_id', player2_id,
    'player1_pseudo', player1_pseudo,
    'player2_pseudo', player2_pseudo,
    'victories', victories,
    'defeats', defeats,
    'total_matches', total_matches,
    'win_rate', bayesian_win_rate,
    'loss_rate', bayesian_loss_rate
  )
  FROM worst_pairs
),
```

### Phase 3: Tests backend (J4)

#### 3.1 Test du nouveau filtrage par date
```sql
-- Test 1: Filtre sur un mois spécifique
SELECT * FROM get_global_stats('2023-11-01');

-- Test 2: Filtre sur une période
SELECT * FROM get_global_stats(NULL, '2023-10-01', '2023-11-30');

-- Test 3: Sans filtre (tous les matchs)
SELECT * FROM get_global_stats();
```

#### 3.2 Validation des calculs pour les titres négatifs
```sql
-- Extraire les titres négatifs pour vérification
SELECT 
  jsonb_extract_path(get_global_stats(), 'worst_pair') AS worst_pair,
  jsonb_extract_path(get_global_stats(), 'positions', 'worst_attacker') AS worst_attacker,
  jsonb_extract_path(get_global_stats(), 'positions', 'worst_defender') AS worst_defender;
```

#### 3.3 Vérification de la rétrocompatibilité
- S'assurer que tous les champs existants sont préservés
- Vérifier les cas limites (zéro match, joueurs ex-aequo, etc.)

### Phase 4: Implémentation frontend (J5-J6)

#### 4.1 Mise à jour du composant `SeasonTitles.tsx`
1. Pour `Les Gueux`:
```typescript
// Ancienne version
<TitleCard
  title="Les Gueux"
  description="Pire paire de la saison"
  badge="gueux.png"
  holders={`${worst_pair?.player1_pseudo} & ${worst_pair?.player2_pseudo}`}
  statValue={`${(worst_pair?.win_rate * 100).toFixed(1)}%`}
  tooltip={`${worst_pair?.victories} victoires sur ${worst_pair?.total_matches} matchs`}
/>

// Nouvelle version
<TitleCard
  title="Les Gueux"
  description="Pire paire de la saison"
  badge="gueux.png"
  holders={`${worst_pair?.player1_pseudo} & ${worst_pair?.player2_pseudo}`}
  statValue={`${(worst_pair?.loss_rate * 100).toFixed(1)}%`}
  tooltip={`${worst_pair?.defeats} défaites sur ${worst_pair?.total_matches} matchs`}
/>
```

2. Modifications similaires pour `Le Charpentier` et `Le Boulanger`

#### 4.2 Gestion des cas limites
- Ajouter la vérification de l'existence de `loss_rate` avec fallback sur `win_rate`
- Gérer les cas où `defeats` est undefined avec fallback sur `victories`

### Phase 5: Tests d'intégration (J7)

#### 5.1 Tests fonctionnels
- Tester différentes périodes de filtrage
- Vérifier l'affichage correct des taux d'échec
- Valider les tooltips montrant les défaites

#### 5.2 Tests de régression
- S'assurer que toutes les autres fonctionnalités fonctionnent correctement
- Vérifier les performances de la fonction SQL

### Phase 6: Déploiement (J8)

#### 6.1 Déploiement de la fonction SQL
```sql
-- Appliquer la nouvelle version de la fonction
CREATE OR REPLACE FUNCTION get_global_stats(...) ...
```

#### 6.2 Déploiement du frontend
- Déployer les modifications de `SeasonTitles.tsx`
- Surveiller les logs pour détecter d'éventuelles erreurs

### Phase 7: Suivi et documentation (J9-J10)

#### 7.1 Surveillance post-déploiement
- Vérifier les performances de la fonction
- Recueillir les retours utilisateurs

#### 7.2 Mise à jour de la documentation
- Finaliser la documentation technique
- Mettre à jour les guides utilisateurs
- Archiver le plan de migration pour référence future

## Risques et mitigation

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Régression des fonctionnalités existantes | Élevé | Moyenne | Tests exhaustifs avant déploiement |
| Problèmes de performance avec le filtrage par date | Moyen | Faible | Optimisation des index et monitoring |
| Confusion utilisateur avec les nouveaux indicateurs | Moyen | Élevée | Communication claire et tooltips explicatifs |
| Données incohérentes lors de la transition | Élevé | Faible | Déployer backend et frontend simultanément |

## Ressources nécessaires
- 1 développeur backend pour SQL (4 jours)
- 1 développeur frontend pour React (3 jours)
- 1 testeur (2 jours)
- 1 DBA pour optimisation (1 jour)

## Calendrier proposé
- Semaine 1: Phases 1-3 (Préparation et Backend)
- Semaine 2: Phases 4-7 (Frontend, Tests et Déploiement)

## Critères de succès
- Calculs corrects pour tous les titres
- Affichage cohérent des taux d'échec pour les titres négatifs
- Filtrage par date fonctionnel
- Pas de régression fonctionnelle
- Documentation complète et à jour 