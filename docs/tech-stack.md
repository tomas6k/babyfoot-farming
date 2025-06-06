# Stack Technique Vancelian Babyfoot Kingdom

## Technologies Principales

### Frontend
- **Next.js 15.3.1** - Framework React avec rendu côté serveur
- **React 19.1.0** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Radix UI** - Composants accessibles et sans style
- **shadcn/ui** - Composants UI basés sur Radix et Tailwind

### Backend
- **Supabase** - Backend as a Service
  - Base de données PostgreSQL
  - Authentication
  - Edge Functions
  - Real-time subscriptions

## Dépendances Principales

### Production Dependencies
```json
{
  "@hookform/resolvers": "^5.0.1",
  "@radix-ui/react-dropdown-menu": "^2.1.12",
  "@radix-ui/react-label": "^2.1.4",
  "@radix-ui/react-progress": "^1.1.4",
  "@radix-ui/react-select": "^2.2.2",
  "@radix-ui/react-slot": "^1.2.0",
  "@radix-ui/react-tabs": "^1.1.9",
  "@radix-ui/react-toast": "^1.2.11",
  "@radix-ui/react-tooltip": "^1.2.4",
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/auth-ui-react": "^0.4.7",
  "@supabase/auth-ui-shared": "^0.1.8",
  "@supabase/ssr": "^0.6.1",
  "@supabase/supabase-js": "^2.49.4",
  "@tanstack/react-virtual": "^3.13.6",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "lodash": "4.17.21",
  "lucide-react": "^0.503.0",
  "next": "^15.3.1",
  "next-themes": "^0.4.6",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-hook-form": "^7.56.1",
  "sonner": "^2.0.3",
  "swr": "^2.3.3",
  "tailwind-merge": "^3.2.0",
  "tailwindcss-animate": "^1.0.7",
  "zod": "^3.24.3"
}
```

### Development Dependencies
```json
{
  "@tailwindcss/forms": "^0.5.10",
  "@types/node": "^22.15.3",
  "@types/react": "^19.1.2",
  "@types/react-dom": "^19.1.2",
  "@typescript-eslint/eslint-plugin": "^7.1.0",
  "@typescript-eslint/parser": "^7.1.0",
  "autoprefixer": "^10.4.14",
  "eslint": "^8.57.0",
  "eslint-config-next": "^14.1.0",
  "eslint-plugin-react-hooks": "^5.2.0",
  "postcss": "^8.4.31",
  "tailwindcss": "^3.3.0",
  "typescript": "^5.8.3"
}
```

## Fonctionnalités Principales

### UI/UX
- Thème sombre/clair avec `next-themes`
- Composants UI accessibles avec Radix UI
- Animations fluides avec `tailwindcss-animate`
- Notifications avec `sonner`
- Formulaires avec `react-hook-form` et validation `zod`
- Virtualisation des listes avec `@tanstack/react-virtual`
- Icônes avec `lucide-react`

### État et Data Fetching
- Gestion de cache et requêtes avec `swr`
- Authentification Supabase
- Real-time updates
- Utilitaires de date avec `date-fns`
- Manipulation de données avec `lodash`

### Style et Thème
- Tailwind CSS pour le styling
- Variables CSS personnalisées pour le thème
- Utilitaires de classe avec `clsx` et `tailwind-merge`
- Police pixel art "Press Start 2P"
- Mode sombre intégré
- Composants personnalisés avec style pixel art

### Configuration
- TypeScript strict
- ESLint avec règles personnalisées
- PostCSS avec Tailwind et Autoprefixer
- Alias de chemins avec `@/*`

### Structure du Projet
```
src/
  ├── app/          # Pages et composants Next.js
  ├── components/   # Composants React réutilisables
  │   ├── ui/      # Composants UI de base
  │   └── ...      # Composants spécifiques
  ├── hooks/        # Hooks React personnalisés
  ├── lib/          # Utilitaires et configurations
  │   ├── queries/ # Requêtes Supabase
  │   └── utils/   # Fonctions utilitaires
  ├── types/        # Types TypeScript
  └── styles/       # Styles globaux
docs/              # Documentation
public/            # Assets statiques
``` 