const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
appCode = appCode.replace(
  '<StatsCards\n              records={filteredRecords}\n              unitName={activeUnit ? activeUnit.nama : \'Seluruh Unit Rumah Sakit\'}\n            />',
  '<StatsCards\n              records={filteredRecords}\n              unitName={activeUnit ? activeUnit.nama : \'Seluruh Unit Rumah Sakit\'}\n              totalStaff={activeUnit ? currentStaffList.length : undefined}\n            />'
);
fs.writeFileSync('src/App.tsx', appCode);

