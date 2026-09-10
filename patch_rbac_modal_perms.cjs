const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseRbacModal.tsx', 'utf-8');

code = code.replace(
  /PERMISSION_DEFINITIONS\.map\(\(perm\) => \{/g,
  "Object.entries(PERMISSION_DEFINITIONS).map(([key, perm]) => {"
);

code = code.replace(
  /const isManageRbacRow = perm\.key === 'manageRbac';/g,
  "const isManageRbacRow = key === 'canManageUsers';"
);

code = code.replace(
  /perm\.key === 'manageRbac'/g,
  "key === 'canManageUsers'"
);

code = code.replace(
  /key=\{perm\.key\}/g,
  "key={key}"
);

code = code.replace(
  /checked=\{localPerms\['super_admin'\]\[perm\.key\]\}/g,
  "checked={localPerms['super_admin'][key as RbacPermissionKey]}"
);

code = code.replace(
  /onChange=\{\(e\) => handleTogglePermission\('super_admin', perm\.key\)\}/g,
  "onChange={(e) => handleTogglePermission('super_admin', key as RbacPermissionKey)}"
);

code = code.replace(
  /checked=\{localPerms\['komite_mutu'\]\[perm\.key\]\}/g,
  "checked={localPerms['komite_mutu'][key as RbacPermissionKey]}"
);

code = code.replace(
  /onChange=\{\(e\) => handleTogglePermission\('komite_mutu', perm\.key\)\}/g,
  "onChange={(e) => handleTogglePermission('komite_mutu', key as RbacPermissionKey)}"
);

code = code.replace(
  /checked=\{localPerms\['kepala_ruangan'\]\[perm\.key\]\}/g,
  "checked={localPerms['kepala_ruangan'][key as RbacPermissionKey]}"
);

code = code.replace(
  /onChange=\{\(e\) => handleTogglePermission\('kepala_ruangan', perm\.key\)\}/g,
  "onChange={(e) => handleTogglePermission('kepala_ruangan', key as RbacPermissionKey)}"
);

code = code.replace(
  /checked=\{localPerms\['staf_pegawai'\]\[perm\.key\]\}/g,
  "checked={localPerms['staf_pegawai'][key as RbacPermissionKey]}"
);

code = code.replace(
  /onChange=\{\(e\) => handleTogglePermission\('staf_pegawai', perm\.key\)\}/g,
  "onChange={(e) => handleTogglePermission('staf_pegawai', key as RbacPermissionKey)}"
);

code = code.replace(
  /if \(role === 'super_admin' && permKey === 'manageRbac'\) return;/g,
  "if (role === 'super_admin' && permKey === 'canManageUsers') return;"
);


fs.writeFileSync('src/components/SupabaseRbacModal.tsx', code);
