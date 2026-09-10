const fs = require('fs');
let code = fs.readFileSync('src/components/QuickDirectTable.tsx', 'utf-8');

code = code.replace(
  /const \[confirmState, setConfirmState\] = useState\(\{[\s\S]*?idToDelete: '',\s*\}\);\n/g,
  ""
);

code = code.replace(
  /      \{\/\* Confirm Delete Modal \*\/\}\n      <ConfirmModal[\s\S]*?\/>\n/g,
  ""
);

code = code.replace(
  /import \{ ConfirmModal \} from '\.\/ConfirmModal';\n/g,
  ""
);

fs.writeFileSync('src/components/QuickDirectTable.tsx', code);
