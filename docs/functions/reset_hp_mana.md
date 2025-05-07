# Fonction reset_hp_mana

## Objectif
Restaurer automatiquement les points de vie (HP) et les points de mana de tous les joueurs à leurs valeurs maximales définies dans la table `game_config`. Cette fonction est exécutée automatiquement chaque dimanche à 23h59.

## Paramètres d'entrée
Aucun paramètre n'est requis car la fonction s'exécute automatiquement et affecte tous les joueurs.

## Configuration requise
La table `game_config` doit contenir les valeurs suivantes :
```sql
- max_hp : Nombre maximum de points de vie (valeur par défaut)
- max_mana : Nombre maximum de points de mana (valeur par défaut)
```

## Étapes de traitement

### 1. Récupération des valeurs maximales
- Lecture des valeurs max_hp et max_mana dans la table `game_config`
- Vérification de l'existence des configurations

### 2. Mise à jour des joueurs
- Mise à jour de tous les joueurs non désactivés
- Restauration du HP à la valeur maximale
- Restauration du mana à la valeur maximale

### 3. Journalisation
- Enregistrement de l'opération dans les logs
- Stockage du nombre de joueurs affectés

## Valeur de retour
```sql
RETURNS TABLE (
    reset_time TIMESTAMP,        -- Moment de l'exécution
    players_updated INTEGER,     -- Nombre de joueurs mis à jour
    max_hp_value INTEGER,        -- Valeur maximale de HP utilisée
    max_mana_value INTEGER      -- Valeur maximale de mana utilisée
)
```

## Règles métier importantes
1. Seuls les joueurs actifs (non désactivés) sont affectés
2. Les valeurs maximales sont définies globalement dans `game_config`
3. L'exécution est automatique et hebdomadaire
4. L'opération est atomique (tout ou rien)

## Planification
```sql
-- Exécution automatique chaque dimanche à 23h59
SELECT cron.schedule(
  'reset-hp-mana',              -- Nom unique du job
  '59 23 * * 0',               -- Expression cron (dimanche 23:59)
  'SELECT reset_hp_mana()'      -- Appel de la fonction
);
```

## Impact sur le gameplay
- Permet aux joueurs de recommencer la semaine avec des ressources complètes
- Encourage la participation active au jeu
- Crée un cycle hebdomadaire de gameplay
- Équilibre le jeu en donnant une chance égale à tous les joueurs

## Sécurité
- Fonction exécutée automatiquement sans intervention utilisateur
- Journalisation des opérations pour audit
- Vérification des contraintes d'intégrité

## Tables impactées
```sql
- players : Mise à jour des valeurs HP et mana
- game_config : Lecture des valeurs maximales
- audit_log : Enregistrement de l'opération
```

## Cas d'utilisation
1. Réinitialisation hebdomadaire automatique
2. Maintenance du système
3. Correction d'anomalies
4. Équilibrage du jeu

## Limitations
- Ne peut pas être déclenchée manuellement par les utilisateurs
- Affecte tous les joueurs en même temps
- Ne conserve pas l'historique des valeurs précédentes
- Ne permet pas de personnalisation par joueur

## Dépendances
- Extension pg_cron pour la planification
- Table game_config pour les valeurs maximales
- Table players pour les mises à jour
- Table audit_log pour la journalisation 