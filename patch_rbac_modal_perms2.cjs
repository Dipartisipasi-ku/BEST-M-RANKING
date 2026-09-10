const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseRbacModal.tsx', 'utf-8');

code = code.replace(/perm\.key/g, "(key as RbacPermissionKey)");

fs.writeFileSync('src/components/SupabaseRbacModal.tsx', code);
