const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/import \{([\s\S]*?)loadRbacPermissions,([\s\S]*?)\} from '\.\/lib\/rbac_config';/, "import {$1loadRbacPermissions, getStoredRbacPermissions,$2} from './lib/rbac_config';");

code = code.replace(
  /const \[rbacPermissions, setRbacPermissions\] = useState<any>\(\(\) => loadRbacPermissions\(\)\);/,
  "const [rbacPermissions, setRbacPermissions] = useState<any>(() => getStoredRbacPermissions());\n\n  useEffect(() => {\n    loadRbacPermissions().then(perms => setRbacPermissions(perms));\n  }, []);"
);

fs.writeFileSync('src/App.tsx', code);
