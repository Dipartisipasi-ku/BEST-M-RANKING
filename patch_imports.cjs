const fs = require('fs');

function addImport(file) {
  let code = fs.readFileSync(file, 'utf-8');
  if (!code.includes("import { ConfirmModal } from './ConfirmModal';")) {
    code = code.replace(
      "import { useState",
      "import { ConfirmModal } from './ConfirmModal';\nimport { useState"
    );
    fs.writeFileSync(file, code);
  }
}

addImport('src/components/EvaluationTable.tsx');
addImport('src/components/QuickDirectTable.tsx');

