const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase_config.ts', 'utf-8');

code = code.replace(
  /console\.error\(/g,
  "if (error?.code !== 'PGRST205' && error?.code !== '42P01') console.error("
);

fs.writeFileSync('src/lib/supabase_config.ts', code);
