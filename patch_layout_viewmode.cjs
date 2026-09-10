const fs = require('fs');

let code = fs.readFileSync('src/components/AppLayout.tsx', 'utf-8');

// Add to imports
code = code.replace("Stethoscope,", "Stethoscope,\n  LayoutGrid,\n  Table,\n  CheckCircle,");

// Add props
code = code.replace(
  "interface AppLayoutProps {",
  "interface AppLayoutProps {\n  viewMode?: 'quick_direct' | 'cards' | 'table';\n  onChangeViewMode?: (mode: 'quick_direct' | 'cards' | 'table') => void;"
);

code = code.replace(
  "canPrintReports = true,",
  "canPrintReports = true,\n  viewMode,\n  onChangeViewMode,"
);

// Add switcher to header
const headerPattern = `<header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-2xs z-20">`;
const newHeader = `<header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                 <h2 className="text-sm font-extrabold text-slate-800">Evaluasi Pelayanan</h2>
                 <p className="text-[10px] text-slate-500">Sistem Informasi Manajemen RS</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onChangeViewMode && viewMode && (
              <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => onChangeViewMode('quick_direct')}
                  className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 \${
                    viewMode === 'quick_direct'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }\`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Input Cepat</span>
                </button>
                <button
                  onClick={() => onChangeViewMode('cards')}
                  className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 \${
                    viewMode === 'cards' || viewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }\`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Lihat Rekap</span>
                </button>
              </div>
            )}
            <div className="hidden sm:block text-right border-l border-slate-200 pl-4 ml-1">
              <span className="block text-xs font-bold text-slate-800">{session.userName}</span>
              <span className="block text-[10px] text-slate-500">{roleInfo.title}</span>
            </div>
          </div>
        </header>`;

const startIdx = code.indexOf(headerPattern);
const endIdx = code.indexOf("</header>", startIdx) + "</header>".length;

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + newHeader + code.substring(endIdx);
}

fs.writeFileSync('src/components/AppLayout.tsx', code);
