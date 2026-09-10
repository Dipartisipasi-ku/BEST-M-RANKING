import React, { useState, useMemo } from 'react';
import { EvaluationRecord, Unit, AppRole, AuthSession } from '../types';
import { Printer, X, Filter, FileSpreadsheet } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

interface PrintReportViewProps {
  isOpen: boolean;
  onClose: () => void;
  records: EvaluationRecord[];
  allUnits: Unit[];
  activeRole: AppRole;
  session: AuthSession | null;
  initialUnitId?: string;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  isOpen,
  onClose,
  records,
  allUnits,
  activeRole,
  session,
  initialUnitId = 'all',
}) => {
  const [filterUnitId, setFilterUnitId] = useState<string>(initialUnitId);
  const [filterDateType, setFilterDateType] = useState<'all' | 'date' | 'month'>('all');
  const [filterDateValue, setFilterDateValue] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterMonthValue, setFilterMonthValue] = useState<string>(new Date().toISOString().substring(0, 7));
  const [filterName, setFilterName] = useState<string>('');

  const isStafPegawai = activeRole === 'staf_pegawai';
  
  // Staf pegawai can only see their own unit
  const finalUnitId = isStafPegawai ? session?.unitId || 'all' : filterUnitId;
  const selectedUnit = allUnits.find(u => u.id === finalUnitId);

  const filteredRecords = useMemo(() => {
    let result = records;

    // Filter Unit
    if (finalUnitId !== 'all') {
      result = result.filter(r => r.unitId === finalUnitId);
    }

    // Filter Name (Staf Pegawai can only see themselves)
    if (isStafPegawai && session?.userName) {
      result = result.filter(r => r.nama.toLowerCase() === session.userName.toLowerCase());
    } else if (filterName.trim()) {
      result = result.filter(r => r.nama.toLowerCase().includes(filterName.toLowerCase().trim()));
    }

    // Filter Date/Month
    if (filterDateType === 'date' && filterDateValue) {
      result = result.filter(r => r.tanggal === filterDateValue);
    } else if (filterDateType === 'month' && filterMonthValue) {
      result = result.filter(r => r.tanggal.startsWith(filterMonthValue));
    }

    return result;
  }, [records, finalUnitId, filterName, filterDateType, filterDateValue, filterMonthValue, isStafPegawai, session?.userName]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportToCSV(filteredRecords, selectedUnit ? selectedUnit.nama : 'Semua_Unit');
  };

  const unitTitle = selectedUnit ? selectedUnit.nama : 'Seluruh Unit / Ruangan / Instalasi Rumah Sakit';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:w-full print:rounded-none">
        {/* Action Bar (Hidden on print) */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Cetak & Ekspor Rekapitulasi</h3>
            <p className="text-xs text-slate-500">Filter data sebelum mencetak dokumen atau ekspor ke CSV/Excel.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              title="Download format Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak PDF / Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters (Hidden on print) */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 print:hidden flex flex-wrap gap-3 items-center text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Rekap:</span>
          </div>

          {/* Unit Filter */}
          {!isStafPegawai && (
            <select
              value={filterUnitId}
              onChange={(e) => setFilterUnitId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="all">Semua Ruangan</option>
              {allUnits.map(u => (
                <option key={u.id} value={u.id}>{u.nama}</option>
              ))}
            </select>
          )}

          {/* Date Type Filter */}
          <select
            value={filterDateType}
            onChange={(e) => setFilterDateType(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
          >
            <option value="all">Semua Waktu</option>
            <option value="date">Per Tanggal</option>
            <option value="month">Per Bulan</option>
          </select>

          {/* Date Value Filter */}
          {filterDateType === 'date' && (
            <input
              type="date"
              value={filterDateValue}
              onChange={(e) => setFilterDateValue(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            />
          )}

          {/* Month Value Filter */}
          {filterDateType === 'month' && (
            <input
              type="month"
              value={filterMonthValue}
              onChange={(e) => setFilterMonthValue(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            />
          )}

          {/* Name Filter */}
          {!isStafPegawai && (
            <input
              type="text"
              placeholder="Cari nama pegawai..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700 w-48"
            />
          )}
        </div>

        {/* Printable Paper Content */}
        <div className="flex-1 overflow-y-auto p-8 font-sans text-slate-900 print:overflow-visible print:p-6 print:text-black">
          {/* Hospital Header / Kop Surat */}
          <div className="border-b-2 border-slate-800 pb-3 mb-5 text-center">
            <h1 className="text-base font-bold uppercase tracking-wide">
              RUMAH SAKIT UMUM DAERAH
            </h1>
            <h2 className="text-xs font-semibold uppercase text-slate-700">
              KOMITE MUTU & KESELAMATAN PASIEN &bull; SUB KOMITE ETIKA DAN DISIPLIN
            </h2>
            <p className="text-[10px] text-slate-500">
              Jl. Kesehatan No. 1 &bull; Telp. (021) 555-0123 &bull; Email: komitemutu@rsud.go.id
            </p>
          </div>

          <div className="text-center mb-5">
            <h3 className="text-sm font-bold uppercase underline">
              REKAPITULASI EVALUASI KEPATUHAN SERAGAM, ATRIBUT & BUDAYA KERJA
            </h3>
            <p className="text-xs text-slate-700 mt-1 font-medium">
              Unit / Ruangan: <span className="font-bold uppercase">{unitTitle}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Periode: {filterDateType === 'all' ? 'Semua Waktu' : filterDateType === 'date' ? filterDateValue : filterMonthValue} &bull; Total Data: {filteredRecords.length} Penilaian
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-400">
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 text-center font-bold">
                  <th className="p-1.5 border-r border-slate-400 w-7">NO</th>
                  <th className="p-1.5 border-r border-slate-400 w-20">TANGGAL</th>
                  <th className="p-1.5 border-r border-slate-400 min-w-[140px] text-left">DAFTAR NAMA</th>
                  <th className="p-1.5 border-r border-slate-400 w-24">SERAGAM RS (1-5)</th>
                  <th className="p-1.5 border-r border-slate-400 w-24">ATRIBUT KERJA (1-5)</th>
                  <th className="p-1.5 border-r border-slate-400 w-24">SEPATU LAYANAN (1-5)</th>
                  <th className="p-1.5 border-r border-slate-400 w-24">SALAM PRIMA (1-5)</th>
                  <th className="p-1 border-r border-slate-400 w-12">ID CARD</th>
                  <th className="p-1 border-r border-slate-400 w-12">PIN/ATRIBUT</th>
                  <th className="p-1 border-r border-slate-400 w-12">SALAM PRIMA</th>
                  <th className="p-1 border-r border-slate-400 w-12">SERAGAM ATURAN</th>
                  <th className="p-1 border-r border-slate-400 w-12">RAMAH SOPAN</th>
                  <th className="p-1 border-r border-slate-400 w-12">TANGGUNG JAWAB</th>
                  <th className="p-1 border-r border-slate-400 w-12">BEBAS HADIAH</th>
                  <th className="p-1 border-r border-slate-400 w-12">SESUAI WEWENANG</th>
                  <th className="p-1 border-r border-slate-400 w-12">HADIR RAPAT</th>
                  <th className="p-1 w-12">BEKERJA PENUH TJ</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="p-4 text-center text-slate-500 font-semibold">Tidak ada data untuk kriteria filter tersebut.</td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, index) => (
                    <tr key={rec.id} className="border-b border-slate-300">
                      <td className="p-1 border-r border-slate-300 text-center font-mono">{index + 1}</td>
                      <td className="p-1 border-r border-slate-300 text-center font-mono">{rec.tanggal}</td>
                      <td className="p-1 border-r border-slate-300 font-semibold">
                        {rec.nama}
                        {rec.jabatan && <div className="text-[9px] font-normal text-slate-500">{rec.jabatan}</div>}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center font-bold font-mono">{rec.seragamSesuaiKetentuan}</td>
                      <td className="p-1 border-r border-slate-300 text-center font-bold font-mono">{rec.atributKerjaSesuaiKetentuan}</td>
                      <td className="p-1 border-r border-slate-300 text-center font-bold font-mono">{rec.sepatuSaatPelayanan}</td>
                      <td className="p-1 border-r border-slate-300 text-center font-bold font-mono">{rec.salamPrimaLingkunganRS}</td>
                      <td className="p-1 border-r border-slate-300 text-center">{rec.identitasIdCard}</td>
                      <td className="p-1 border-r border-slate-300 text-center">{rec.pinAtributLogo || '-'}</td>
                      <td className="p-1 border-r border-slate-300 text-center">{rec.menerapkanSalamPrima}</td>
                      <td className="p-1 border-r border-slate-300 text-center">{rec.seragamKerjaAturan}</td>
                      <td className="p-1 border-r border-slate-300 text-center">{rec.ramahSopanMenghormati}</td>
                      <td className="p-1 border-r border-slate-300 text-center">{rec.tanggungJawabJujurProfesional}</td>
                      <td className="p-1 border-r border-slate-300 text-center">{rec.tidakTerimaHadiah}</td>
                      <td className="p-1 border-r border-slate-300 text-center">{rec.pelayananSesuaiKewenangan}</td>
                      <td className="p-1 border-r border-slate-300 text-center">{rec.memenuhiPanggilanKedinasan}</td>
                      <td className="p-1 text-center">{rec.bekerjaPenuhTanggungJawab}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-4 grid grid-cols-2 text-center text-xs break-inside-avoid">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900 mt-0.5">Kepala Ruangan / Koordinator Unit</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">
                {selectedUnit?.kepalaRuangan || '( .................................................... )'}
              </p>
              <p className="text-[10px] text-slate-500">NIP. .................................................</p>
            </div>

            <div>
              <p className="text-slate-600">{currentDate}</p>
              <p className="font-bold text-slate-900 mt-0.5">Petugas Penilai / Komite Mutu</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">( .................................................... )</p>
              <p className="text-[10px] text-slate-500">NIP. .................................................</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
