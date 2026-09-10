const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes("import { loadRbacPermissions }")) {
  code = code.replace(
    "import { loadRbacPermissions, saveRbacPermissions, hasRolePermission, RolePermissions } from './lib/rbac_config';",
    "import { loadRbacPermissions, saveRbacPermissions, hasRolePermission, RolePermissions } from './lib/rbac_config';\nimport { loadEvalElementsConfig } from './utils/evalElements';"
  );
}

if (!code.includes("loadEvalElementsConfig()")) {
  code = code.replace(
    "const loadData = async () => {",
    `const loadData = async () => {\n      await loadRbacPermissions();\n      await loadEvalElementsConfig();`
  );
}

fs.writeFileSync('src/App.tsx', code);
