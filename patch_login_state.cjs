const fs = require('fs');

let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

code = code.replace(
  'const [unitId, setUnitId] = useState<string>(\'\');',
  'const [unitId, setUnitId] = useState<string>(\'\');\n  const [staffList, setStaffList] = useState<any[]>([]);'
);

fs.writeFileSync('src/components/LoginPage.tsx', code);
