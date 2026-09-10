const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  `if (session.role === 'kepala_ruangan') {
        setSelectedUnitId(session.unitId);
        setViewMode('quick_direct');
      }`,
  `if (session.role === 'kepala_ruangan') {
        setSelectedUnitId(session.unitId);
        setViewMode('quick_direct');
      } else if (session.role === 'staf_pegawai') {
        setSelectedUnitId(session.unitId);
        setViewMode('table');
      }`
);

fs.writeFileSync('src/App.tsx', code);
