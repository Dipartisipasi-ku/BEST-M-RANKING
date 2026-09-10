const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseRbacModal.tsx', 'utf-8');

code = code.replace(
  /nama: newUserName\.trim\(\),/g,
  "fullName: newUserName.trim(),\n      username: newUserName.trim().toLowerCase().replace(/\\s+/g, ''),"
);

code = code.replace(
  /unitNama: newUserUnit\.trim\(\) \|\| 'Unit RS',/g,
  "unitId: newUserUnit.trim() || 'igd',"
);

code = code.replace(
  /\{user\.nama\}/g,
  "{user.fullName}"
);

fs.writeFileSync('src/components/SupabaseRbacModal.tsx', code);
