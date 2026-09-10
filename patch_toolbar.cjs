const fs = require('fs');
let code = fs.readFileSync('src/components/AdaptiveToolbar.tsx', 'utf-8');

if (!code.includes('onOpenMasterUnits?: () => void;')) {
  code = code.replace(
    'onOpenSupabase?: () => void;',
    'onOpenSupabase?: () => void;\n  onOpenMasterUnits?: () => void;'
  );
}

if (!code.includes('onOpenMasterUnits,')) {
  code = code.replace(
    'onOpenSupabase,',
    'onOpenSupabase,\n  onOpenMasterUnits,'
  );
}

if (!code.includes('Kelola Master Ruangan')) {
  code = code.replace(
    /<button\s+onClick=\{onResetData\}[\s\S]*?Reset Data Evaluasi\s*<\/span>\s*<\/button>/,
    `<button
                onClick={onResetData}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Data Evaluasi</span>
              </button>
              
              <div className="my-1 border-t border-slate-100"></div>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (onOpenMasterUnits) onOpenMasterUnits();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Kelola Master Ruangan</span>
              </button>`
  );
}

fs.writeFileSync('src/components/AdaptiveToolbar.tsx', code);
