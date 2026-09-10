const fs = require('fs');
let code = fs.readFileSync('src/components/QuickDirectTable.tsx', 'utf-8');

if (!code.includes("import { ConfirmModal } from './ConfirmModal';")) {
  code = code.replace(
    "import { EvaluationRecord, StaffMember, Unit } from '../types';",
    "import { EvaluationRecord, StaffMember, Unit } from '../types';\nimport { ConfirmModal } from './ConfirmModal';"
  );
}

if (!code.includes("const [confirmState, setConfirmState]")) {
  code = code.replace(
    "const [expandedRow, setExpandedRow] = useState<string | null>(null);",
    `const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    idToDelete: '',
  });`
  );
}

code = code.replace(
  /onClick=\{\(\) => \{\s*if \(window\.confirm\(`Hapus evaluasi ini\?`\)\) \{\s*onDeleteRecord\(existing\.id\);\s*\}\s*\}\}/g,
  `onClick={() => setConfirmState({ isOpen: true, idToDelete: existing.id })}`
);

if (!code.includes("<ConfirmModal")) {
  code = code.replace(
    "</div>\n  );\n};\n",
    `
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="Hapus Evaluasi"
        message="Hapus evaluasi ini?"
        onConfirm={() => onDeleteRecord(confirmState.idToDelete)}
        onCancel={() => setConfirmState({ isOpen: false, idToDelete: '' })}
      />
    </div>
  );
};
`
  );
}

fs.writeFileSync('src/components/QuickDirectTable.tsx', code);
