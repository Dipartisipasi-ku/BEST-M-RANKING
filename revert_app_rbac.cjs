const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const \[rbacPermissionsTick, setRbacPermissionsTick\] = useState\(0\);/g,
  "const [rbacPermissions, setRbacPermissions] = useState<any>(() => loadRbacPermissions());"
);

code = code.replace(
  /const handleUpdateRbacPermissions = async \(newPerms: any\) => \{\n    await saveRbacPermissions\(newPerms\);\n    setRbacPermissionsTick\(prev => prev \+ 1\);\n  \};/g,
  "const handleUpdateRbacPermissions = (newPerms: any) => {\n    setRbacPermissions(newPerms);\n    saveRbacPermissions(newPerms);\n  };"
);

fs.writeFileSync('src/App.tsx', code);
