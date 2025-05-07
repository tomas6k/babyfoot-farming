# Composant MatchHistory

## Objectif
Afficher l'historique des matchs de babyfoot avec les détails des équipes, les niveaux des joueurs, les gains d'expérience et les scores.

## Structure des données

### Interface MatchHistoryItem
```typescript
interface MatchHistoryItem {
  id: string;
  date: string;
  // Équipe blanche
  white_attacker_pseudo: string;
  white_attacker_level: number;
  white_attacker_exp_gained: number;
  white_defender_pseudo: string;
  white_defender_level: number;
  white_defender_exp_gained: number;
  white_team_level: number;
  // Équipe noire
  black_attacker_pseudo: string;
  black_attacker_level: number;
  black_attacker_exp_gained: number;
  black_defender_pseudo: string;
  black_defender_level: number;
  black_defender_exp_gained: number;
  black_team_level: number;
  // Scores
  score_white: number;
  score_black: number;
}
```

## Fonctionnalités

### 1. Affichage des matchs
- Date et heure du match formatées en français
- Score final avec mise en évidence de l'équipe gagnante
- Pour chaque équipe (blanche et noire) :
  - Niveau total de l'équipe (somme des niveaux des joueurs)
  - Attaquant et défenseur avec :
    - Pseudo du joueur
    - Niveau actuel
    - Gains d'expérience du match
  - Mise en évidence visuelle de l'équipe gagnante (fond vert clair)

### 2. Filtrage
- Filtre par joueur spécifique via un sélecteur
- Option "Tous les joueurs" disponible
- Réinitialisation automatique à la page 1 lors du changement de filtre
- Désactivation du sélecteur pendant le chargement

### 3. Pagination
- Nombre configurable de matchs par page (actuellement 10)
- Navigation entre les pages avec :
  - Boutons Précédent/Suivant
  - Numéros de pages cliquables
  - Indication visuelle de la page courante
  - Désactivation des boutons aux limites
- Pagination masquée s'il n'y a qu'une seule page

## États d'interface

### 1. Chargement
```tsx
<div className="text-center py-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
  <p className="mt-2">Chargement de l'historique...</p>
</div>
```

### 2. Erreur
```tsx
<div className="text-red-500 p-4 rounded-lg bg-red-50">
  <p className="font-semibold">Erreur:</p>
  <p>{error}</p>
  <Button 
    variant="outline" 
    className="mt-4"
    onClick={() => {
      setError(null);
      setCurrentPage(1);
    }}
  >
    Réessayer
  </Button>
</div>
```

### 3. Liste vide
```tsx
<div className="text-center py-8 text-gray-500">
  Aucun match trouvé
</div>
```

## Intégration avec la base de données

### Fonction PostgreSQL
Utilise la fonction `get_match_history_with_levels` qui :
- Accepte les paramètres :
  - `p_player_id` : UUID du joueur pour le filtrage (optionnel)
  - `p_page_number` : Numéro de la page (défaut: 1)
  - `p_items_per_page` : Nombre d'éléments par page (défaut: 10)
- Retourne un objet JSON contenant :
  - `matches` : Liste des matchs avec détails
  - `total_count` : Nombre total de matchs

### Appels API
```typescript
const { data, error } = await supabase.rpc('get_match_history_with_levels', {
  p_player_id: selectedPlayer,
  p_page_number: currentPage,
  p_items_per_page: ITEMS_PER_PAGE
});
```

## Gestion des erreurs
1. Erreurs de chargement des données
   - Affichage d'un message d'erreur explicite
   - Bouton de réessai
   - Log détaillé dans la console
2. Données manquantes
   - Valeurs par défaut pour les tableaux vides
   - Gestion des valeurs nulles
3. Erreurs de pagination
   - Validation des limites de page
   - Redirection vers la page 1 en cas d'erreur

## Performance
- Pagination côté serveur
- Calcul des niveaux optimisé en SQL
- Mise en cache des données de joueurs
- Désactivation des contrôles pendant le chargement
- Debouncing des changements de filtre

## Dépendances
```json
{
  "@supabase/supabase-js": "^2.x",
  "date-fns": "^2.x",
  "date-fns/locale": "fr",
  "@/components/ui/card": "shadcn/ui",
  "@/components/ui/button": "shadcn/ui",
  "@/components/ui/select": "shadcn/ui"
}
```

## Exemple d'utilisation
```tsx
// Page d'historique
export default function MatchHistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Historique des Matchs
      </h1>
      <MatchHistory />
    </div>
  );
}
```

## Maintenance
- Vérifier régulièrement les performances de la requête SQL
- Mettre à jour les dépendances UI
- Optimiser le calcul des niveaux si nécessaire
- Ajouter des fonctionnalités de tri
- Implémenter un système de filtres avancés 