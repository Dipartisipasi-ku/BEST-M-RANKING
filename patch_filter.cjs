const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

const replacement = `  const filteredRecords = useMemo(() => {
    let filtered = records;
    if (selectedUnitId !== 'all') {
      filtered = filtered.filter((r) => r.unitId === selectedUnitId);
    }
    
    // Khusus Staf Pegawai: Hanya bisa melihat data dirinya sendiri (sesuai nama akun)
    if (activeRole === 'staf_pegawai') {
      filtered = filtered.filter((r) => r.nama === session?.userName);
    }
    
    return filtered;
  }, [records, selectedUnitId, activeRole, session?.userName]);`;

code = code.replace(
  `  const filteredRecords = useMemo(() => {
    if (selectedUnitId === 'all') {
      return records;
    }
    return records.filter((r) => r.unitId === selectedUnitId);
  }, [records, selectedUnitId]);`,
  replacement
);

fs.writeFileSync('src/App.tsx', code);
