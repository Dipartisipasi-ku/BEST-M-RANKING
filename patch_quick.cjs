const fs = require('fs');
let code = fs.readFileSync('src/components/QuickDirectTable.tsx', 'utf-8');

if (!code.includes('const [confirmState, setConfirmState]')) {
  code = code.replace(
    /const \[globalShift, setGlobalShift\] = useState<'Pagi' \| 'Siang' \| 'Malam' \| 'Non-Shift'>\('Pagi'\);/,
    `const [globalShift, setGlobalShift] = useState<'Pagi' | 'Siang' | 'Malam' | 'Non-Shift'>('Pagi');
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    idToDelete: '',
  });`
  );
  fs.writeFileSync('src/components/QuickDirectTable.tsx', code);
}
