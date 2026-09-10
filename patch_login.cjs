const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

// Add imports or types if needed. We need to parse staff.
code = code.replace(
  'const [unitId, setUnitId] = useState(\'\');',
  'const [unitId, setUnitId] = useState(\'\');\n  const [staffList, setStaffList] = useState<any[]>([]);'
);

code = code.replace(
  '{role === \'kepala_ruangan\' && (',
  '{(role === \'kepala_ruangan\' || role === \'staf_pegawai\') && ('
);

code = code.replace(
  'onChange={(e) => setUnitId(e.target.value)}',
  'onChange={(e) => {\n                        const newUnitId = e.target.value;\n                        setUnitId(newUnitId);\n                        if (role === \'staf_pegawai\' && newUnitId) {\n                          try {\n                            const saved = localStorage.getItem(`unit_staff_${newUnitId}`);\n                            setStaffList(saved ? JSON.parse(saved) : []);\n                            setFullName(\'\'); // reset selected staff\n                          } catch { setStaffList([]); }\n                        }\n                      }}'
);

// We need to change the full name input for staf_pegawai
code = code.replace(
  '<div>\n                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>\n                <input\n                  type="text"\n                  required\n                  value={fullName}\n                  onChange={(e) => setFullName(e.target.value)}\n                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"\n                  placeholder="Gelar dan Nama Lengkap"\n                />\n              </div>',
  `<div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                {role === 'staf_pegawai' && unitId ? (
                  staffList.length > 0 ? (
                    <select
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Pilih Nama Anda --</option>
                      {staffList.map((s, i) => (
                        <option key={i} value={s.nama}>{s.nama} {s.nip ? \`(\${s.nip})\` : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium border border-rose-100">
                      Belum ada data pegawai di ruangan ini. Kepala Ruangan harus menginput nama Anda terlebih dahulu.
                    </div>
                  )
                ) : (
                  <input
                    type="text"
                    required={role !== 'staf_pegawai'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={role === 'staf_pegawai' ? "Pilih ruangan terlebih dahulu" : "Gelar dan Nama Lengkap"}
                    disabled={role === 'staf_pegawai'}
                  />
                )}
              </div>`
);

// Also need to update unit_id in supabase for staf_pegawai
code = code.replace(
  'unit_id: role === \'kepala_ruangan\' ? unitId : null',
  'unit_id: (role === \'kepala_ruangan\' || role === \'staf_pegawai\') ? unitId : null'
);

fs.writeFileSync('src/components/LoginPage.tsx', code);
