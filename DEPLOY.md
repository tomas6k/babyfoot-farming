# Guide de Déploiement sur Netlify

## Prérequis

1. Un compte GitHub avec le projet
2. Un compte Netlify
3. Un projet Supabase configuré

## Configuration du Projet

### 1. Configuration de Next.js

Vérifiez que votre fichier `next.config.js` contient :

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['xkvxpwsyvdvjrxnwtban.supabase.co'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
```

### 2. Configuration de Netlify

Créez un fichier `netlify.toml` à la racine du projet :

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  external_node_modules = ["@supabase/supabase-js"]

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Variables d'Environnement

Dans votre projet Supabase :
1. Allez dans "Project Settings" > "API"
2. Notez les valeurs suivantes :
   - Project URL (pour `NEXT_PUBLIC_SUPABASE_URL`)
   - anon/public key (pour `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - service_role key (pour `SUPABASE_SERVICE_ROLE_KEY`)

## Déploiement

### 1. Connexion GitHub-Netlify

1. Connectez-vous à Netlify
2. Cliquez sur "Add new site" > "Import an existing project"
3. Choisissez GitHub comme fournisseur
4. Sélectionnez votre dépôt

### 2. Configuration du Site

1. Dans les paramètres du site Netlify :
   - Build command : `npm run build`
   - Publish directory : `.next`

2. Configuration des variables d'environnement :
   - Allez dans "Site settings" > "Environment variables"
   - Ajoutez les variables suivantes :
     ```
     NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
     NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
     SUPABASE_SERVICE_ROLE_KEY=votre_clé_service
     ```

### 3. Déploiement

1. Allez dans l'onglet "Deploys"
2. Cliquez sur "Clear cache and deploy site"
3. Attendez que le build se termine

## Dépannage

Si vous rencontrez des erreurs :

1. **Erreur ESLint** :
   - Vérifiez que `eslint.ignoreDuringBuilds` est à `true` dans `next.config.js`
   - Vérifiez la configuration dans `.eslintrc.js`

2. **Erreur de Variables d'Environnement** :
   - Vérifiez que les variables sont correctement définies dans Netlify
   - Assurez-vous que les valeurs correspondent exactement à celles de Supabase
   - Vérifiez qu'il n'y a pas d'espaces supplémentaires

3. **Erreur de Build** :
   - Vérifiez les logs de build dans Netlify
   - Assurez-vous que toutes les dépendances sont installées
   - Vérifiez que la version de Node.js est correcte

## Maintenance

Pour mettre à jour le site :
1. Poussez vos changements sur GitHub
2. Netlify déploiera automatiquement les modifications
3. Surveillez les logs de build pour détecter d'éventuelles erreurs 