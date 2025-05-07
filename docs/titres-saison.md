# Documentation des Titres de Saison

## Introduction

Les titres de saison sont des récompenses affichées sur le dashboard qui mettent en valeur les performances des joueurs et des équipes. Chaque titre est calculé par la fonction SQL `get_global_stats()` et affiché via le composant React `SeasonTitles.tsx`.

Cette documentation détaille chaque titre, son calcul, sa structure de données et son affichage.

## Structure Générale

### Flux de données
1. La fonction SQL `get_global_stats()` est appelée côté serveur
2. Les données sont transmises au composant `SeasonTitles` via les props
3. Le composant affiche les titres regroupés par catégories

### Structure du composant
- Le composant utilise un composant utilitaire `TitleCard` pour la présentation uniforme
- Chaque carte affiche :
  - Une image de badge
  - Le nom du titre
  - Une description (accessible via tooltip)
  - Les détenteurs du titre
  - La valeur statistique principale
  - Des informations supplémentaires (via tooltip)

### Groupes de titres
1. **Titres d'équipe** : Performances des paires de joueurs
2. **Titres par position** : Performances selon le rôle (attaquant/défenseur)
3. **Titres individuels** : Performances et statistiques individuelles

## Titres actuellement implémentés

### Titres d'Équipe

#### La Royauté
- **Description** : Meilleure paire de la saison
- **Source de données** : `globalStats.best_pair`
- **Structure JSON** :
  ```json
  {
    "player1_id": "UUID",
    "player2_id": "UUID",
    "player1_pseudo": "STRING",
    "player2_pseudo": "STRING",
    "victories": "INTEGER",
    "total_matches": "INTEGER",
    "win_rate": "DECIMAL"
  }
  ```
- **Affichage** :
  - Badge : `royaute.png`
  - Détenteurs : `player1_pseudo & player2_pseudo`
  - Statistique : `win_rate` (pourcentage)
  - Tooltip : `victories victoires sur total_matches matchs`
- **Calcul** : 
  - Paires ayant joué au moins 3 matchs ensemble
  - Tri par taux de victoire (avec ajustement bayésien) puis nombre de matchs

#### Les Gueux
- **Description** : Pire paire de la saison
- **Source de données** : `globalStats.worst_pair`
- **Structure JSON** : 
  ```json
  {
    "player1_id": "UUID",
    "player2_id": "UUID",
    "player1_pseudo": "STRING",
    "player2_pseudo": "STRING",
    "victories": "INTEGER",
    "defeats": "INTEGER",
    "total_matches": "INTEGER",
    "win_rate": "DECIMAL",
    "loss_rate": "DECIMAL"
  }
  ```
- **Affichage** :
  - Badge : `gueux.png`
  - Détenteurs : `player1_pseudo & player2_pseudo`
  - Statistique : `loss_rate` (pourcentage)
  - Tooltip : `defeats défaites sur total_matches matchs`
- **Calcul** : 
  - Paires ayant joué au moins 3 matchs ensemble
  - Tri par taux d'échec (décroissant) puis nombre de matchs

### Titres par Position

#### Messire
- **Description** : Meilleur attaquant de la saison
- **Source de données** : `globalStats.positions.best_attacker`
- **Structure JSON** :
  ```json
  {
    "player_id": "UUID",
    "pseudo": "STRING",
    "victories": "INTEGER",
    "total_matches": "INTEGER",
    "win_rate": "DECIMAL"
  }
  ```
- **Affichage** :
  - Badge : `messire.png`
  - Détenteur : `pseudo`
  - Statistique : `win_rate` (pourcentage)
  - Tooltip : `victories victoires sur total_matches matchs`
- **Calcul** : 
  - Joueurs ayant joué au moins 3 matchs en attaque
  - Tri par taux de victoire puis nombre de matchs

#### Le Charpentier
- **Description** : Pire attaquant de la saison
- **Source de données** : `globalStats.positions.worst_attacker`
- **Structure JSON** : 
  ```json
  {
    "player_id": "UUID",
    "pseudo": "STRING",
    "victories": "INTEGER",
    "defeats": "INTEGER",
    "total_matches": "INTEGER",
    "win_rate": "DECIMAL",
    "loss_rate": "DECIMAL"
  }
  ```
