const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseRbacModal.tsx', 'utf-8');

code = code.replace(/perm\.label/g, "perm.title");
code = code.replace(/\{perm\.category\}/g, "Hak Akses");

fs.writeFileSync('src/components/SupabaseRbacModal.tsx', code);
