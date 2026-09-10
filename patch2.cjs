const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "import { AdaptiveToolbar } from './components/AdaptiveToolbar';",
  "import { AppLayout } from './components/AppLayout';"
);

// We want to replace <AdaptiveToolbar ... /> with <AppLayout ...> and wrap <main>.
// Let's find <AdaptiveToolbar and </main>

let startIndex = code.indexOf("<AdaptiveToolbar");
let endIndex = code.indexOf("</main>");

if (startIndex !== -1 && endIndex !== -1) {
  // get the content inside <main ...> ... </main>
  let mainStart = code.indexOf("<main", startIndex);
  let mainContentStart = code.indexOf(">", mainStart) + 1;
  let mainContent = code.substring(mainContentStart, endIndex);

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
        onResetData={handleResetData}
        isSupabaseConfigured={isSupabaseConfigured}
        canManageRbac={canManageRbac}
        canManageUnits={canManageUnits}
        canExportCSV={canExportCSV}
        canPrintReports={canPrintReports}
      >
        <div className="max-w-7xl w-full mx-auto space-y-3 sm:space-y-4 pb-24">
${mainContent}
        </div>
      </AppLayout>
`;

  code = code.substring(0, startIndex) + replacement + code.substring(endIndex + 7);
}

fs.writeFileSync('src/App.tsx', code);
