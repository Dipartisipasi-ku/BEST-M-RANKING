const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
appCode = appCode.replace(
  '<StatsCards\n              records={filteredRecords}\n              unitName={activeUnit.nama}\n            />',
  '<StatsCards\n              records={filteredRecords}\n              unitName={activeUnit.nama}\n              totalStaff={currentStaffList.length}\n            />'
);
fs.writeFileSync('src/App.tsx', appCode);

let statsCode = fs.readFileSync('src/components/StatsCards.tsx', 'utf-8');
statsCode = statsCode.replace(
  'interface StatsCardsProps {\n  records: EvaluationRecord[];\n  unitName: string;\n}',
  'interface StatsCardsProps {\n  records: EvaluationRecord[];\n  unitName: string;\n  totalStaff?: number;\n}'
);
statsCode = statsCode.replace(
  'export const StatsCards = ({ records, unitName }: StatsCardsProps) => {',
  'export const StatsCards = ({ records, unitName, totalStaff }: StatsCardsProps) => {'
);
statsCode = statsCode.replace(
  '<span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Staf Dinilai</span>',
  '<span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">{totalStaff !== undefined ? "Pegawai Dinilai" : "Staf Dinilai"}</span>'
);
statsCode = statsCode.replace(
  '<span className="text-xl sm:text-2xl font-bold text-slate-900">{totalEvaluasi}</span>\n            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Pegawai</span>',
  '<span className="text-xl sm:text-2xl font-bold text-slate-900">{totalStaff !== undefined ? `${Array.from(new Set(records.map(r => r.nip || r.nama))).length} / ${totalStaff}` : totalEvaluasi}</span>\n            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Pegawai</span>'
);
fs.writeFileSync('src/components/StatsCards.tsx', statsCode);

