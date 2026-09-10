const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

code = code.replace(
  'disabled={isLoading}',
  'disabled={isLoading || (isRegistering && role === \'staf_pegawai\' && !fullName)}'
);

fs.writeFileSync('src/components/LoginPage.tsx', code);
