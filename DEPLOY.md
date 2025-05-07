# Guide de Déploiement sur Vercel

## Prérequis

1. Un compte GitHub avec le projet
2. Un compte Vercel
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

### 2. Configuration de Vercel

Un fichier `vercel.json` est créé à la racine du projet :

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "",
    "SUPABASE_SERVICE_ROLE_KEY": ""
  }
}
```

### 3. Variables d'Environnement

Dans votre projet Supabase :
1. Allez dans "Project Settings" > "API"
2. Notez les valeurs suivantes :
   - Project URL (pour `NEXT_PUBLIC_SUPABASE_URL`)
   - anon/public key (pour `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - service_role key (pour `SUPABASE_SERVICE_ROLE_KEY`)

## Déploiement

### 1. Connexion GitHub-Vercel

1. Connectez-vous à [Vercel](https://vercel.com)
2. Cliquez sur "Add New Project"
3. Importez votre dépôt GitHub
4. Sélectionnez le framework "Next.js"

### 2. Configuration du Projet

1. Dans les paramètres du projet :
   - Build Command : `npm run build` (par défaut)
   - Output Directory : `.next` (par défaut)
   - Install Command : `npm install` (par défaut)

2. Configuration des variables d'environnement :
   - Allez dans "Settings" > "Environment Variables"
   - Ajoutez les variables suivantes :
     ```
     NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
     NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
     SUPABASE_SERVICE_ROLE_KEY=votre_clé_service
     ```

### 3. Déploiement

1. Cliquez sur "Deploy"
2. Attendez que le build se termine
3. Votre site sera automatiquement déployé sur un domaine `.vercel.app`

## Dépannage

Si vous rencontrez des erreurs :

1. **Erreur ESLint** :
   - Vérifiez que `eslint.ignoreDuringBuilds` est à `true` dans `next.config.js`
   - Vérifiez la configuration dans `.eslintrc.js`

2. **Erreur de Variables d'Environnement** :
   - Vérifiez que les variables sont correctement définies dans Vercel
   - Assurez-vous que les valeurs correspondent exactement à celles de Supabase
   - Vérifiez qu'il n'y a pas d'espaces supplémentaires

3. **Erreur de Build** :
   - Vérifiez les logs de build dans Vercel
   - Assurez-vous que toutes les dépendances sont installées
   - Vérifiez que la version de Node.js est correcte

## Maintenance

Pour mettre à jour le site :
1. Poussez vos changements sur GitHub
2. Vercel déploiera automatiquement les modifications
3. Surveillez les logs de build pour détecter d'éventuelles erreurs 