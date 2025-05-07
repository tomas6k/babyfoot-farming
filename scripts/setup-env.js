const fs = require('fs');
const path = require('path');

// Créer le contenu du fichier .env.production
const envContent = `NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

// Écrire le fichier .env.production
fs.writeFileSync(path.join(process.cwd(), '.env.production'), envContent);

console.log('Variables d\'environnement configurées avec succès'); 