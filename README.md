# Vue d'ensemble
Application de gestion de matchs de babyfoot avec un système de progression RPG. Les joueurs gagnent de l'expérience, montent de niveau et débloquent des rangs au fil de leurs parties.

Le problème : Les parties de babyfoot traditionnelles manquent d'un système de progression et de motivation à long terme.

La solution : Un système RPG qui récompense la participation et la progression, inspiré des jeux vidéo classiques.

# Fonctionnalités Principales

## 1. Système de Progression RPG
- Système d'XP et de niveaux pour chaque joueur
- Table `levels` pour gérer les niveaux
- Fonction `get_level_info` pour récupérer les informations de niveau
- Vue `levels_with_info` pour l'affichage des données
- Héritage des titres et illustrations des niveaux inférieurs
- Rangs thématiques avec illustrations pixel art

### 2. Tableau de Classement
- Affichage des statistiques des joueurs
- Barres de ressources (HP/MANA) pour chaque joueur
- Statistiques détaillées (victoires, défaites, ratio, buts..)

### 3. Configuration du Jeu
- Table `game_config` pour les paramètres globaux
- Configuration des points de vie (HP) et de mana maximum
- Interface personnalisable via la base de données

## 4. Gestion des Ressources
- Système de HP (points de vie) et Mana
- Régénération hebdomadaire automatique
- Malus basés sur l'inactivité

## 5. Enregistrement des Matchs
- Interface intuitive pour les matchs 2v2 (équipe des blancs et équipe des noirs)
- Il ne peut pas y avoir de match nul et le gagnant est obligatoirement à 10 buts
- Calcul automatique de l'XP basé sur les niveaux
- Historique détaillé des parties

### 6. Interface Utilisateur
- Design pixel art cohérent
- Composants personnalisés (tables, boutons, cartes)
- Tooltips informatifs
- Barres de progression stylisées
- Navigation principale responsive

# Expérience Utilisateur

## Personas
1. Le Joueur Casual
   - Joue occasionnellement
   - Apprécie l'aspect social
   - Motivé par la progression

2. Le Compétiteur
   - Joue régulièrement
   - Vise les hauts rangs
   - Analyse ses statistiques

## Parcours Utilisateur
1. Inscription et Création de Profil
2. Découverte du Dashboard
3. Participation aux matchs
4. Progression et déblocage de rangs
5. Consultation des statistiques

## Considérations UI/UX
- Design pixel art inspiré des jeux Gameboy
- Interface intuitive et rapide d'accès
- Animations rétro pour les moments clés

## Modèles de Données
1. Table `levels`
level (INT, PK)
required_exp (INT)
exp_given (INT)
title (TEXT)
description (TEXT)
illustration (TEXT)

2. Table `players`
id (UUID, PK)
name (TEXT)
exp (INT)
mana (INT)
hp (INT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)

3. Table `matches`
id
white_attacker, white_defender, black_attacker, black_defender (UUID FK)
white_score, black_score (INT)
created_at (TIMESTAMP)
white_attacker_exp_before, white_defender_exp_before, black_attacker_exp_before, black_defender_exp_before (INT)
white_attacker_exp_after, white_defender_exp_after, black_attacker_exp_after, black_defender_exp_after (INT)
added_by (UUID)

4. Table `game_config`
key (TEXT, PK)
value (FLOAT or INT)
description (TEXT)
Clés importantes :
mana_default
hp_default
xp_decay_percent
mana_bonus
min_matches_per_week
exp_rate

## Routes de l'Application
- `/` - Page d'accueil
- `/dashboard` - Tableau de classement
- `/match/new` - Création d'un nouveau match
- `/api/levels` - API pour les informations de niveau

## Style et Design
L'application utilise un thème pixel art RPG avec :
- Cartes stylisées avec bordures pixelisées
- Boutons avec effet de profondeur
- Barres de progression personnalisées
- Tables avec design rétro
- Palette de couleurs cohérente

### Composants Principaux

#### 1. PlayerStatsTable
- Affichage des statistiques des joueurs
- Intégration avec le système de niveaux
- Gestion des ressources (HP/MANA)
- Tooltips pour les informations détaillées

#### 2. ResourceBar
- Affichage visuel des ressources
- Support des types HP et MANA
- Design pixel art personnalisé
- Calcul automatique des ratios

#### 3. AuthGuard
- Protection des routes authentifiées
- Gestion des sessions Supabase
- Redirection automatique
- Gestion des événements de connexion/déconnexion

### Sécurité

#### 1. Authentification
- Utilisation de Supabase Auth
- Tokens JWT pour l'authentification API
- Sessions persistantes avec refresh tokens
- Protection CSRF intégrée

#### 2. Autorisations Base de Données
```sql
-- Exemple de politique RLS
CREATE POLICY "Lecture publique des niveaux"
ON levels FOR SELECT
TO authenticated
USING (true);
```

### Optimisations

#### 1. Performance
- Mise en cache des données de niveau
- Chargement différé des images
- Optimisation des requêtes Supabase

#### 2. UX
- Feedback visuel immédiat
- Animations fluides
- Design responsive
- Thème pixel art cohérent

## Déploiement

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase

## Roadmap

### Fonctionnalités Futures
1. Système de tournois
2. Classements saisonniers
3. Achievements
4. Mode spectateur
5. Statistiques avancées

