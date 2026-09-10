const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "        canPrintReports={canPrintReports}",
  "        canPrintReports={canPrintReports}\n        viewMode={viewMode}\n        onChangeViewMode={setViewMode}"
);

fs.writeFileSync('src/App.tsx', code);
