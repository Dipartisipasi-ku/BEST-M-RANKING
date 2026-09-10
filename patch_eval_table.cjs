const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluationTable.tsx', 'utf-8');

if (!code.includes("import { ConfirmModal } from './ConfirmModal';")) {
  code = code.replace(
    "import { EvaluationRecord, Unit } from '../types';",
    "import { EvaluationRecord, Unit } from '../types';\nimport { ConfirmModal } from './ConfirmModal';"
  );
}

if (!code.includes("const [confirmState, setConfirmState]")) {
  code = code.replace(
    "const [searchTerm, setSearchTerm] = useState('');",
    `const [searchTerm, setSearchTerm] = useState('');
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    idToDelete: '',
    nama: ''
  });`
  );
}

code = code.replace(
  /onClick=\{\(\) => \{\s*if \(window\.confirm\(`Hapus data evaluasi untuk \$\{r\.nama\}\?`\)\) \{\s*onDelete\(r\.id\);\s*\}\s*\}\}/g,
  `onClick={() => setConfirmState({ isOpen: true, idToDelete: r.id, nama: r.nama })}`
);

if (!code.includes("<ConfirmModal")) {
  code = code.replace(
    "</div>\n  );\n};\n",
    `
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="Hapus Data Evaluasi"
        message={\`Hapus data evaluasi untuk \${confirmState.nama}?\`}
        onConfirm={() => onDelete(confirmState.idToDelete)}
        onCancel={() => setConfirmState({ isOpen: false, idToDelete: '', nama: '' })}
      />
    </div>
  );
};
`
  );
}

fs.writeFileSync('src/components/EvaluationTable.tsx', code);
