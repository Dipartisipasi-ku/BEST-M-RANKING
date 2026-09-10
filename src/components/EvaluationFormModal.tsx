import React, { useState, useEffect } from 'react';
import { EvaluationRecord, Unit, EVAL_COLUMNS_SCALE, EVAL_COLUMNS_BOOLEAN } from '../types';
import { getStoredEvalElements } from "../utils/evalElements";
import { X, Check, Sparkles, Building2, User, Calendar, Clock, AlertCircle } from 'lucide-react';

interface EvaluationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: EvaluationRecord) => void;
  units?: Unit[];
  initialUnitId: string;
  isRestrictedRole?: boolean;
  editRecord?: EvaluationRecord | null;
}

export const EvaluationFormModal: React.FC<EvaluationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  units = [],
  initialUnitId,
  editRecord,
  isRestrictedRole = false,
}) => {
  const safeUnits = React.useMemo(() => {
    return Array.isArray(units) && units.length > 0
      ? units
      : [{ id: 'igd', nama: 'Instalasi Gawat Darurat (IGD)', kategori: 'Instalasi' as const }];
  }, [units]);

  const [unitId, setUnitId] = useState<string>(initialUnitId || (safeUnits[0]?.id ?? 'igd'));
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'Pagi' | 'Siang' | 'Malam' | 'Non-Shift'>('Pagi');

  // 4 Scale Ratings (1-5)
  const evalElements = getStoredEvalElements();
  const [seragamSesuaiKetentuan, setSeragamSesuaiKetentuan] = useState<number>(5);
  const [atributKerjaSesuaiKetentuan, setAtributKerjaSesuaiKetentuan] = useState<number>(5);
  const [sepatuSaatPelayanan, setSepatuSaatPelayanan] = useState<number>(4);
  const [salamPrimaLingkunganRS, setSalamPrimaLingkunganRS] = useState<number>(4);

  // 10 Boolean Ratings (Ya / Tidak) - Sesuai public.master
  const [identitasIdCard, setIdentitasIdCard] = useState<'Ya' | 'Tidak'>('Ya');
  const [pinAtributLogo, setPinAtributLogo] = useState<'Ya' | 'Tidak'>('Ya');
  const [menerapkanSalamPrima, setMenerapkanSalamPrima] = useState<'Ya' | 'Tidak'>('Ya');
  const [seragamKerjaAturan, setSeragamKerjaAturan] = useState<'Ya' | 'Tidak'>('Ya');
  const [ramahSopanMenghormati, setRamahSopanMenghormati] = useState<'Ya' | 'Tidak'>('Ya');
  const [tanggungJawabJujurProfesional, setTanggungJawabJujurProfesional] = useState<'Ya' | 'Tidak'>('Ya');
  const [tidakTerimaHadiah, setTidakTerimaHadiah] = useState<'Ya' | 'Tidak'>('Ya');
  const [pelayananSesuaiKewenangan, setPelayananSesuaiKewenangan] = useState<'Ya' | 'Tidak'>('Ya');
  const [memenuhiPanggilanKedinasan, setMemenuhiPanggilanKedinasan] = useState<'Ya' | 'Tidak'>('Ya');
  const [bekerjaPenuhTanggungJawab, setBekerjaPenuhTanggungJawab] = useState<'Ya' | 'Tidak'>('Ya');

  const [catatan, setCatatan] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset or Populate form when opened or editRecord changes
  useEffect(() => {
    if (editRecord) {
      setUnitId(editRecord.unitId);
      setNama(editRecord.nama);
      setNip(editRecord.nip || '');
      setJabatan(editRecord.jabatan || '');
      setTanggal(editRecord.tanggal);
      setShift(editRecord.shift || 'Pagi');
      setSeragamSesuaiKetentuan(editRecord.seragamSesuaiKetentuan);
      setAtributKerjaSesuaiKetentuan(editRecord.atributKerjaSesuaiKetentuan);
      setSepatuSaatPelayanan(editRecord.sepatuSaatPelayanan);
      setSalamPrimaLingkunganRS(editRecord.salamPrimaLingkunganRS);
      setIdentitasIdCard(editRecord.identitasIdCard);
      setPinAtributLogo(editRecord.pinAtributLogo || 'Ya');
      setMenerapkanSalamPrima(editRecord.menerapkanSalamPrima);
      setSeragamKerjaAturan(editRecord.seragamKerjaAturan);
      setRamahSopanMenghormati(editRecord.ramahSopanMenghormati);
      setTanggungJawabJujurProfesional(editRecord.tanggungJawabJujurProfesional);
      setTidakTerimaHadiah(editRecord.tidakTerimaHadiah);
      setPelayananSesuaiKewenangan(editRecord.pelayananSesuaiKewenangan);
      setMemenuhiPanggilanKedinasan(editRecord.memenuhiPanggilanKedinasan);
      setBekerjaPenuhTanggungJawab(editRecord.bekerjaPenuhTanggungJawab);
      setCatatan(editRecord.catatan || '');
    } else {
      setUnitId(initialUnitId && initialUnitId !== 'all' ? initialUnitId : safeUnits[0]?.id || 'igd');
      setNama('');
      setNip('');
      setJabatan('');
      setTanggal(new Date().toISOString().split('T')[0]);
      setShift('Pagi');
      setSeragamSesuaiKetentuan(5);
      setAtributKerjaSesuaiKetentuan(5);
      setSepatuSaatPelayanan(4);
      setSalamPrimaLingkunganRS(4);
      setIdentitasIdCard('Ya');
      setPinAtributLogo('Ya');
      setMenerapkanSalamPrima('Ya');
      setSeragamKerjaAturan('Ya');
      setRamahSopanMenghormati('Ya');
      setTanggungJawabJujurProfesional('Ya');
      setTidakTerimaHadiah('Ya');
      setPelayananSesuaiKewenangan('Ya');
      setMemenuhiPanggilanKedinasan('Ya');
      setBekerjaPenuhTanggungJawab('Ya');
      setCatatan('');
    }
    setErrorMessage('');
  }, [editRecord, isOpen, initialUnitId, safeUnits]);

  if (!isOpen) return null;

  const handleQuickFillPerfect = () => {
    setSeragamSesuaiKetentuan(5);
    setAtributKerjaSesuaiKetentuan(5);
    setSepatuSaatPelayanan(5);
    setSalamPrimaLingkunganRS(5);
    setIdentitasIdCard('Ya');
    setPinAtributLogo('Ya');
    setMenerapkanSalamPrima('Ya');
    setSeragamKerjaAturan('Ya');
    setRamahSopanMenghormati('Ya');
    setTanggungJawabJujurProfesional('Ya');
    setTidakTerimaHadiah('Ya');
    setPelayananSesuaiKewenangan('Ya');
    setMemenuhiPanggilanKedinasan('Ya');
    setBekerjaPenuhTanggungJawab('Ya');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMessage('Nama pegawai wajib diisi');
      return;
    }

    const selectedUnit = safeUnits.find((u) => u.id === unitId) || safeUnits[0];

    const recordData: EvaluationRecord = {
      id: editRecord ? editRecord.id : `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      unitId: selectedUnit ? selectedUnit.id : 'igd',
      unitNama: selectedUnit ? selectedUnit.nama : 'Instalasi Gawat Darurat (IGD)',
      nama: nama.trim(),
      nip: nip.trim(),
      jabatan: jabatan.trim(),
      tanggal,
      shift,
      seragamSesuaiKetentuan,
      atributKerjaSesuaiKetentuan,
      sepatuSaatPelayanan,
      salamPrimaLingkunganRS,
      identitasIdCard,
      pinAtributLogo,
      menerapkanSalamPrima,
      seragamKerjaAturan,
      ramahSopanMenghormati,
      tanggungJawabJujurProfesional,
      tidakTerimaHadiah,
      pelayananSesuaiKewenangan,
      memenuhiPanggilanKedinasan,
      bekerjaPenuhTanggungJawab,
      catatan: catatan.trim(),
      createdAt: editRecord ? editRecord.createdAt : new Date().toISOString(),
    };

    onSave(recordData);
    onClose();
  };

  const scaleRatingDescriptions: Record<number, string> = {
    1: '1 - Sangat Kurang',
    2: '2 - Kurang',
    3: '3 - Cukup',
    4: '4 - Baik',
    5: '5 - Sangat Baik',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="evaluation-form-modal"
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2">
              <span className="p-1 sm:p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <span>{editRecord ? 'Edit Evaluasi Pegawai' : 'Input Evaluasi Pegawai'}</span>
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">
              Pencatatan kepatuhan seragam, atribut, salam prima, dan budaya kerja per ruangan/unit
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleQuickFillPerfect}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="Isi cepat dengan skor sempurna"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Isi Cepat Sempurna</span>
              <span className="xs:hidden">Cepat 5★</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Profil & Penempatan Pegawai */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Identitas & Unit Penempatan Pegawai
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ruangan / Unit / Instalasi <span className="text-rose-500">*</span>
                </label>
                <select
                  id="form-select-unit"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  disabled={isRestrictedRole || safeUnits.length <= 1}
                  className={`w-full text-xs font-medium px-3 py-2 bg-white rounded-lg border ${isRestrictedRole || safeUnits.length <= 1 ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500"} focus:outline-none`}
                  required
                >
                  {safeUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      [{u.kategori}] {u.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pegawai / Nakes <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-input-nama"
                  type="text"
                  placeholder="Masukkan nama lengkap pegawai..."
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan / Profesi
                </label>
                <input
                  id="form-input-jabatan"
                  type="text"
                  placeholder="cth: Perawat Pelaksana / Dokter Jaga"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP / No. Induk Pegawai
                </label>
                <input
                  id="form-input-nip"
                  type="text"
                  placeholder="cth: 19920315 201601 1 004"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Tanggal Penilaian
                </label>
                <input
                  id="form-input-tanggal"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Shift Pelayanan
                </label>
                <select
                  id="form-select-shift"
                  value={shift}
                  onChange={(e) => setShift(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Pagi">Pagi</option>
                  <option value="Siang">Siang</option>
                  <option value="Malam">Malam</option>
                  <option value="Non-Shift">Non-Shift / Dinas Normal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: 4 Kolom Penilaian Skala Angka (1 - 5) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  A. Penilaian Kepatuhan Seragam, Atribut & Sikap (Skala 1 - 5)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Keterangan Skala: 1=Sangat Kurang, 2=Kurang, 3=Cukup, 4=Baik, 5=Sangat Baik
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Item 1: Seragam Sesuai Ketentuan */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="max-w-xl">
                    <span className="text-xs font-bold text-slate-800 block">
                      1. MENGGUNAKAN SERAGAM SESUAI KETENTUAN RUMAH SAKIT
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Kesesuaian jenis seragam kerja hari dinas, bersih, rapi, dan sesuai standar profesi.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-start md:self-auto">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSeragamSesuaiKetentuan(val)}
                        className={`w-9 h-9 text-xs font-bold rounded-lg border transition-all ${
                          seragamSesuaiKetentuan === val
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-blue-700 ml-1.5 w-24">
                      {scaleRatingDescriptions[seragamSesuaiKetentuan]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 2: Atribut Kerja */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="max-w-xl">
                    <span className="text-xs font-bold text-slate-800 block">
                      2. MENGGUNAKAN ATRIBUT KERJA SESUAI KETENTUAN RUMAH SAKIT (NAME TAG, PIN KORPRI DAN ID CARD)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Kelengkapan tanda pengenal resmi, nama jelas terbaca, pin korpri/profesi terpasang rapi.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-start md:self-auto">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAtributKerjaSesuaiKetentuan(val)}
                        className={`w-9 h-9 text-xs font-bold rounded-lg border transition-all ${
                          atributKerjaSesuaiKetentuan === val
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-blue-700 ml-1.5 w-24">
                      {scaleRatingDescriptions[atributKerjaSesuaiKetentuan]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 3: Sepatu Saat Pelayanan */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="max-w-xl">
                    <span className="text-xs font-bold text-slate-800 block">
                      3. MENGGUNAKAN SEPATU SAAT MEMBERIKAN PELAYANAN KEPADA TAMU ATAU PENGUNJUNG DAN KEPADA PASIEN DI LINGKUNGAN RUMAH SAKIT
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Menggunakan sepatu kerja tertutup standar rumah sakit / K3RS (bukan sandal jepit/selop santai).
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-start md:self-auto">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSepatuSaatPelayanan(val)}
                        className={`w-9 h-9 text-xs font-bold rounded-lg border transition-all ${
                          sepatuSaatPelayanan === val
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-blue-700 ml-1.5 w-24">
                      {scaleRatingDescriptions[sepatuSaatPelayanan]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 4: Menerapkan Salam Prima Lingkungan RS */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="max-w-xl">
                    <span className="text-xs font-bold text-slate-800 block">
                      4. MENERAPKAN SALAM PRIMA DI LINGKUNGAN RUMAH SAKIT
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Menerapkan budaya 5S (Senyum, Salam, Sapa, Sopan, Santun) kepada pasien dan rekan kerja.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-start md:self-auto">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSalamPrimaLingkunganRS(val)}
                        className={`w-9 h-9 text-xs font-bold rounded-lg border transition-all ${
                          salamPrimaLingkunganRS === val
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-blue-700 ml-1.5 w-24">
                      {scaleRatingDescriptions[salamPrimaLingkunganRS]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: 10 Kolom Indikator Kepatuhan (Ya / Tidak) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  B. Indikator Disiplin & Etika Pelayanan (Ya / Tidak)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Verifikasi kepatuhan operasional dan integritas kerja (10 Kriteria)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdentitasIdCard('Ya');
                    setPinAtributLogo('Ya');
                    setMenerapkanSalamPrima('Ya');
                    setSeragamKerjaAturan('Ya');
                    setRamahSopanMenghormati('Ya');
                    setTanggungJawabJujurProfesional('Ya');
                    setTidakTerimaHadiah('Ya');
                    setPelayananSesuaiKewenangan('Ya');
                    setMemenuhiPanggilanKedinasan('Ya');
                    setBekerjaPenuhTanggungJawab('Ya');
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
                >
                  Pilih Semua &quot;Ya&quot;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  1. Menggunakan identitas nama / ID card / tanda pengenal saat bertugas
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIdentitasIdCard('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      identitasIdCard === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentitasIdCard('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      identitasIdCard === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* 2 - Pin / Atribut Pelayanan */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  2. Menggunakan pin / atribut / logo pelayanan sesuai ketentuan
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPinAtributLogo('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      pinAtributLogo === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinAtributLogo('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      pinAtributLogo === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* 3 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  3. Menerapkan salam prima
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMenerapkanSalamPrima('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      menerapkanSalamPrima === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenerapkanSalamPrima('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      menerapkanSalamPrima === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* 4 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  4. Menggunakan seragam kerja sesuai aturan yang berlaku
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSeragamKerjaAturan('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      seragamKerjaAturan === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeragamKerjaAturan('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      seragamKerjaAturan === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* 5 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  5. Bersikap ramah, sopan dan menghormati pasien / pengunjung
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRamahSopanMenghormati('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      ramahSopanMenghormati === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setRamahSopanMenghormati('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      ramahSopanMenghormati === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* 6 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  6. Melaksanakan tugas dengan penuh tanggung jawab, jujur dan profesional
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTanggungJawabJujurProfesional('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tanggungJawabJujurProfesional === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setTanggungJawabJujurProfesional('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tanggungJawabJujurProfesional === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* 7 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  7. Tidak menerima hadiah, uang, atau imbalan dalam bentuk apapun
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTidakTerimaHadiah('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tidakTerimaHadiah === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setTidakTerimaHadiah('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tidakTerimaHadiah === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* 8 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  8. Melaksanakan pelayanan sesuai tugas dan kewenangan yang diberikan
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPelayananSesuaiKewenangan('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      pelayananSesuaiKewenangan === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setPelayananSesuaiKewenangan('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      pelayananSesuaiKewenangan === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* 9 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  9. Memenuhi panggilan untuk hadir atau melaksanakan perintah kedinasan atau rapat unit sesuai ketentuan
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMemenuhiPanggilanKedinasan('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      memenuhiPanggilanKedinasan === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemenuhiPanggilanKedinasan('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      memenuhiPanggilanKedinasan === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>

              {/* 10 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 md:col-span-2">
                <span className="text-xs text-slate-800 leading-snug font-medium">
                  10. Bekerja dengan penuh tanggungjawab
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setBekerjaPenuhTanggungJawab('Ya')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      bekerjaPenuhTanggungJawab === 'Ya'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setBekerjaPenuhTanggungJawab('Tidak')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      bekerjaPenuhTanggungJawab === 'Tidak'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tidak
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Catatan Khusus / Saran Pembinaan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Temuan / Rekomendasi (Opsional)
            </label>
            <textarea
              id="form-input-catatan"
              rows={2}
              placeholder="Tambahkan catatan khusus bila terdapat ketidaksesuaian atribut atau apresiasi kedisiplinan..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full text-xs p-3 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Form Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-simpan-evaluasi"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editRecord ? 'Simpan Perubahan' : 'Simpan Penilaian Pegawai'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
