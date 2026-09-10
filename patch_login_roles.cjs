const fs = require('fs');

// 1. Patch LoginPage.tsx (already done partially but ensuring it's robust)
let loginCode = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

loginCode = loginCode.replace(
  /<option value="komite_mutu">Komite Mutu<\/option>\n\s*<option value="super_admin">Super Admin \(Manajemen IT\)<\/option>/g,
  ""
);

fs.writeFileSync('src/components/LoginPage.tsx', loginCode);

// 2. Patch index.html
let htmlCode = fs.readFileSync('index.html', 'utf-8');

htmlCode = htmlCode.replace(
  /<meta name="viewport" content="width=device-width, initial-scale=1.0" \/>/g,
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />'
);

fs.writeFileSync('index.html', htmlCode);

