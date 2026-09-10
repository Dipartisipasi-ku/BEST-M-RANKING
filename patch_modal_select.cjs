const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluationFormModal.tsx', 'utf-8');

code = code.replace(
  'onChange={(e) => setUnitId(e.target.value)}',
  'onChange={(e) => setUnitId(e.target.value)}\n                  disabled={safeUnits.length <= 1}'
);

fs.writeFileSync('src/components/EvaluationFormModal.tsx', code);