- **Affichage** :
  - Badge : `charpentier.png`
  - Détenteur : `pseudo`
  - Statistique : `loss_rate` (pourcentage)
  - Tooltip : `defeats défaites sur total_matches matchs`
- **Calcul** : 
  - Joueurs ayant joué au moins 3 matchs en attaque
  - Tri par taux d'échec (décroissant) puis nombre de matchs

#### Monseigneur
- **Description** : Meilleur défenseur de la saison
- **Source de données** : `globalStats.positions.best_defender`
- **Structure JSON** : 
  ```json
  {
    "player_id": "UUID",
    "pseudo": "STRING",
    "victories": "INTEGER",
    "total_matches": "INTEGER",
    "win_rate": "DECIMAL"
  }
  ```
- **Affichage** :
  - Badge : `monseigneur.png`
  - Détenteur : `pseudo`
  - Statistique : `win_rate` (pourcentage)
  - Tooltip : `victories victoires sur total_matches matchs`
- **Calcul** : 
  - Joueurs ayant joué au moins 3 matchs en défense
  - Tri par taux de victoire puis nombre de matchs

#### Le Boulanger
- **Description** : Pire défenseur de la saison
- **Source de données** : `globalStats.positions.worst_defender`
- **Structure JSON** : 
  ```json
  {
    "player_id": "UUID",
    "pseudo": "STRING",
    "victories": "INTEGER",
    "defeats": "INTEGER",
    "total_matches": "INTEGER",
    "win_rate": "DECIMAL",
    "loss_rate": "DECIMAL"
  }
  ```
- **Affichage** :
  - Badge : `boulanger.png`
  - Détenteur : `pseudo`
  - Statistique : `loss_rate` (pourcentage)
  - Tooltip : `defeats défaites sur total_matches matchs`
- **Calcul** : 
  - Joueurs ayant joué au moins 3 matchs en défense
  - Tri par taux d'échec (décroissant) puis nombre de matchs

### Titres Individuels

#### L'Excalibur
- **Description** : Victoires 10-0 les plus fréquentes
- **Source de données** : `globalStats.perfect_wins`
- **Structure JSON** :
  ```json
  [
    {
      "player_id": "UUID",
      "pseudo": "STRING",
      "count": "INTEGER"
    }
  ]
  ```
- **Affichage** :
  - Badge : `excalibur.png`
  - Détenteurs : Tous les joueurs avec le même nombre maximum de victoires parfaites
  - Statistique : `count victoires parfaites`
  - Tooltip : "Nombre de matchs gagnés 10-0"
- **Calcul** : 
  - Comptage des victoires avec score 10-0
  - Tri par nombre de victoires parfaites

#### Le Bâton du Paysan
- **Description** : Défaites 10-0 les plus fréquentes
- **Source de données** : `globalStats.perfect_losses`
- **Structure JSON** : Identique à `perfect_wins`
- **Affichage** :
  - Badge : `baton.png`
  - Détenteurs : Tous les joueurs avec le même nombre maximum de défaites parfaites
  - Statistique : `count défaites parfaites`
  - Tooltip : "Nombre de matchs perdus 0-10"
- **Calcul** : 
  - Comptage des défaites avec score 0-10
  - Tri par nombre de défaites parfaites

#### Béni des Dieux
- **Description** : Victoires 10-9 les plus fréquentes
- **Source de données** : `globalStats.close_wins`
- **Structure JSON** : Identique à `perfect_wins`
- **Affichage** :
  - Badge : `beni.png`
  - Détenteurs : Tous les joueurs avec le même nombre maximum de victoires serrées
  - Statistique : `count victoires serrées`
  - Tooltip : "Nombre de matchs gagnés 10-9"
- **Calcul** : 
  - Comptage des victoires avec score 10-9
  - Tri par nombre de victoires serrées

#### La Cruche
- **Description** : Défaites 10-9 les plus fréquentes
- **Source de données** : `globalStats.close_losses`
- **Structure JSON** : Identique à `perfect_wins`
- **Affichage** :
  - Badge : `cruche.png`
  - Détenteurs : Tous les joueurs avec le même nombre maximum de défaites serrées
  - Statistique : `count défaites serrées`
  - Tooltip : "Nombre de matchs perdus 9-10"
