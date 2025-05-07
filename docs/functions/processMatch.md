# Fonction processMatch (Front-end)

## Objectif
Traiter la soumission d'un nouveau match côté front-end en appelant la fonction PostgreSQL `process_match` et en gérant l'affichage des résultats.

## Paramètres d'entrée
```typescript
interface Match {
  whiteAttacker: string;    // UUID de l'attaquant blanc
  whiteDefender: string;    // UUID du défenseur blanc
  blackAttacker: string;    // UUID de l'attaquant noir
  blackDefender: string;    // UUID du défenseur noir
  scoreWhite: number;       // Score de l'équipe blanche
  scoreBlack: number;       // Score de l'équipe noire
  addedBy?: string;        // UUID de l'utilisateur qui soumet le match (optionnel)
}
```

## Étapes de traitement

### 1. Validation des données
- Vérifie que tous les joueurs sont différents
- Vérifie que les scores sont valides (entre 0 et 10)
- Vérifie qu'il y a un gagnant (score de 10)
- Vérifie qu'il n'y a pas de match nul

### 2. Appel à la base de données
- Appelle la fonction PostgreSQL `process_match` via Supabase RPC
- Transmet tous les paramètres nécessaires dans le bon ordre

### 3. Gestion des résultats
- Traite la réponse de la base de données
- Affiche les messages de succès avec les gains d'expérience
- Gère les erreurs potentielles

## Valeur de retour
```typescript
Promise<{
  id: string;           // UUID du joueur
  pseudo: string;       // Nom du joueur
  exp_before: number;   // Expérience avant le match
  exp_after: number;    // Expérience après le match
  hp_before: number;    // Points de vie avant le match
  hp_after: number;     // Points de vie après le match
  mana_before: number;  // Mana avant le match
  mana_after: number;   // Mana après le match
}[]>
```

## Messages d'interface utilisateur
- "Match enregistré avec succès !" - Affiché après un traitement réussi
- Messages d'erreur personnalisés en cas de problème
- Notifications de gain d'expérience pour chaque joueur

## Gestion des erreurs
1. Validation des données invalides
2. Erreurs de connexion à la base de données
3. Erreurs de traitement côté serveur
4. Erreurs d'autorisation (RLS)

## Exemple d'utilisation
```typescript
const match = {
  whiteAttacker: "uuid-attaquant-blanc",
  whiteDefender: "uuid-defenseur-blanc",
  blackAttacker: "uuid-attaquant-noir",
  blackDefender: "uuid-defenseur-noir",
  scoreWhite: 10,
  scoreBlack: 8,
  addedBy: "uuid-utilisateur-connecte"
};

try {
  const result = await processMatch(match);
  // Traitement des résultats...
} catch (error) {
  // Gestion des erreurs...
}
```

## Intégration avec l'interface utilisateur
- Utilisé dans le composant `NewMatchForm`
- Gère l'état de chargement pendant le traitement
- Met à jour l'interface utilisateur avec les résultats
- Réinitialise le formulaire après un succès 