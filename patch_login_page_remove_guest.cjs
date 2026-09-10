const fs = require('fs');

let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

// Remove onExplorePublic from props
code = code.replace(/onExplorePublic\?:\s*\(\)\s*=>\s*void;/g, "");
code = code.replace(/onExplorePublic/g, "");

fs.writeFileSync('src/components/LoginPage.tsx', code);