- **Calcul** : 
  - Comptage des défaites avec score 9-10
  - Tri par nombre de défaites serrées

#### Le Saint-Baby
- **Description** : Plus longue série de victoires
- **Source de données** : `globalStats.streaks.longest_win_streak`
- **Structure JSON** :
  ```json
  {
    "player_id": "UUID",
    "pseudo": "STRING",
    "streak": "INTEGER"
  }
  ```
- **Affichage** :
  - Badge : `saint-baby.png`
  - Détenteur : `pseudo`
  - Statistique : `streak victoires consécutives`
  - Tooltip : "Nombre maximum de victoires consécutives"
- **Calcul** : 
  - Identification des séries de victoires consécutives
  - Sélection de la plus longue série

#### Le Bouffon du Roi
- **Description** : Plus longue série de défaites
- **Source de données** : `globalStats.streaks.longest_lose_streak`
- **Structure JSON** : Identique à `longest_win_streak`
- **Affichage** :
  - Badge : `bouffon.png`
  - Détenteur : `pseudo`
  - Statistique : `streak défaites consécutives`
  - Tooltip : "Nombre maximum de défaites consécutives"
- **Calcul** : 
  - Identification des séries de défaites consécutives
  - Sélection de la plus longue série

#### Le Précheur
- **Description** : Joueur le plus actif
- **Source de données** : `globalStats.activity.most_active`
- **Structure JSON** :
  ```json
  {
    "player_id": "UUID",
    "pseudo": "STRING",
    "match_count": "INTEGER"
  }
  ```
- **Affichage** :
  - Badge : `precheur.png`
  - Détenteur : `pseudo`
  - Statistique : `match_count matchs`
  - Tooltip : "Nombre total de matchs joués"
- **Calcul** : 
  - Comptage du nombre total de matchs joués par joueur
  - Sélection du joueur avec le plus de matchs

#### Le Fantôme
- **Description** : Joueur le moins actif
- **Source de données** : `globalStats.activity.least_active`
- **Structure JSON** : Identique à `most_active`
- **Affichage** :
  - Badge : `fantome.png`
  - Détenteur : `pseudo`
  - Statistique : `match_count matchs`
  - Tooltip : "Nombre total de matchs joués"
- **Calcul** : 
  - Comptage du nombre total de matchs joués par joueur
  - Sélection du joueur avec le moins de matchs (non désactivé)

## Titres suggérés pour le futur

Les titres suivants ne sont pas encore implémentés dans la fonction `get_global_stats()` mais sont proposés pour des développements futurs.

### Le Classico
- **Description** : Les plus grandes rivalités
- **Source de données** : `globalStats.fun_stats.classicos` (à implémenter)
- **Structure JSON suggérée** :
  ```json
  [
    {
      "team1": {
        "player1_id": "UUID",
        "player2_id": "UUID",
        "player1_pseudo": "STRING",
        "player2_pseudo": "STRING",
        "wins": "INTEGER"
      },
      "team2": {
        "player1_id": "UUID",
        "player2_id": "UUID",
        "player1_pseudo": "STRING",
        "player2_pseudo": "STRING",
        "wins": "INTEGER"
      },
      "total_matches": "INTEGER"
    }
  ]
  ```
- **Affichage proposé** :
  - Badge : `clasico.png`
  - Liste d'affrontements entre équipes
  - Pour chaque classico :
    - Équipe 1 vs Équipe 2
    - Score : `team1.wins - team2.wins`
    - Tooltip : `total_matches matchs joués entre ces équipes`
- **Calcul suggéré** : 
  - Paires d'équipes s'étant affrontées au moins 3 fois
  - Tri par nombre total de matchs joués entre les mêmes équipes

### Le Dessert
- **Description** : Champion des matchs entre 12h et 14h30
- **Source de données** : `globalStats.fun_stats.le_dessert` (à implémenter)
- **Structure JSON suggérée** :
  ```json
  {
    "player_id": "UUID",
    "pseudo": "STRING",
    "victories": "INTEGER",
    "total_matches": "INTEGER",
    "win_rate": "DECIMAL"
  }
  ```
