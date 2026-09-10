const fs = require('fs');

let code = fs.readFileSync('src/lib/rbac_config.ts', 'utf-8');

// add getStoredRbacPermissions
const syncGetter = `
export const getStoredRbacPermissions = (): RbacMatrix => {
  if (cachedRbac) return cachedRbac;
  const local = localStorage.getItem('hospital_rbac_matrix');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {}
  }
  return DEFAULT_RBAC;
};
`;

code = code + syncGetter;

fs.writeFileSync('src/lib/rbac_config.ts', code);
