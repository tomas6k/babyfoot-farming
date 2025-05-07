# Structure de la Base de Données

## Tables Principales

### Players
Table qui stocke les informations des joueurs.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | UUID | Identifiant unique du joueur | Primary Key, Default: uuid_generate_v4() |
| user_id | UUID | Référence vers la table auth.users | Foreign Key, Not Null |
| pseudo | TEXT | Pseudonyme du joueur | Unique, Not Null, Length: 3-20 chars |
| exp | INTEGER | Points d'expérience | Default: 0, >= 0 |
| mana | INTEGER | Points de mana | Default: 5, 0-10 |
| hp | INTEGER | Points de vie | Default: 5, 0-10 |
| disable | BOOLEAN | Indique si le joueur est désactivé | Default: false, Not Null |
| created_at | TIMESTAMPTZ | Date de création | Default: now() |
| updated_at | TIMESTAMPTZ | Date de mise à jour | Default: now() |

### Matches
Table qui enregistre les matchs joués.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | UUID | Identifiant unique du match | Primary Key, Default: uuid_generate_v4() |
| date | TIMESTAMPTZ | Date du match | Not Null, Default: now() |
| white_attacker | UUID | ID du joueur attaquant blanc | Foreign Key (players), Not Null |
| white_defender | UUID | ID du joueur défenseur blanc | Foreign Key (players), Not Null |
| black_attacker | UUID | ID du joueur attaquant noir | Foreign Key (players), Not Null |
| black_defender | UUID | ID du joueur défenseur noir | Foreign Key (players), Not Null |
| score_white | INTEGER | Score de l'équipe blanche | 0-10, Not Null |
| score_black | INTEGER | Score de l'équipe noire | 0-10, Not Null |
| added_by | UUID | ID du joueur qui a ajouté le match | Nullable |
| created_at | TIMESTAMPTZ | Date de création | Default: now() |
| updated_at | TIMESTAMPTZ | Date de mise à jour | Default: now() |

La table contient également des colonnes pour suivre l'expérience et les statistiques des joueurs avant et après le match :
- `*_exp_before`: Points d'expérience avant le match
- `*_exp_after`: Points d'expérience après le match
- `*_hp_before`: Points de vie avant le match
- `*_hp_after`: Points de vie après le match
- `*_mana_before`: Points de mana avant le match
- `*_mana_after`: Points de mana après le match

### Levels
Table qui définit les niveaux et les récompenses.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| level | INTEGER | Numéro du niveau | Primary Key |
| min_exp | INTEGER | Expérience minimum requise | Not Null |
| exp_given | INTEGER | Expérience donnée pour ce niveau | Not Null |
| title | VARCHAR | Titre du niveau | Nullable |
| description | TEXT | Description du niveau | Nullable |
| illustration | VARCHAR | URL de l'illustration | Nullable |

### Game Config
Table de configuration du jeu.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | INTEGER | Identifiant unique | Primary Key |
| key | VARCHAR | Clé de configuration | Unique, Not Null |
| value | INTEGER | Valeur de configuration | Not Null |
| description | TEXT | Description de la configuration | Nullable |
| created_at | TIMESTAMPTZ | Date de création | Default: now() |
| updated_at | TIMESTAMPTZ | Date de mise à jour | Default: now() |

### Exp Decay History
Table qui enregistre l'historique de la décroissance d'expérience.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | UUID | Identifiant unique | Primary Key, Default: uuid_generate_v4() |
| player_id | UUID | ID du joueur concerné | Foreign Key (players) |
| decay_date | TIMESTAMPTZ | Date de la décroissance | Default: now() |
| exp_before | INTEGER | Expérience avant décroissance | Nullable |
| exp_after | INTEGER | Expérience après décroissance | Nullable |
| mana_added | INTEGER | Mana ajoutée | Nullable |
| matches_played | INTEGER | Nombre de matchs joués | Nullable |

## Relations

1. **Players - Matches**:
   - Un joueur peut participer à plusieurs matchs
   - Un match a exactement 4 joueurs (attaquants et défenseurs)

2. **Players - Exp Decay History**:
   - Un joueur peut avoir plusieurs enregistrements de décroissance d'expérience
   - Chaque enregistrement est lié à un seul joueur

3. **Players - Users**:
   - Chaque joueur est lié à un utilisateur dans la table auth.users
   - Relation one-to-one

## Schémas

La base de données utilise plusieurs schémas :
- `public`: Tables principales de l'application
- `auth`: Gestion des utilisateurs et de l'authentification
- `storage`: Gestion du stockage des fichiers
- `realtime`: Fonctionnalités temps réel 

## Politiques de Sécurité (RLS)

### Table `matches`

#### Politiques d'insertion
- **Enable insert for authenticated users only**
  - Permet l'insertion uniquement aux utilisateurs authentifiés
  - L'utilisateur doit être :
    - Soit l'un des joueurs du match (white_attacker, white_defender, black_attacker, black_defender)
    - Soit l'utilisateur qui ajoute le match (added_by)
  - Vérifie que auth.uid() est non null

#### Politiques de lecture
- **Enable read access for authenticated users**
  - Permet la lecture à tous les utilisateurs authentifiés
  - Aucune restriction supplémentaire

### Exemple d'utilisation
```sql
-- Insertion autorisée (utilisateur est un joueur)
INSERT INTO matches (
  white_attacker, white_defender,
  black_attacker, black_defender,
  score_white, score_black,
  added_by
) VALUES (
  'player1-uuid', 'player2-uuid',
  'player3-uuid', 'player4-uuid',
  10, 8,
  'auth-user-uuid'
);

-- Lecture autorisée pour tout utilisateur authentifié
SELECT * FROM matches;
``` 