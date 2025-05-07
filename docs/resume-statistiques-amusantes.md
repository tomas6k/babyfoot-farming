# Statistiques amusantes implémentées dans get_global_stats()

## Résumé des modifications

La fonction `get_global_stats()` a été enrichie avec de nouvelles statistiques amusantes pour rendre l'application plus engageante. Ces statistiques sont regroupées sous la clé JSON `fun_stats` dans le résultat de la fonction.

## Liste des statistiques implémentées

### 1. Le Dessert

**Description :** Identifie le joueur ayant le meilleur taux de victoire pendant la pause déjeuner (entre 12h00 et 14h30).

**Format JSON :**
```json
"le_dessert": {
  "player_id": "uuid",
  "pseudo": "nom_joueur",
  "victories": 10,
  "total_matches": 15,
  "win_rate": 0.647
}
```

**Logique de calcul :**
- Filtre les matchs joués entre 12h00 et 14h30
- Calcule un taux de victoire bayésien pour chaque joueur
- Exige au moins 5 matchs joués durant cet horaire

### 2. Le Fidèle

**Description :** Identifie le joueur le plus fidèle à son partenaire, celui qui joue le plus souvent avec la même personne.

**Format JSON :**
```json
"le_fidele": {
  "player_id": "uuid",
  "pseudo": "nom_joueur",
  "favorite_partner_id": "uuid",
  "favorite_partner_pseudo": "nom_partenaire",
  "max_matches_with_partner": 20,
  "total_partners": 3,
  "fidelity_rate": 0.80
}
```

**Logique de calcul :**
- Analyse toutes les paires de joueurs dans les matchs
- Calcule le ratio entre le nombre de matchs joués avec le partenaire favori et le total des matchs
- Exige au moins 10 matchs au total et plus d'un partenaire

### 3. Le Casanova

**Description :** Identifie le joueur qui change le plus souvent de partenaire.

**Format JSON :**
```json
"le_casanova": {
  "player_id": "uuid",
  "pseudo": "nom_joueur",
  "distinct_partners": 8,
  "total_matches": 15,
  "partner_change_rate": 0.53
}
```

**Logique de calcul :**
- Compte le nombre de partenaires distincts pour chaque joueur
- Calcule le ratio entre le nombre de partenaires distincts et le nombre total de matchs
- Exige au moins 10 matchs au total

### 4. First Blood (non documenté dans l'UI actuelle)

**Description :** Identifie le joueur ayant le meilleur taux de victoire lors du premier match du lundi.

**Format JSON :**
```json
"first_blood": {
  "player_id": "uuid",
  "pseudo": "nom_joueur",
  "victories": 5,
  "total_first_matches": 8,
  "win_rate": 0.60
}
```

**Logique de calcul :**
- Identifie le premier match de chaque lundi
- Calcule un taux de victoire bayésien pour chaque joueur
- Exige au moins 3 premiers matchs du lundi

### 5. Le Revenger (non documenté dans l'UI actuelle)

**Description :** Identifie le joueur qui gagne le plus souvent contre des équipes qui l'ont précédemment battu.

**Format JSON :**
```json
"le_revenger": {
  "player_id": "uuid",
  "pseudo": "nom_joueur",
  "total_revenge_matches": 6,
  "revenge_rate": 0.3
}
```

**Logique de calcul :**
- Identifie les matchs où les mêmes 4 joueurs s'affrontent
- Détecte quand un joueur bat une équipe qui l'avait précédemment battu
- Calcule le taux de revanche par rapport au nombre total de matchs du joueur
- Exige au moins 2 matchs de revanche

### 6. Les Classicos (non documenté dans l'UI actuelle)

**Description :** Identifie les affrontements les plus fréquents entre deux équipes.

**Format JSON :**
```json
"les_classicos": {
  "team1_player1": "uuid",
  "team1_player2": "uuid",
  "team2_player1": "uuid",
  "team2_player2": "uuid",
  "team1_player1_pseudo": "nom_joueur1",
  "team1_player2_pseudo": "nom_joueur2",
  "team2_player1_pseudo": "nom_joueur3",
  "team2_player2_pseudo": "nom_joueur4",
  "total_matches": 12,
  "team1_victories": 7, 
  "team2_victories": 5
}
```

**Logique de calcul :**
- Groupe les matchs par combinaison exacte d'équipes
- Exige au moins 3 matchs entre les mêmes équipes exactes

## Intégration frontend

Pour utiliser ces statistiques dans l'interface utilisateur, il suffit d'accéder à la clé `fun_stats` dans le JSON retourné par `/api/stats/global`. Par exemple :

```typescript
const { data } = await supabase.from('fun_stats').select('*');
const leDessert = data?.fun_stats?.le_dessert;
const leFidele = data?.fun_stats?.le_fidele;
// etc.
```

## Considérations techniques

- Chaque statistique est calculée avec des critères minimum pour garantir la pertinence (nombre minimum de matchs)
- Pour certaines statistiques, un taux bayésien est utilisé pour éviter les biais liés aux petits échantillons
- La fonction reste performante même avec un grand nombre de matchs grâce à l'utilisation de CTEs (Common Table Expressions)
- Ces statistiques sont disponibles avec les mêmes options de filtrage par date que les autres statistiques 