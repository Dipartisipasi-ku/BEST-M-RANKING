const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add import
if (!code.includes("import { MasterUnitsModal } from './components/MasterUnitsModal';")) {
  code = code.replace(
    "import { AddUnitModal } from './components/AddUnitModal';",
    "import { AddUnitModal } from './components/AddUnitModal';\nimport { MasterUnitsModal } from './components/MasterUnitsModal';"
  );
}

// 2. Add state variable
if (!code.includes("const [isMasterUnitsModalOpen, setIsMasterUnitsModalOpen] = useState(false);")) {
  code = code.replace(
    "const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);",
    "const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);\n  const [isMasterUnitsModalOpen, setIsMasterUnitsModalOpen] = useState(false);"
  );
}

// 3. Add to AdaptiveToolbar
code = code.replace(
  "onOpenSupabase={handleOpenRbacModal}",
  "onOpenSupabase={handleOpenRbacModal}\n        onOpenMasterUnits={() => setIsMasterUnitsModalOpen(true)}"
);

// 4. Add to switcher bar (under "flex items-center gap-2" before btn-tambah-unit)
// We need to carefully replace the switcher buttons.
// Let's use string replacement for the buttons section in App.tsx
// find:
/*
              <div className="flex items-center gap-2">
                {canManageUnits && (
*/
// replace with:
/*
              <div className="flex items-center gap-2">
                <button
                  id="btn-kelola-master-units"
                  type="button"
                  onClick={() => setIsMasterUnitsModalOpen(true)}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Master Ruangan ({units.length})</span>
                </button>
                {activeUnit && (
                  <button
                    id="btn-edit-unit-current"
                    type="button"
                    onClick={() => handleOpenEditUnit(activeUnit)}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title={`Edit nama ruangan & kepala ${activeUnit.nama}`}
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit {activeUnit.nama}</span>
                  </button>
                )}
                {canManageUnits && (
*/
code = code.replace(
  /<div className="flex items-center gap-2">\s*\{canManageUnits && \(/,
  `<div className="flex items-center gap-2">
                <button
                  id="btn-kelola-master-units"
                  type="button"
                  onClick={() => setIsMasterUnitsModalOpen(true)}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Master Ruangan ({units.length})</span>
                  <span className="inline sm:hidden">Master</span>
                </button>
                {activeUnit && (
                  <button
                    id="btn-edit-unit-current"
                    type="button"
                    onClick={() => handleOpenEditUnit(activeUnit)}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title={\`Edit nama ruangan & kepala \${activeUnit.nama}\`}
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Edit {activeUnit.nama}</span>
                    <span className="inline sm:hidden">Edit</span>
                  </button>
                )}
                {canManageUnits && (`
);

// 5. Add MasterUnitsModal JSX
if (!code.includes("<MasterUnitsModal")) {
  code = code.replace(
    "{/* Modal 3: Cetak Dokumen / Print Preview */}",
    `<MasterUnitsModal
        isOpen={isMasterUnitsModalOpen}
        onClose={() => setIsMasterUnitsModalOpen(false)}
        units={units}
        onAddUnitClick={handleOpenAddUnit}
        onEditUnitClick={handleOpenEditUnit}
        onDeleteUnit={handleDeleteUnit}
        onResetUnits={handleResetUnits}
      />

      {/* Modal 3: Cetak Dokumen / Print Preview */}`
  );
}

fs.writeFileSync('src/App.tsx', code);
