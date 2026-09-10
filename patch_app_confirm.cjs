const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes("import { ConfirmModal } from './components/ConfirmModal';")) {
  code = code.replace(
    "import { AdaptiveToolbar } from './components/AdaptiveToolbar';",
    "import { AdaptiveToolbar } from './components/AdaptiveToolbar';\nimport { ConfirmModal } from './components/ConfirmModal';"
  );
}

if (!code.includes("const [confirmState, setConfirmState]")) {
  code = code.replace(
    "const [toastMessage, setToastMessage] = useState<string | null>(null);",
    `const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };`
  );
}

// Replace window.confirm in handleDeleteUnit
code = code.replace(
  /if \(window\.confirm\(`Hapus unit "\$\{unit\.nama\}" dari sistem\?`\)\) \{([\s\S]*?)showToast\(`Unit "\$\{unit\.nama\}" berhasil dihapus\.`\);\n\s*\}/,
  `showConfirm(
      'Hapus Unit',
      \`Hapus unit "\${unit.nama}" dari sistem?\`,
      async () => {$1showToast(\`Unit "\${unit.nama}" berhasil dihapus.\`);
      }
    );`
);

// Replace window.confirm in handleResetUnits
code = code.replace(
  /if \(window\.confirm\('Reset daftar master ruangan ke 38 unit standar rumah sakit\?'\)\) \{([\s\S]*?)showToast\('Daftar ruangan berhasil direset ke 38 unit standar\.'\);\n\s*\}/,
  `showConfirm(
      'Reset Master Ruangan',
      'Reset daftar master ruangan ke 38 unit standar rumah sakit?',
      () => {$1showToast('Daftar ruangan berhasil direset ke 38 unit standar.');
      }
    );`
);

// Replace window.confirm in handleResetData
code = code.replace(
  /if \(window\.confirm\('Bersihkan semua data evaluasi dan kosongkan penyimpanan lokal\? Seluruh data evaluasi akan dikosongkan secara total \(0 data\)\.'\)\) \{([\s\S]*?)showToast\('Seluruh data evaluasi & penyimpanan lokal berhasil dibersihkan \(0 data\)\.'\);\n\s*\}/,
  `showConfirm(
      'Bersihkan Data Evaluasi',
      'Seluruh data evaluasi akan dikosongkan secara total (0 data). Lanjutkan?',
      () => {$1showToast('Seluruh data evaluasi & penyimpanan lokal berhasil dibersihkan (0 data).');
      }
    );`
);

// Add <ConfirmModal ... />
if (!code.includes("<ConfirmModal")) {
  code = code.replace(
    "{/* Modal 3: Cetak Dokumen / Print Preview */}",
    `<ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
      
      {/* Modal 3: Cetak Dokumen / Print Preview */}`
  );
}

fs.writeFileSync('src/App.tsx', code);
