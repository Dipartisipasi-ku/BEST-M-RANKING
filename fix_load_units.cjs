const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /if \(Array\.isArray\(parsed\) && parsed\.length > 0\) return parsed;/g,
  `if (Array.isArray(parsed)) return parsed;`
);

code = code.replace(
  /const saved = tryParse\(localStorage\.getItem\(STORAGE_UNITS_KEY\)\);\n  if \(saved\) return saved;\n  return INITIAL_UNITS;/g,
  `const saved = tryParse(localStorage.getItem(STORAGE_UNITS_KEY));
  if (saved !== null) return saved;
  return INITIAL_UNITS;`
);

fs.writeFileSync('src/App.tsx', code);
