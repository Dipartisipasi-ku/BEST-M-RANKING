const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

const regex = /<label className="block text-sm font-bold text-slate-700 mb-1\.5">Nama Lengkap<\/label>[\s\S]*?<\/div>/;

const newHTML = `<label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
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
                      placeholder={role === 'staf_pegawai' ? "Pilih ruangan terlebih dahulu" : "Ns. Nama Lengkap, S.Kep"}
                      disabled={role === 'staf_pegawai'}
                    />
                  )}
                </div>`;

code = code.replace(regex, newHTML);

fs.writeFileSync('src/components/LoginPage.tsx', code);