- **Affichage proposé** :
  - Badge : `dessert.png`
  - Détenteur : `pseudo`
  - Statistique : `win_rate` (pourcentage)
  - Tooltip : `victories victoires sur total_matches matchs`
- **Calcul suggéré** : 
  - Joueurs ayant joué au moins 5 matchs pendant la pause déjeuner
  - Tri par taux de victoire puis nombre de matchs

### Le Premier Sang
- **Description** : Première victoire du lundi
- **Source de données** : `globalStats.fun_stats.first_blood` (à implémenter)
- **Structure JSON suggérée** :
  ```json
  [
    {
      "player_id": "UUID",
      "pseudo": "STRING",
      "count": "INTEGER"
    }
  ]
  ```
- **Affichage proposé** :
  - Badge : `premier-sang.png`
  - Détenteurs : Tous les joueurs avec le même nombre maximum de "first blood"
  - Statistique : `count victoires`
  - Tooltip : "Nombre de fois où le joueur a fait la première victoire du lundi"
- **Calcul suggéré** : 
  - Comptage des victoires dans le premier match de chaque lundi
  - Tri par nombre de "first blood"

### Le Comte de Monte-Cristo
- **Description** : Meilleur vengeur
- **Source de données** : `globalStats.fun_stats.le_revenger` (à implémenter)
- **Structure JSON suggérée** :
  ```json
  [
    {
      "player_id": "UUID",
      "pseudo": "STRING",
      "revenge_rate": "DECIMAL",
      "revenge_wins": "INTEGER",
      "revenge_chances": "INTEGER"
    }
  ]
  ```
- **Affichage proposé** :
  - Badge : `monte-cristo.png`
  - Détenteurs : Tous les joueurs avec le même taux de revanche maximum
  - Statistique : `revenge_rate` (pourcentage)
  - Tooltip : `revenge_wins vengeances sur revenge_chances tentatives`
- **Calcul suggéré** : 
  - Joueurs ayant eu au moins 3 opportunités de revanche
  - Tri par taux de revanche réussie puis nombre d'opportunités

### L'Esclave
- **Description** : Joueur le plus fidèle à ses partenaires
- **Source de données** : `globalStats.fun_stats.le_fidele` (à implémenter)
- **Structure JSON suggérée** :
  ```json
  {
    "player_id": "UUID",
    "pseudo": "STRING",
    "unique_partners": "INTEGER",
    "total_matches": "INTEGER"
  }
  ```
- **Affichage proposé** :
  - Badge : `esclave.png`
  - Détenteur : `pseudo`
  - Statistique : `unique_partners partenaires`
  - Tooltip : `unique_partners partenaires sur total_matches matchs`
- **Calcul suggéré** : 
  - Joueurs ayant joué au moins 5 matchs
  - Tri par nombre de partenaires uniques (croissant)

### Le Casanova
- **Description** : Change le plus souvent de partenaire
- **Source de données** : `globalStats.fun_stats.le_casanova` (à implémenter)
- **Structure JSON suggérée** :
  ```json
  {
    "player_id": "UUID",
    "pseudo": "STRING",
    "unique_partners": "INTEGER",
    "total_matches": "INTEGER",
    "partner_change_rate": "DECIMAL"
  }
  ```
- **Affichage proposé** :
  - Badge : `casanova.png`
  - Détenteur : `pseudo`
  - Statistique : `partner_change_rate` (pourcentage)
  - Tooltip : `unique_partners partenaires sur total_matches matchs`
- **Calcul suggéré** : 
  - Joueurs ayant joué au moins 5 matchs
  - Tri par taux de changement de partenaire (décroissant)

## Mise à jour des données

### Fréquence
Les statistiques sont recalculées à chaque :
- Affichage du dashboard
- Création d'un nouveau match
- Actualisation de la page

### Périodicité
- Par défaut : Statistiques basées sur l'ensemble des matchs
- Option : Filtrage par mois (`p_date` dans `get_global_stats()`)

### Maintenance
La décroissance hebdomadaire des statistiques est gérée via :
- Fonction `weekly_decay()`
- Cron hebdomadaire exécuté le dimanche à minuit 