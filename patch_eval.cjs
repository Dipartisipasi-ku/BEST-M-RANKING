const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluationTable.tsx', 'utf-8');

if (!code.includes('const [confirmState, setConfirmState]')) {
  code = code.replace(
    /const \[deleteConfirmId, setDeleteConfirmId\] = useState<string \| null>\(null\);/,
    `const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    idToDelete: '',
    nama: ''
  });`
  );
  fs.writeFileSync('src/components/EvaluationTable.tsx', code);
}
