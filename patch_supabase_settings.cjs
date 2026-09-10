const fs = require('fs');

let code = fs.readFileSync('src/lib/supabase_settings.ts', 'utf-8');

code = code.replace(
  /console\.error\(`Failed to load setting \$\{key\} from Supabase:`, error\);/g,
  "if (error?.code !== 'PGRST205' && error?.code !== '42P01') console.error(`Failed to load setting ${key} from Supabase:`, error);"
);

code = code.replace(
  /console\.error\(`Failed to save setting \$\{key\} to Supabase:`, error\);/g,
  "if (error?.code !== 'PGRST205' && error?.code !== '42P01') console.error(`Failed to save setting ${key} to Supabase:`, error);"
);

fs.writeFileSync('src/lib/supabase_settings.ts', code);
