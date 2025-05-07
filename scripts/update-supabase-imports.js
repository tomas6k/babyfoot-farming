const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/lib/queries/stats.ts',
  'src/lib/getPlayerStats.ts',
  'src/lib/updatePlayerStats.ts',
  'src/lib/hooks/usePlayersLevel.ts',
  'src/components/UpdateProfileForm.tsx',
  'src/app/api/base-stats/route.ts',
  'src/app/dashboard/page.tsx',
  'src/app/match/history/page.tsx',
  'src/app/api/stats/route.ts',
  'src/app/match/new/NewMatchForm.tsx',
  'netlify/functions/levels.ts'
];

const updateFile = (filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remplacer les imports
  content = content.replace(
    /import\s*{\s*createClient\s*}\s*from\s*['"]@supabase\/supabase-js['"];?/g,
    `import { getSupabaseClient } from '@/lib/supabaseClient';`
  );

  // Remplacer la création du client
  content = content.replace(
    /const\s+supabase\s*=\s*createClient\([^)]*\);?/g,
    'const supabase = getSupabaseClient();'
  );

  // Supprimer les déclarations de variables d'environnement
  content = content.replace(
    /const\s+supabaseUrl\s*=\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL[^;]*;/g,
    ''
  );
  content = content.replace(
    /const\s+supabaseAnonKey\s*=\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY[^;]*;/g,
    ''
  );

  // Supprimer les vérifications de variables d'environnement
  content = content.replace(
    /if\s*\(\s*!supabaseUrl\s*\)[^}]*}/g,
    ''
  );
  content = content.replace(
    /if\s*\(\s*!supabaseAnonKey\s*\)[^}]*}/g,
    ''
  );

  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${filePath}`);
};

filesToUpdate.forEach(updateFile);
console.log('All files updated successfully'); 