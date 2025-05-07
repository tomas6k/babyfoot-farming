# Composant NewMatchForm

## Objectif
Fournir une interface utilisateur pour la saisie et la soumission d'un nouveau match de babyfoot, avec validation des données et gestion des erreurs.

## Structure des données

### État local
```typescript
interface SelectedPlayers {
  whiteAttacker: string | null;
  whiteDefender: string | null;
  blackAttacker: string | null;
  blackDefender: string | null;
}

interface Scores {
  white: number;
  black: number;
}

// Nouvel état pour l'utilisateur connecté
interface User {
  id: string;
  email: string;
  // ... autres propriétés de l'utilisateur
}
```

## Fonctionnalités

### 1. Sélection des joueurs
- Quatre sélecteurs de joueurs (un par position)
- Validation pour empêcher la sélection du même joueur plusieurs fois
- Liste déroulante avec tous les joueurs disponibles
- Affichage du pseudo de chaque joueur

### 2. Saisie des scores
- Deux champs numériques pour les scores (équipe blanche et noire)
- Validation des scores :
  - Valeurs entre 0 et 10
  - Un score doit être exactement 10 (équipe gagnante)
  - Pas de match nul possible

### 3. Soumission du match
- Bouton de soumission
- Désactivé tant que tous les champs ne sont pas valides
- Affichage d'un état de chargement pendant le traitement
- Gestion des erreurs avec messages appropriés

## Validation des données

### Règles de validation
1. Tous les joueurs doivent être sélectionnés
2. Chaque joueur doit être unique
3. Les scores doivent être valides :
   - Entre 0 et 10
   - Un score exactement égal à 10
   - Pas d'égalité possible

### Messages d'erreur
- "Veuillez sélectionner tous les joueurs"
- "Un joueur ne peut pas être sélectionné plusieurs fois"
- "Le score doit être compris entre 0 et 10"
- "Une équipe doit avoir un score de 10 pour gagner"
- "Les scores ne peuvent pas être égaux"

## Authentification et Sécurité

### 1. Gestion de l'utilisateur connecté
- Utilise `supabase.auth.getUser()` pour récupérer l'utilisateur au chargement
- Stocke l'utilisateur dans un état local avec `useState`
- Vérifie la présence de l'utilisateur avant la soumission
- Ajoute l'ID de l'utilisateur dans le champ `added_by` lors de la soumission

### 2. Sécurité
- Vérifie que l'utilisateur est connecté avant toute soumission
- Respecte les politiques RLS de la table `matches`
- Affiche des messages d'erreur appropriés si l'utilisateur n'est pas connecté

### 3. Messages d'erreur liés à l'authentification
- "Vous devez être connecté pour soumettre un match"
- "Erreur d'autorisation lors de la soumission du match"

## Intégration avec la base de données

### 1. Récupération des joueurs
- Utilise Supabase pour charger la liste des joueurs
- Met en cache les données pour optimiser les performances
- Gère les erreurs de chargement

### 2. Soumission du match
- Appelle la fonction `processMatch` avec les paramètres :
  ```typescript
  {
    white_attacker: string;
    white_defender: string;
    black_attacker: string;
    black_defender: string;
    score_white: number;
    score_black: number;
    added_by: string; // ID de l'utilisateur connecté
  }
  ```
- Vérifie la présence de l'utilisateur connecté
- Gère les erreurs de soumission et d'autorisation
- Affiche les résultats du traitement

## Interface utilisateur

### Composants
1. Select pour chaque joueur
2. Inputs numériques pour les scores
3. Bouton de soumission
4. Messages d'erreur/succès
5. Indicateur de chargement

### États visuels
- Normal : Formulaire interactif
- Chargement : Pendant la soumission
- Erreur : Affichage des messages d'erreur
- Succès : Réinitialisation et message de confirmation

## Exemple d'utilisation avec authentification
```tsx
// Exemple de soumission avec utilisateur connecté
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!user) {
    toast.error("Vous devez être connecté pour soumettre un match");
    return;
  }

  try {
    await processMatch({
      white_attacker: selectedPlayers.whiteAttacker,
      white_defender: selectedPlayers.whiteDefender,
      black_attacker: selectedPlayers.blackAttacker,
      black_defender: selectedPlayers.blackDefender,
      score_white: scores.white,
      score_black: scores.black,
      added_by: user.id // ID de l'utilisateur connecté
    });
    
    router.push("/dashboard");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Erreur lors de la soumission du match");
  }
};
```

## Gestion des erreurs
1. Erreurs de validation du formulaire
2. Erreurs de connexion à la base de données
3. Erreurs de traitement du match
4. Erreurs d'autorisation
   - Utilisateur non connecté
   - Permissions insuffisantes
   - Violation des politiques RLS

## Réinitialisation
- Après une soumission réussie
- Sur demande de l'utilisateur
- En cas d'erreur critique

## Dépendances
- Supabase Client
- React Hook Form
- Toast UI (pour les notifications)
- Composants UI personnalisés 