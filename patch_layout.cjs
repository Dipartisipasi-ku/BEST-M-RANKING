const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'viewMode={viewMode}\n        onChangeViewMode={setViewMode}',
  'viewMode={viewMode}\n        onChangeViewMode={activeRole !== \'staf_pegawai\' ? setViewMode : undefined}'
);

fs.writeFileSync('src/App.tsx', code);
