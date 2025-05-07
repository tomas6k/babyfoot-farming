# Fonctions SQL

Ce document centralise toutes les fonctions SQL utilisées dans l'application Babyfoot Farming.

## Vue d'ensemble des fonctions

| Nom | Description | Utilisé par | Dépendances |
|-----|-------------|-------------|-------------|
| `get_players_level()` | Calcule le niveau, l'expérience, le mana et les HP des joueurs | Front (Dashboard, MatchHistory, NewMatch) | `players`, `matches`, `levels` |
| `get_player_stats(player_id, month)` | Statistiques détaillées d'un joueur | Front (Dashboard, Profile) | `players`, `matches` |
| `process_match(...)` | Traite un nouveau match et met à jour les stats | Front (NewMatch) | `players`, `matches` |
| `get_match_history_with_levels(...)` | Historique des matchs avec niveaux | Front (MatchHistory) | `matches`, `players` |
| `get_level_info()` | Information sur les niveaux et l'expérience requise | Front (Profile) | `levels` |
| `get_global_stats(month)` | Statistiques globales du jeu | Front (Dashboard) | `matches`, `players` |
| `get_replayability(...)` | Calcule le score de rejouabilité | Front (NewMatch) | `matches`, `players` |

## Triggers

| Nom | Description | Déclenché par |
|-----|-------------|---------------|
| `handle_new_user()` | Initialise un nouveau joueur | `INSERT ON auth.users` |
| `update_updated_at_column()` | Met à jour le timestamp | `UPDATE ON tables` |

## Fonctions de maintenance

| Nom | Description | Automatisation |
|-----|-------------|---------------|
| `reset_hp_mana()` | Réinitialise HP/Mana quotidiennement | Cron quotidien |
| `weekly_decay()` | Applique la décroissance hebdomadaire | Cron hebdomadaire |
| `populate_levels()` | Initialise la table des niveaux | Manuel |

## Détails des fonctions

### get_players_level()

**Description :**  
Calcule le niveau, l'expérience, le mana et les HP de chaque joueur.

**Utilisé par :**
- Dashboard (affichage des niveaux)
- MatchHistory (affichage des niveaux)
- NewMatch (sélection des joueurs)

**Dépendances :**
- Table `players` : Données des joueurs
- Table `matches` : Historique des matchs
- Table `levels` : Configuration des niveaux

**Retourne :**
```sql
(
  id uuid,
  pseudo text,
  exp integer,
  level integer,
  title varchar,
  description varchar,
  illustration_url varchar,
  required_exp integer,
  exp_given integer,
  next_level_exp integer,
  progress double precision,
  mana integer,
  hp integer,
  disable boolean
)
```

### get_player_stats(player_id uuid, month date)

**Description :**  
Statistiques détaillées d'un joueur incluant performances en attaque/défense et partenaires/adversaires préférés.

**Utilisé par :**
- Dashboard (statistiques mensuelles)
- Profile (statistiques détaillées)

**Dépendances :**
- Table `players` : Données des joueurs
- Table `matches` : Historique des matchs

**Retourne :**
```sql
(
  player_id uuid,
  pseudo text,
  exp integer,
  total_matches integer,
  victories integer,
  defeats integer,
  goals_for integer,
  goals_against integer,
  -- Statistiques attaquant/défenseur
  total_matches_attacker integer,
  victories_attacker integer,
  -- etc...
  -- Meilleurs/pires partenaires et adversaires
  best_partner_id uuid,
  best_partner_pseudo text,
  -- etc...
)
```

### process_match(...)

**Description :**  
Traite un nouveau match, met à jour les statistiques et calcule l'expérience/mana/HP gagnés.

**Utilisé par :**
- NewMatch (création d'un match)

**Dépendances :**
- Table `players` : Pour les mises à jour
- Table `matches` : Pour l'enregistrement
- Table `levels` : Pour les calculs d'expérience

**Paramètres :**
```sql
(
  p_white_attacker uuid,
  p_white_defender uuid,
  p_black_attacker uuid,
  p_black_defender uuid,
  p_score_white integer,
  p_score_black integer,
  p_added_by uuid
)
```

**Retourne :**
```sql
(
  player_id uuid,
  pseudo text,
  old_exp integer,
  new_exp integer,
  old_mana integer,
  new_mana integer,
  old_hp integer,
  new_hp integer
)
```

### get_match_history_with_levels(...)

**Description :**  
Récupère l'historique des matchs avec les niveaux des joueurs au moment du match.

**Utilisé par :**
- MatchHistory (affichage de l'historique)

**Paramètres :**
```sql
(
  p_player_id text,
  p_page_number integer,
  p_items_per_page integer
)
```

**Retourne :**
```json
{
  "matches": [...],
  "total_count": integer,
  "total_pages": integer
}
```

### get_replayability(player_id uuid, partner_id uuid)

**Description :**  
Calcule un score de rejouabilité entre deux joueurs basé sur leur historique commun.

**Utilisé par :**
- NewMatch (suggestions de partenaires)

**Retourne :**
```sql
double precision -- Score entre 0 et 1
```

## Fonctions utilitaires

### populate_levels()

**Description :**  
Initialise la table des niveaux avec les configurations de base.

**Utilisation :**
- Manuelle, lors de l'initialisation de la base
- Mise à jour des paramètres de progression

### reset_hp_mana()

**Description :**  
Réinitialise les points de vie et le mana de tous les joueurs.

**Automatisation :**
- Cron quotidien à minuit

### weekly_decay()

**Description :**  
Applique une décroissance hebdomadaire aux statistiques des joueurs inactifs.

**Automatisation :**
- Cron hebdomadaire le dimanche à minuit 