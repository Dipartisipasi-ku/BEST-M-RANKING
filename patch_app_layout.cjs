const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace AdaptiveToolbar import with AppLayout
code = code.replace(
  "import { AdaptiveToolbar } from './components/AdaptiveToolbar';",
  "import { AppLayout } from './components/AppLayout';"
);

// We need to replace the wrapper around AdaptiveToolbar and main.
// <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
// ... Toast Notification ...
// <AdaptiveToolbar ... />
// <main ...> ... </main>
// </div>

const startMarker = "<AdaptiveToolbar";
const endMarker = "      </main>\n    </div>";

let startIndex = code.indexOf(startMarker);
let endIndex = code.lastIndexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `      <AppLayout
        session={session}
        onLogout={() => {
          setSession(null);
          showToast('Anda telah keluar dari sesi.');
        }}
        onOpenSupabase={handleOpenRbacModal}
        onOpenMasterUnits={() => setIsMasterUnitsModalOpen(true)}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        onResetData={handleResetData}
        isSupabaseConfigured={isSupabaseConfigured}
        canManageRbac={canManageRbac}
        canManageUnits={canManageUnits}
        canExportCSV={canExportCSV}
        canPrintReports={canPrintReports}
      >
        <div className="max-w-7xl w-full mx-auto space-y-3 sm:space-y-4 pb-24">
` + code.substring(code.indexOf("{/* Context Banner: Kepala Ruangan or Unit Selector */}"), endIndex) + `
        </div>
      </AppLayout>
    </div>`;

  code = code.substring(0, startIndex) + replacement + code.substring(endIndex + endMarker.length);
}

fs.writeFileSync('src/App.tsx', code);
