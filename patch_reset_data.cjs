const fs = require('fs');

let code = fs.readFileSync('src/components/AppLayout.tsx', 'utf-8');

const oldBtn = `<button
             onClick={() => { closeSidebar(); onResetData(); }}
             className="w-full text-left px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl flex items-center gap-2.5 transition-colors"
           >
             <RotateCcw className="w-4 h-4 text-rose-500" />
             <span>Reset Data (0 Dummy)</span>
           </button>`;

const newBtn = `{session.role === 'super_admin' && (
           <button
             onClick={() => { closeSidebar(); onResetData(); }}
             className="w-full text-left px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl flex items-center gap-2.5 transition-colors"
           >
             <RotateCcw className="w-4 h-4 text-rose-500" />
             <span>Reset Data (0 Dummy)</span>
           </button>
           )}`;

code = code.replace(oldBtn, newBtn);
fs.writeFileSync('src/components/AppLayout.tsx', code);
