const fs = require('fs');
let code = fs.readFileSync('src/components/QuickDirectTable.tsx', 'utf-8');

if (!code.includes("import { ConfirmModal } from './ConfirmModal';")) {
  code = code.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { ConfirmModal } from './ConfirmModal';"
  );
  fs.writeFileSync('src/components/QuickDirectTable.tsx', code);
}
