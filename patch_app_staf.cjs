const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// For staf_pegawai, we also want them to use a Context Banner, not the multi-unit switcher
const replaceTarget = `{isKepalaRuangan ? (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">`;

const insertion = `{isKepalaRuangan || activeRole === 'staf_pegawai' ? (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">`;

code = code.replace(replaceTarget, insertion);

const replaceBtn = `<div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                id="btn-tambah-eval-kepala"`;

const newBtn = `<div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              {activeRole !== 'staf_pegawai' && (
              <button
                id="btn-tambah-eval-kepala"`;
code = code.replace(replaceBtn, newBtn);

const closeBtn = `<span>+ Formulir Lengkap</span>
              </button>
            </div>`;
const newCloseBtn = `<span>+ Formulir Lengkap</span>
              </button>
              )}
            </div>`;
code = code.replace(closeBtn, newCloseBtn);

fs.writeFileSync('src/App.tsx', code);
