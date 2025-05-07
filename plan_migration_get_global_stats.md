# Plan de migration pour l'implémentation complète de `get_global_stats()`

## Contexte
- La fonction actuelle est partiellement implémentée avec des erreurs (relation "pairs_section" non existante)
- Il existe une fonction de sauvegarde `get_global_stats_backup`
- Nous avons déjà certaines statistiques amusantes fonctionnelles (le_fidele, le_casanova), mais pas toutes
- Les statistiques de base (activité, paires) sont implémentées mais ne fonctionnent pas correctement

## Plan de migration

| Étape | Description | Statut |
|-------|-------------|--------|
| 1 | **Sauvegarde** : Créer une sauvegarde de la fonction actuelle | ✅ Déjà existante (`get_global_stats_backup`) |
| 2 | **Analyse** : Identifier les statistiques manquantes et fonctionnalités requises | ✅ Terminé |
| 3 | **Correction de structure** : Résoudre l'erreur de structure (relation "pairs_section") | ⬜ À faire |
| 4 | **Implémentation de base** : Créer une version fonctionnelle minimale | ⬜ À faire |
| 5 | **Statistiques manquantes** : Ajouter les statistiques manquantes | ⬜ À faire |
| 6 | **Tests** : Vérifier que toutes les statistiques sont correctement calculées | ⬜ À faire |
| 7 | **Optimisation** : Améliorer la performance si nécessaire | ⬜ À faire |
| 8 | **Documentation** : Mettre à jour la documentation si besoin | ⬜ À faire |

## Détail des statistiques à implémenter

| Statistique | Description | Statut |
|-------------|-------------|--------|
| `activity` | Joueurs les plus/moins actifs | ✅ Implémenté mais avec erreur |
| `best_pair` | Meilleure paire de joueurs | ✅ Implémenté mais avec erreur |
| `worst_pair` | Pire paire de joueurs | ✅ Implémenté mais avec erreur |
| `positions` | Performances par position (attaquant/défenseur) | ⬜ À implémenter |
| `streaks` | Séries de victoires/défaites | ⬜ À implémenter |
| `perfect_wins` | Victoires parfaites (10-0) | ⬜ À implémenter |
| `perfect_losses` | Défaites parfaites (0-10) | ⬜ À implémenter |
| `close_wins` | Victoires serrées (10-9) | ⬜ À implémenter |
| `close_losses` | Défaites serrées (9-10) | ⬜ À implémenter |
| `fun_stats.le_fidele` | Joueur le plus fidèle à son partenaire | ✅ Implémenté |
| `fun_stats.le_casanova` | Joueur changeant le plus souvent de partenaire | ✅ Implémenté |
| `fun_stats.le_dessert` | Meilleur joueur sur l'heure du déjeuner | ⚠️ Implémenté mais actuellement NULL (pas assez de données) |
| `fun_stats.first_blood` | Meilleur joueur le lundi matin | ⬜ À implémenter |
| `fun_stats.le_revenger` | Joueur obtenant le plus de revanches | ⬜ À implémenter |
| `fun_stats.les_classicos` | Affrontements les plus fréquents | ⬜ À implémenter |

## Mise en œuvre détaillée

### Étape 3 : Correction de structure
- Corriger le problème de la relation "pairs_section" en modifiant la structure de la fonction
- Utiliser des CTE communes dans une seule requête plutôt que des sélections séparées

### Étape 4 : Implémentation de base
- Créer une nouvelle fonction complète incluant les fonctionnalités existantes (activité, paires)
- S'assurer que les paramètres de date fonctionnent correctement

### Étape 5 : Statistiques manquantes
- Ajouter successivement chaque statistique manquante avec des CTEs dédiées
- Implémenter les statistiques fun restantes
- S'assurer que toutes les statistiques sont retournées au format JSON spécifié

### Étape 6 : Tests
- Tester la fonction sans paramètres
- Tester avec filtrage par date et plage de dates
- Vérifier que toutes les statistiques sont incluses et au bon format

### Étape 7 : Optimisation
- Vérifier la performance de la fonction
- Optimiser les requêtes si nécessaire

### Étape 8 : Documentation
- Mettre à jour la documentation si besoin
- Ajouter des commentaires dans le code de la fonction

## Suivi des progrès

### Étape 3 : Correction de structure
- Statut : En cours
- Date : [Date d'aujourd'hui]
- Notes : Début de l'implémentation avec la correction de l'erreur "pairs_section"

### Étape 4 : Implémentation de base
- Statut : Non commencé
- Date : -
- Notes : -

### Étape 5 : Statistiques manquantes
- Statut : Non commencé
- Date : -
- Notes : -

### Étape 6 : Tests
- Statut : Non commencé
- Date : -
- Notes : -

### Étape 7 : Optimisation
- Statut : Non commencé
- Date : -
- Notes : -

### Étape 8 : Documentation
- Statut : Non commencé
- Date : -
- Notes : - 