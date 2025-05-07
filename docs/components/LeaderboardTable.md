# LeaderboardTable

Le composant `LeaderboardTable` affiche un classement détaillé des joueurs avec leurs statistiques complètes.

## Fonctionnalités

### Affichage des statistiques
- Icône de rôle (attaquant/défenseur) basée sur les performances
- Code couleur pour les ratios :
  - Vert : > 66%
  - Jaune : 33-66%
  - Rouge : < 33%
- Tooltips détaillés sur chaque statistique
- Barre de progression pour l'expérience du niveau

### Colonnes disponibles
1. Position (#)
2. Pseudo avec icône de rôle préféré
3. Niveau actuel
4. Rang avec illustration et description
5. Progression vers le niveau suivant
6. EXP totale
7. EXP gagnée sur la période
8. Nombre total de parties
9. Victoires (avec ratio)
10. Défaites
11. Buts (pour/contre avec ratio)
12. Meilleur partenaire
13. Pire partenaire
14. Meilleur adversaire ("Paysans")
15. Pire adversaire ("Bête noire")

## Interface

```typescript
interface LeaderboardTableProps {
  players: PlayerStats[];
}

interface PlayerStats {
  // Informations générales
  player_id: string;
  pseudo: string;
  exp: number;
  total_exp_gained: number;

  // Niveau et rang
  level: number;
  current_level_min_exp: number;
  next_level_exp: number;
  rank_title: string;
  rank_description: string;
  rank_illustration: string;

  // Statistiques globales
  total_matches: number;
  victories: number;
  defeats: number;
  goals_for: number;
  goals_against: number;
  
  // Statistiques par rôle
  total_matches_attacker: number;
  victories_attacker: number;
  defeats_attacker: number;
  goals_for_attacker: number;
  goals_against_attacker: number;
  total_matches_defender: number;
  victories_defender: number;
  defeats_defender: number;
  goals_for_defender: number;
  goals_against_defender: number;
  
  // Statistiques partenaires/adversaires
  best_partner_pseudo: string | null;
  best_partner_matches: number;
  best_partner_victories: number;
  worst_partner_pseudo: string | null;
  worst_partner_matches: number;
  worst_partner_victories: number;
  best_opponent_pseudo: string | null;
  best_opponent_matches: number;
  best_opponent_victories: number;
  worst_opponent_pseudo: string | null;
  worst_opponent_matches: number;
  worst_opponent_victories: number;
}
```

## Tooltips

### Icône de rôle
- Affiche les statistiques détaillées du rôle (attaquant/défenseur)
- Ratio de victoires et buts pour le rôle

### Niveau et rang
- Niveau : Niveau actuel du joueur
- Rang : Titre et description du rang
- Progression : Expérience requise pour le niveau actuel et le niveau suivant

### Statistiques générales
- EXP : total et gains sur la période
- Parties : total et répartition par rôle
- Victoires : ratio global et par rôle
- Défaites : total et par rôle
- Buts : ratio global et détail par rôle

### Partenaires et adversaires
- Nombre de matchs joués ensemble
- Nombre de victoires
- Ratio de victoires

## Exemple d'utilisation

```tsx
import { LeaderboardTable } from "@/components/LeaderboardTable";

export default function DashboardPage() {
  const players = await getPlayerStats();
  
  return (
    <div className="p-4">
      <h1>Classement</h1>
      <LeaderboardTable players={players} />
    </div>
  );
}
```

## Dépendances

- `@/components/ui/table` : Composants de table de Shadcn
- `@/components/ui/tooltip` : Composants de tooltip de Shadcn
- `@/components/ui/progress` : Composant de barre de progression de Shadcn
- `lucide-react` : Icônes (Swords, Shield)

## Performance

- Mise en cache des calculs de ratio
- Rendu conditionnel des tooltips
- Optimisation du chargement des images de rang

## Accessibilité

- Textes alternatifs pour les icônes et images de rang
- Contraste des couleurs respectant WCAG 2.1
- Structure sémantique avec `<table>`
- Description des barres de progression pour les lecteurs d'écran

## Objectif
Afficher un tableau de classement mensuel des joueurs de babyfoot dans le dashboard, avec leurs statistiques détaillées incluant les ratios de performance et les relations entre joueurs.

## Structure des données

### Types
```typescript
interface PlayerStats {
  // Informations générales
  player_id: string;
  pseudo: string;
  exp: number;
  total_exp_gained: number;

  // Niveau et rang
  level: number;
  current_level_min_exp: number;
  next_level_exp: number;
  rank_title: string;
  rank_description: string;
  rank_illustration: string;

  // Statistiques globales
  total_matches: number;
  victories: number;
  defeats: number;
  goals_for: number;
  goals_against: number;

  // Statistiques par rôle
  total_matches_attacker: number;
  victories_attacker: number;
  defeats_attacker: number;
  goals_for_attacker: number;
  goals_against_attacker: number;
  total_matches_defender: number;
  victories_defender: number;
  defeats_defender: number;
  goals_for_defender: number;
  goals_against_defender: number;

  // Partenaires et adversaires
  best_partner_id: string | null;
  best_partner_pseudo: string | null;
  best_partner_matches: number;
  best_partner_victories: number;
  worst_partner_id: string | null;
  worst_partner_pseudo: string | null;
  worst_partner_matches: number;
  worst_partner_victories: number;
  best_opponent_id: string | null;
  best_opponent_pseudo: string | null;
  best_opponent_matches: number;
  best_opponent_victories: number;
  worst_opponent_id: string | null;
  worst_opponent_pseudo: string | null;
  worst_opponent_matches: number;
  worst_opponent_victories: number;
}
```

## Colonnes du tableau

### Colonnes du classement mensuel (Dashboard)
0. **Position** : Position du joueur renvoyé par la function (ordre)
1. **Pseudo** : Icônes pour les rôles (⚔️ Attaquant, 🛡️ Défenseur en fonction du nombre de victoire d'un poste ou d'un autre, si égalité ne rien affiché comme icone) + Nom du joueur
2. **Niveau** : Niveau actuel du joueur
3. **Rang** : Titre et description du rang
4. **Progression** : Expérience requise pour le niveau actuel et le niveau suivant
5. **EXP** : Points d'expérience actuels
6. **EXP Gagnée** : Expérience totale gagnée sur la période (`total_exp_gained`)
7. **Parties** : Nombre total de matchs joués (`total_matches`)
8. **Victoires** : Nombre de victoires avec ratio en % (`victories/total_matches`)
9. **Défaites** : Nombre de défaites (`defeats`)
10. **Buts** : Format "Marqués/Encaissés (Ratio%)" (`goals_for/goals_against`)
11. **Meilleur Partenaire** : Pseudo + ratio de victoires en % (`best_partner_pseudo`, `best_partner_victories/best_partner_matches`)
12. **Pire Partenaire** : Pseudo + ratio de victoires en % (`worst_partner_pseudo`, `worst_partner_victories/worst_partner_matches`)
13. **Paysans** : Meilleur adversaire + ratio de victoires (`best_opponent_pseudo`, `best_opponent_victories/best_opponent_matches`)
14. **Bête Noire** : Pire adversaire + ratio de victoires (`worst_opponent_pseudo`, `worst_opponent_victories/worst_opponent_matches`)
15. **Rôles** : Icônes avec statistiques en attaque et défense

### Format d'affichage des ratios
- Pourcentages arrondis à l'entier le plus proche
- Tooltip détaillé sur chaque statistique
- Code couleur pour les ratios (vert > 50%, rouge < 50%)

### 2. Filtrage
- Filtrage automatique par mois en cours

### 3. Affichage des détails
- Info-bulles (tooltips) sur chaque statistique
- Mise en évidence des meilleures performances

## Exemple d'utilisation dans le Dashboard
```tsx
// Dashboard.tsx
import { LeaderboardTable } from "@/components/LeaderboardTable";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Classement du mois</h2>
      <LeaderboardTable 
        period={currentMonth} // Format: "YYYY-MM"
        defaultSort="total_exp_gained"
      />
    </div>
  );
}
```

## Props
| Prop | Type | Description | Défaut |
|------|------|-------------|---------|
| period | string | Période de filtrage (YYYY-MM) | Mois en cours |
| defaultSort | keyof PlayerStats | Colonne de tri par défaut | 'total_exp_gained' |

## Performance
- Virtualisation pour les grandes listes
- Mise en cache des données avec SWR
- Optimisation des re-renders avec useMemo
- Debounce sur les tris

## Accessibilité
- Navigation au clavier dans le tableau
- Labels ARIA pour les colonnes triables
- Description des ratios pour les lecteurs d'écran
- Contraste suffisant pour les codes couleur

## Dépendances
- @supabase/supabase-js
- swr
- @radix-ui/react-tooltip
- lucide-react
- tailwindcss
- clsx

## Gestion des erreurs

### 1. Types d'erreurs
```typescript
import { PostgrestError } from "@supabase/supabase-js";

// Gestion typée des erreurs
try {
  // ... code ...
} catch (error: unknown) {
  if (error instanceof PostgrestError) {
    // Erreurs Supabase/Postgrest
  } else if (error instanceof Error) {
    // Erreurs JavaScript standard
  } else {
    // Erreurs inconnues
  }
}
```

### 2. Validation des entrées
```typescript
// Validation des dates
let formattedMonth: string | null = null;
if (month) {
  const date = new Date(month + "-01");
  if (isNaN(date.getTime())) {
    throw new Error("Format de date invalide");
  }
  formattedMonth = date.toISOString().split('T')[0];
}
```

### 3. Logging des erreurs
- **Erreurs Postgrest** : code, message, details, hint
- **Erreurs JavaScript** : message, name, stack
- **Erreurs inconnues** : log de l'objet complet

### 4. Gestion gracieuse des erreurs
```typescript
// Dans getPlayerStats
if (error) {
  console.error("Erreur RPC get_player_stats:", error);
  return []; // Retourne un tableau vide plutôt que de propager l'erreur
}

// Dans le composant
if (statsError) {
  return (
    <div className="text-red-500 p-4 rounded-lg bg-red-100">
      Une erreur est survenue lors du chargement des données.
    </div>
  );
}
```

## Bonnes pratiques

### 1. Format des dates
- Validation stricte du format YYYY-MM
- Conversion en ISO 8601 pour l'API
- Gestion des dates invalides

### 2. Gestion du cache
- Utilisation de SWR avec revalidation
- Intervalle de rafraîchissement de 30 secondes
- Revalidation au focus de la page

### 3. Traitement des erreurs
- Typage strict des erreurs
- Logging détaillé par type d'erreur
- Fallback vers un état vide
- Interface utilisateur non bloquante