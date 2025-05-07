# Documentation des Retours des Fonctions Statistiques

## Vue d'ensemble

Ce document détaille la structure des données retournées par les différentes fonctions statistiques. Chaque type de retour est documenté avec sa structure JSON et ses règles de calcul.

## Retours par Fonction

### 1. get_base_match_stats()

```json
{
  "perfect_wins": [{
    "player_id": "UUID",
    "pseudo": "STRING",
    "count": "INTEGER"
  }],
  "perfect_losses": [{
    "player_id": "UUID",
    "pseudo": "STRING",
    "count": "INTEGER"
  }],
  "close_wins": [{
    "player_id": "UUID",
    "pseudo": "STRING",
    "count": "INTEGER"
  }],
  "close_losses": [{
    "player_id": "UUID",
    "pseudo": "STRING",
    "count": "INTEGER"
  }],
  "activity": {
    "most_active": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "match_count": "INTEGER"
    }],
    "least_active": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "match_count": "INTEGER"
    }]
  }
}
```

#### Règles de Calcul
- **Perfect Wins/Losses**: Matchs gagnés/perdus 10-0
- **Close Wins/Losses**: Matchs gagnés/perdus 10-9
- **Activity**: Basé sur le nombre total de matchs joués

### 2. get_complex_stats()

```json
{
  "streaks": {
    "longest_win": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "streak_length": "INTEGER",
      "start_date": "DATE",
      "end_date": "DATE"
    }],
    "longest_lose": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "streak_length": "INTEGER",
      "start_date": "DATE",
      "end_date": "DATE"
    }]
  },
  "positions": {
    "best_attacker": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL"
    }],
    "worst_attacker": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "defeats": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL",
      "loss_rate": "DECIMAL"
    }],
    "best_defender": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL"
    }],
    "worst_defender": [{
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "defeats": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL",
      "loss_rate": "DECIMAL"
    }]
  },
  "pairs": {
    "best_pair": [{
      "player1_id": "UUID",
      "player2_id": "UUID",
      "player1_pseudo": "STRING",
      "player2_pseudo": "STRING",
      "victories": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL"
    }],
    "worst_pair": [{
      "player1_id": "UUID",
      "player2_id": "UUID",
      "player1_pseudo": "STRING",
      "player2_pseudo": "STRING",
      "victories": "INTEGER",
      "defeats": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL",
      "loss_rate": "DECIMAL"
    }]
  }
}
```

#### Règles de Calcul
- **Streaks**: Séquences consécutives de victoires/défaites
- **Positions**: Minimum 3 matchs par position
- **Pairs**: Minimum 3 matchs ensemble
- **Win/Loss Rates**: Utilisation de taux bayésiens (victoires + 1) / (total + 2)

### 3. get_historical_stats()

```json
{
  "fun_stats": {
    "first_blood": {
      "player_id": "UUID",
      "pseudo": "STRING",
      "match_count": "INTEGER",
      "win_rate": "DECIMAL"
    },
    "les_classicos": {
      "team1": {
        "attacker_id": "UUID",
        "attacker_pseudo": "STRING",
        "defender_id": "UUID",
        "defender_pseudo": "STRING",
        "victories": "INTEGER"
      },
      "team2": {
        "attacker_id": "UUID",
        "attacker_pseudo": "STRING",
        "defender_id": "UUID",
        "defender_pseudo": "STRING",
        "victories": "INTEGER"
      },
      "total_matches": "INTEGER"
    },
    "le_fidele": {
      "player_id": "UUID",
      "pseudo": "STRING",
      "favorite_partner_id": "UUID",
      "favorite_partner_pseudo": "STRING",
      "max_matches_with_partner": "INTEGER",
      "total_partners": "INTEGER",
      "fidelity_rate": "DECIMAL"
    },
    "le_casanova": {
      "player_id": "UUID",
      "pseudo": "STRING",
      "distinct_partners": "INTEGER",
      "total_matches": "INTEGER",
      "partner_change_rate": "DECIMAL"
    },
    "le_dessert": {
      "player_id": "UUID",
      "pseudo": "STRING",
      "victories": "INTEGER",
      "total_matches": "INTEGER",
      "win_rate": "DECIMAL"
    }
  }
}
```

#### Règles de Calcul

##### First Blood
- Premier match du lundi
- Minimum 3 premiers matchs
- Taux de victoire bayésien

##### Les Classicos
- Affrontements entre mêmes équipes
- Minimum 3 matchs entre les équipes
- Composition exacte des équipes

##### Le Fidèle
- Minimum 10 matchs au total
- Taux de fidélité = matchs avec partenaire favori / total matchs
- Inclut identifiant et pseudo du partenaire favori

##### Le Casanova
- Minimum 10 matchs au total
- Taux de changement = partenaires uniques / matchs totaux
- Plus le taux est élevé, plus le joueur change souvent de partenaire

##### Le Dessert
- Matchs entre 12h et 14h30
- Minimum 5 matchs sur cette période
- Taux de victoire bayésien

## Gestion des Égalités

Pour toutes les statistiques, en cas d'égalité sur le critère principal :
- Les données sont retournées dans un tableau
- Tous les joueurs/paires à égalité sont inclus
- Le tri secondaire se fait sur le nombre de matchs

## Valeurs Nulles

- Les statistiques ne satisfaisant pas les critères minimums retournent `null`
- Les tableaux vides sont retournés comme `[]`
- Les taux sont toujours des nombres entre 0 et 1

## Format des Dates

Toutes les dates sont retournées au format ISO 8601 :
```json
{
  "date": "2024-03-21T14:30:00.000Z"
}
``` 