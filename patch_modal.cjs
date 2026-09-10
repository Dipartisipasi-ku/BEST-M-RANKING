const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluationFormModal.tsx', 'utf-8');

// Add isRestrictedRole to props
code = code.replace(
  'initialUnitId: string;',
  'initialUnitId: string;\n  isRestrictedRole?: boolean;'
);

code = code.replace(
  'editRecord,',
  'editRecord,\n  isRestrictedRole = false,'
);

// Lock the select
code = code.replace(
  'disabled={safeUnits.length <= 1}',
  'disabled={isRestrictedRole || safeUnits.length <= 1}'
);
code = code.replace(
  'className="w-full text-xs font-medium px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"',
  'className={`w-full text-xs font-medium px-3 py-2 bg-white rounded-lg border ${isRestrictedRole || safeUnits.length <= 1 ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500"} focus:outline-none`}'
);

fs.writeFileSync('src/components/EvaluationFormModal.tsx', code);
