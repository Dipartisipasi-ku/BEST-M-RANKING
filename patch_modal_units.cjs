const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'units={units}\n        initialUnitId={selectedUnitId !== \'all\' ? selectedUnitId : (units && units[0]?.id) || \'igd\'}',
  'units={isKepalaRuangan ? (activeUnit ? [activeUnit] : units) : units}\n        initialUnitId={selectedUnitId !== \'all\' ? selectedUnitId : (units && units[0]?.id) || \'igd\'}'
);

fs.writeFileSync('src/App.tsx', code);
