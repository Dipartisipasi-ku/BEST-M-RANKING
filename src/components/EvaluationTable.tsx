import { ConfirmModal } from './ConfirmModal';
import { useState, useMemo } from 'react';
import { EvaluationRecord, EVAL_COLUMNS_SCALE, EVAL_COLUMNS_BOOLEAN } from '../types';
import { getStoredEvalElements } from "../utils/evalElements";
import {
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  AlertCircle,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Star,
  ShieldCheck,
  Calendar,
  Clock,
  MessageSquareQuote,
  Sparkles,
} from 'lucide-react';

interface EvaluationTableProps {
  records: EvaluationRecord[];
  onEdit: (record: EvaluationRecord) => void;
  onDelete: (id: string) => void;
  selectedUnitName: string;
  canEdit?: (record: EvaluationRecord) => boolean;
  canDelete?: boolean;
  onResetData?: () => void;
}

export const EvaluationTable = ({
  records,
  onEdit,
  onDelete,
  selectedUnitName,
  canEdit = () => true,
  canDelete = true,
  onResetData,
}: EvaluationTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    idToDelete: '',
    nama: ''
  });
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const evalElements = getStoredEvalElements();

  const toggleCardExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        rec.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.nip && rec.nip.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rec.jabatan && rec.jabatan.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchShift = filterShift === 'all' || rec.shift === filterShift;
      return matchSearch && matchShift;
    });
  }, [records, searchQuery, filterShift]);

  // Compute column averages for summary row
  const totalRows = filteredRecords.length;
  const avgSeragam = totalRows
    ? (filteredRecords.reduce((acc, r) => acc + r.seragamSesuaiKetentuan, 0) / totalRows).toFixed(1)
    : '0';
  const avgAtribut = totalRows
    ? (filteredRecords.reduce((acc, r) => acc + r.atributKerjaSesuaiKetentuan, 0) / totalRows).toFixed(1)
    : '0';
  const avgSepatu = totalRows
    ? (filteredRecords.reduce((acc, r) => acc + r.sepatuSaatPelayanan, 0) / totalRows).toFixed(1)
    : '0';
  const avgSalam = totalRows
    ? (filteredRecords.reduce((acc, r) => acc + r.salamPrimaLingkunganRS, 0) / totalRows).toFixed(1)
    : '0';

  // Boolean column counts of "Ya"
  const countYa = (key: keyof EvaluationRecord) => {
    if (!totalRows) return 0;
    const count = filteredRecords.filter((r) => r[key] === 'Ya').length;
    return Math.round((count / totalRows) * 100);
  };

  // Helper for single record compliance summary
  const getRecordSummary = (rec: EvaluationRecord) => {
    const scaleAvg = (
      (rec.seragamSesuaiKetentuan +
        rec.atributKerjaSesuaiKetentuan +
        rec.sepatuSaatPelayanan +
        rec.salamPrimaLingkunganRS) /
      4
    ).toFixed(1);

    const boolKeys: (keyof EvaluationRecord)[] = [
      'identitasIdCard',
      'pinAtributLogo',
      'menerapkanSalamPrima',
      'seragamKerjaAturan',
      'ramahSopanMenghormati',
      'tanggungJawabJujurProfesional',
      'tidakTerimaHadiah',
      'pelayananSesuaiKewenangan',
      'memenuhiPanggilanKedinasan',
      'bekerjaPenuhTanggungJawab',
    ];

    const yaCount = boolKeys.filter((k) => rec[k] === 'Ya').length;
    const yaPercent = Math.round((yaCount / boolKeys.length) * 100);

    return { scaleAvg, yaCount, totalBool: boolKeys.length, yaPercent };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table & Card Control Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-pegawai-input"
              type="text"
              placeholder="Cari nama pegawai, NIP, jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm px-1"
              >
                &times;
              </button>
            )}
          </div>

          {/* Shift Filter & View Switcher */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="filter-shift-select"
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Shift</option>
                <option value="Pagi">Pagi</option>
                <option value="Siang">Siang</option>
                <option value="Malam">Malam</option>
                <option value="Non-Shift">Non-Shift</option>
              </select>
            </div>

            {/* View Mode Toggle Button for Mobile / Tablet */}
            <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setMobileViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                  mobileViewMode === 'cards'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Kartu Ringkas (Simpel di HP)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px]">Kartu</span>
              </button>
              <button
                onClick={() => setMobileViewMode('table')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                  mobileViewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Lengkap Spreadsheet"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="text-[11px]">Tabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Count Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredRecords.length}</strong> dari{' '}
              {records.length} evaluasi
            </span>
            {canDelete && onResetData && records.length > 0 && (
              <button
                id="btn-clear-all-eval-records"
                type="button"
                onClick={onResetData}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer shadow-2xs ml-2"
                title="Kosongkan & bersihkan semua data evaluasi"
              >
                <Trash2 className="w-3 h-3" />
                <span>Bersihkan Semua Data ({records.length})</span>
              </button>
            )}
          </div>
          <span className="font-medium text-slate-600 truncate max-w-[180px] sm:max-w-none">
            {selectedUnitName}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. MOBILE CARD VIEW (Default on Mobile, Simpel & Tap-Friendly)      */}
      {/* =================================================================== */}
      {mobileViewMode === 'cards' && (
        <div className="p-3 sm:p-4 bg-slate-50/50">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-6">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">Belum ada data evaluasi (0 Data Dummy)</p>
              <p className="text-xs text-slate-400 mt-1">
                Penyimpanan bersih tanpa data dummy. Silakan berikan penilaian staf melalui tombol &quot;+ Nilai Pegawai&quot; atau beralih ke Input Langsung.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRecords.map((rec) => {
                const { scaleAvg, yaCount, totalBool, yaPercent } = getRecordSummary(rec);
                const isExpanded = Boolean(expandedCards[rec.id]);

                return (
                  <div
                    key={rec.id}
                    id={`mobile-card-${rec.id}`}
                    className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
                  >
                    {/* Top Row: Name, Title & Actions */}
                    <div className="p-3 sm:p-4 border-b border-slate-100 flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Initial Avatar */}
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                          {rec.nama
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                            {rec.nama}
                          </h3>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {rec.jabatan || 'Pegawai RS'}
                            {rec.nip && (
                              <span className="text-slate-400 font-mono ml-1.5 text-[10px]">
                                &bull; {rec.nip}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons (Touch friendly min 40px) */}
                      <div className="flex items-center gap-1 shrink-0">
                        {canEdit(rec) && (
                          <button
                            id={`btn-card-edit-${rec.id}`}
                            onClick={() => onEdit(rec)}
                            className="w-9 h-9 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Penilaian"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          deleteConfirmId === rec.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  onDelete(rec.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-rose-600 text-white rounded-lg text-xs cursor-pointer"
                                title="Konfirmasi Hapus"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`btn-card-delete-${rec.id}`}
                              onClick={() => setDeleteConfirmId(rec.id)}
                              className="w-9 h-9 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Penilaian"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Meta Bar: Unit, Shift, Tanggal */}
                    <div className="px-3 sm:px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {rec.unitNama.replace(/(Instalasi|Ruangan|Unit)\s+/g, '')}
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-100">
                          Shift {rec.shift}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Calendar className="w-3 h-3" />
                        <span>{rec.tanggal}</span>
                      </div>
                    </div>

                    {/* Quick Highlights: 2 Primary Score Badges */}
                    <div className="p-3 sm:p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Skor Skala (1-5) */}
                        <div className="bg-blue-50/60 border border-blue-100/80 rounded-xl p-2.5 text-center">
                          <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">
                            Rata2 Skala (1-5)
                          </span>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span className="text-base font-bold text-slate-900">{scaleAvg}</span>
                            <span className="text-[10px] text-slate-400">/ 5.0</span>
                          </div>
                        </div>

                        {/* Kepatuhan Etika */}
                        <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-xl p-2.5 text-center">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                            Kepatuhan Etika
                          </span>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-base font-bold text-emerald-800">{yaPercent}%</span>
                            <span className="text-[10px] text-emerald-600">({yaCount}/{totalBool})</span>
                          </div>
                        </div>
                      </div>

                      {/* 4 Mini Scale Indicators Grid */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[9px] text-slate-500 block truncate" title={evalElements.scale[0].title}>
                            {evalElements.scale[0].title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}
                          </span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                            {rec.seragamSesuaiKetentuan}/5
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[9px] text-slate-500 block truncate" title={evalElements.scale[1].title}>
                            {evalElements.scale[1].title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}
                          </span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                            {rec.atributKerjaSesuaiKetentuan}/5
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[9px] text-slate-500 block truncate" title={evalElements.scale[2].title}>
                            {evalElements.scale[2].title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}
                          </span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                            {rec.sepatuSaatPelayanan}/5
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[9px] text-slate-500 block truncate" title={evalElements.scale[3].title}>
                            {evalElements.scale[3].title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}
                          </span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                            {rec.salamPrimaLingkunganRS}/5
                          </span>
                        </div>
                      </div>

                      {/* Catatan if available */}
                      {rec.catatan && (
                        <div className="text-[11px] bg-amber-50/70 border border-amber-200/80 rounded-lg p-2 text-amber-900 flex items-start gap-1.5">
                          <MessageSquareQuote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="italic">{rec.catatan}</span>
                        </div>
                      )}

                      {/* Expandable 9 Items Checklist Toggle */}
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => toggleCardExpand(rec.id)}
                          className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            {isExpanded ? `Sembunyikan ${evalElements.booleanTitle}` : `Lihat Indikator ${evalElements.booleanTitle}`}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                        </button>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                            {evalElements.booleans?.map((col: any) => {
                              const val = rec[col.id as keyof EvaluationRecord];
                              const isYes = val === 'Ya';
                              return (
                                <div
                                  key={col.id}
                                  className="flex items-center justify-between gap-2 py-1 border-b border-slate-200/50 last:border-0"
                                >
                                  <span className="text-slate-700 leading-snug">
                                    {col.shortLabel}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                                      isYes ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {val as string}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. FULL SPREADSHEET TABLE VIEW (Tabel Lengkap 1400px)               */}
      {/* =================================================================== */}
      {mobileViewMode === 'table' && (
        <div className="overflow-x-auto relative max-h-[70vh] border-b border-slate-200">
          <table id="evaluation-table" className="w-full text-xs text-left border-collapse min-w-[1400px]">
            <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-300">
              <tr>
                {/* Sticky Left Column: DAFTAR NAMA */}
                <th
                  scope="col"
                  className="sticky left-0 z-30 bg-slate-100 p-3 min-w-[220px] max-w-[260px] border-r border-slate-300 shadow-[2px_0_4px_rgba(0,0,0,0.03)] uppercase tracking-wider text-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <span>DAFTAR NAMA</span>
                  </div>
                </th>

                {/* 4 Scale Rating Columns */}
                <th
                  scope="col"
                  className="p-2.5 text-center min-w-[170px] max-w-[200px] border-r border-slate-300 uppercase leading-snug bg-blue-50/50 text-blue-950 font-semibold"
                  title={evalElements.scale[0].title}
                >
                  {evalElements.scale[0].title}
                  <span className="block text-[10px] text-blue-600 font-normal mt-0.5">(Skala 1 - 5)</span>
                </th>

                <th
                  scope="col"
                  className="p-2.5 text-center min-w-[200px] max-w-[230px] border-r border-slate-300 uppercase leading-snug bg-blue-50/50 text-blue-950 font-semibold"
                  title={evalElements.scale[1].title}
                >
                  {evalElements.scale[1].title}
                  <span className="block text-[10px] text-blue-600 font-normal mt-0.5">(Skala 1 - 5)</span>
                </th>

                <th
                  scope="col"
                  className="p-2.5 text-center min-w-[220px] max-w-[250px] border-r border-slate-300 uppercase leading-snug bg-blue-50/50 text-blue-950 font-semibold"
                  title={evalElements.scale[2].title}
                >
                  {evalElements.scale[2].title}
                  <span className="block text-[10px] text-blue-600 font-normal mt-0.5">(Skala 1 - 5)</span>
                </th>

                <th
                  scope="col"
                  className="p-2.5 text-center min-w-[180px] max-w-[210px] border-r border-slate-300 uppercase leading-snug bg-blue-50/50 text-blue-950 font-semibold"
                  title={evalElements.scale[3].title}
                >
                  {evalElements.scale[3].title}
                  <span className="block text-[10px] text-blue-600 font-normal mt-0.5">(Skala 1 - 5)</span>
                </th>

                {/* 9 Boolean Columns */}
                {evalElements.booleans?.map((col: any) => (
                  <th key={col.id} scope="col" className="p-2.5 text-center min-w-[160px] border-r border-slate-300 leading-snug text-slate-800 font-medium">
                    {col.label}
                  </th>
                ))}

                {/* Action column */}
                <th
                  scope="col"
                  className="sticky right-0 z-30 bg-slate-100 p-2.5 text-center min-w-[90px] border-l border-slate-300 shadow-[-2px_0_4px_rgba(0,0,0,0.03)] uppercase tracking-wider text-slate-800"
                >
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-700">Belum ada data evaluasi (0 Data Dummy)</p>
                      <p className="text-xs text-slate-400">
                        Penyimpanan bersih tanpa data dummy. Silakan klik tombol &quot;+ Nilai Pegawai&quot; atau beralih ke mode Input Langsung untuk mulai menilai.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    id={`eval-row-${rec.id}`}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* Sticky DAFTAR NAMA */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50/50 p-3 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="font-semibold text-slate-900 text-sm">{rec.nama}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        {rec.jabatan && <span className="font-medium text-slate-600">{rec.jabatan}</span>}
                        {rec.nip && (
                          <>
                            <span>&bull;</span>
                            <span className="font-mono text-slate-400 text-[10px]">{rec.nip}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                          {rec.unitNama.split('(')[0].trim()}
                        </span>
                        {rec.shift && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                            Shift {rec.shift}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4 numeric scores */}
                    <td className="p-3 text-center border-r border-slate-200 font-mono text-sm font-bold text-slate-800 bg-blue-50/15">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                        rec.seragamSesuaiKetentuan === 5 ? 'bg-emerald-100 text-emerald-800' :
                        rec.seragamSesuaiKetentuan === 4 ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.seragamSesuaiKetentuan}
                      </span>
                    </td>

                    <td className="p-3 text-center border-r border-slate-200 font-mono text-sm font-bold text-slate-800 bg-blue-50/15">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                        rec.atributKerjaSesuaiKetentuan === 5 ? 'bg-emerald-100 text-emerald-800' :
                        rec.atributKerjaSesuaiKetentuan === 4 ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.atributKerjaSesuaiKetentuan}
                      </span>
                    </td>

                    <td className="p-3 text-center border-r border-slate-200 font-mono text-sm font-bold text-slate-800 bg-blue-50/15">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                        rec.sepatuSaatPelayanan === 5 ? 'bg-emerald-100 text-emerald-800' :
                        rec.sepatuSaatPelayanan === 4 ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.sepatuSaatPelayanan}
                      </span>
                    </td>

                    <td className="p-3 text-center border-r border-slate-200 font-mono text-sm font-bold text-slate-800 bg-blue-50/15">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                        rec.salamPrimaLingkunganRS === 5 ? 'bg-emerald-100 text-emerald-800' :
                        rec.salamPrimaLingkunganRS === 4 ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.salamPrimaLingkunganRS}
                      </span>
                    </td>

                    {/* 9 boolean status cells matching user screenshot */}
                    {evalElements.booleans?.map((col: any) => {
                      const val = rec[col.id as keyof EvaluationRecord];
                      return (
                        <td key={col.id} className="p-3 text-center border-r border-slate-200">
                          <span className={`inline-flex items-center justify-center font-semibold text-xs px-2 py-0.5 rounded ${
                            val === 'Ya' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                          }`}>
                            {val as string}
                          </span>
                        </td>
                      );
                    })}

                    {/* Actions column */}
                    <td className="sticky right-0 z-10 bg-white group-hover:bg-blue-50/50 p-3 text-center border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit(rec) && (
                          <button
                            id={`btn-edit-${rec.id}`}
                            onClick={() => onEdit(rec)}
                            title="Edit Penilaian"
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && (
                          deleteConfirmId === rec.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  onDelete(rec.id);
                                  setDeleteConfirmId(null);
                                }}
                                title="Konfirmasi Hapus"
                                className="p-1 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                title="Batal"
                                className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`btn-delete-${rec.id}`}
                              onClick={() => setDeleteConfirmId(rec.id)}
                              title="Hapus Penilaian"
                              className="p-1.5 text-rose-500 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Summary Footer */}
            {filteredRecords.length > 0 && (
              <tfoot className="bg-slate-100 font-semibold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td className="sticky left-0 z-10 bg-slate-100 p-3 border-r border-slate-300 uppercase tracking-wider text-slate-900">
                    RATA-RATA / KEPATUHAN UNIT
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-emerald-800 font-mono text-sm">
                    {avgSeragam}
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-emerald-800 font-mono text-sm">
                    {avgAtribut}
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-emerald-800 font-mono text-sm">
                    {avgSepatu}
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-emerald-800 font-mono text-sm">
                    {avgSalam}
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-indigo-800 font-mono text-xs">
                    {countYa('identitasIdCard')}% Ya
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-indigo-800 font-mono text-xs">
                    {countYa('menerapkanSalamPrima')}% Ya
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-indigo-800 font-mono text-xs">
                    {countYa('seragamKerjaAturan')}% Ya
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-indigo-800 font-mono text-xs">
                    {countYa('ramahSopanMenghormati')}% Ya
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-indigo-800 font-mono text-xs">
                    {countYa('tanggungJawabJujurProfesional')}% Ya
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-indigo-800 font-mono text-xs">
                    {countYa('tidakTerimaHadiah')}% Ya
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-indigo-800 font-mono text-xs">
                    {countYa('pelayananSesuaiKewenangan')}% Ya
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-indigo-800 font-mono text-xs">
                    {countYa('memenuhiPanggilanKedinasan')}% Ya
                  </td>
                  <td className="p-3 text-center border-r border-slate-300 text-indigo-800 font-mono text-xs">
                    {countYa('bekerjaPenuhTanggungJawab')}% Ya
                  </td>
                  <td className="sticky right-0 z-10 bg-slate-100 p-3 text-center text-slate-400">
                    -
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="Hapus Data Evaluasi"
        message={`Hapus data evaluasi untuk ${confirmState.nama}?`}
        onConfirm={() => onDelete(confirmState.idToDelete)}
        onCancel={() => setConfirmState({ isOpen: false, idToDelete: '', nama: '' })}
      />
    </div>
  );
};
