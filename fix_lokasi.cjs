const fs = require('fs');

let addUnit = fs.readFileSync('src/components/AddUnitModal.tsx', 'utf-8');
addUnit = addUnit.replace(/const \[lokasi, setLokasi\] = useState\(''\);\n/, '');
addUnit = addUnit.replace(/setLokasi\(unitToEdit\.lokasi \|\| ''\);\n/, '');
addUnit = addUnit.replace(/setLokasi\(''\);\n/g, '');
addUnit = addUnit.replace(/lokasi: lokasi\.trim\(\) \|\| undefined,\n/g, '');
addUnit = addUnit.replace(/<div>\s*<label className="block text-xs font-semibold text-slate-700 mb-1">\s*Gedung \/ Lokasi Lantai\s*<\/label>\s*<input\s*id="input-unit-lokasi"[\s\S]*?className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"\s*\/>\s*<\/div>/, '');
fs.writeFileSync('src/components/AddUnitModal.tsx', addUnit);

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
appTsx = appTsx.replace(/\{activeUnit\?\.lokasi && <span className="text-blue-200"> &bull; \{activeUnit\.lokasi\}<\/span>\}\n/, '');
fs.writeFileSync('src/App.tsx', appTsx);
