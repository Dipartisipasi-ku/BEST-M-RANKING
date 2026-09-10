const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  '<div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">',
  '<>'
);

// find the last </div> and replace with </>
let lastDivIndex = code.lastIndexOf("</div>");
if (lastDivIndex !== -1) {
  code = code.substring(0, lastDivIndex) + "</>" + code.substring(lastDivIndex + 6);
}

fs.writeFileSync('src/App.tsx', code);
