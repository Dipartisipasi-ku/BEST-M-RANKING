const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/hasRolePermission\([^,]+, 'manageRbac'[^)]*\)/g, "hasRolePermission(isSuperAdmin ? 'super_admin' : activeRole, 'canManageUsers')");
code = code.replace(/hasRolePermission\([^,]+, 'inputOwnUnit'[^)]*\)/g, "hasRolePermission(activeRole, 'canSubmitEvals')");
code = code.replace(/hasRolePermission\([^,]+, 'inputAllUnits'[^)]*\)/g, "hasRolePermission(activeRole, 'canSubmitEvals')");
code = code.replace(/hasRolePermission\([^,]+, 'manageUnits'[^)]*\)/g, "hasRolePermission(activeRole, 'canManageUnits')");
code = code.replace(/hasRolePermission\([^,]+, 'editAllUnits'[^)]*\)/g, "hasRolePermission(activeRole, 'canEditAnyEval')");
code = code.replace(/hasRolePermission\([^,]+, 'editOwnUnit'[^)]*\)/g, "hasRolePermission(activeRole, 'canEditAnyEval')");
code = code.replace(/hasRolePermission\([^,]+, 'deleteRecord'[^)]*\)/g, "hasRolePermission(activeRole, 'canDeleteAnyEval')");
code = code.replace(/hasRolePermission\([^,]+, 'exportCSV'[^)]*\)/g, "hasRolePermission(activeRole, 'canExportData')");
code = code.replace(/hasRolePermission\([^,]+, 'printReports'[^)]*\)/g, "hasRolePermission(activeRole, 'canExportData')");

fs.writeFileSync('src/App.tsx', code);
