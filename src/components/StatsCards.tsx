import React, { useState } from 'react';
import { EvaluationRecord } from '../types';
import {
  Users,
  CheckCircle2,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart3,
  HelpCircle,
  Calendar,
  Info,
} from 'lucide-react';

interface StatsCardsProps {
  records: EvaluationRecord[];
  unitName: string;
  totalStaff?: number;
  selectedDate?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  records,
  unitName,
  totalStaff,
  selectedDate,
}) => {
  const [isCollapsedOnMobile, setIsCollapsedOnMobile] = useState(false);
  const [showExplanationGuide, setShowExplanationGuide] = useState(false);

  const activeDate = selectedDate || new Date().toISOString().split('T')[0];
  const formattedDate = (() => {
    try {
      return new Date(activeDate + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return activeDate;
    }
  })();

  const cleanUnitName = unitName.replace(/(Instalasi|Ruangan|Unit)\s+/g, '');

  // Calculate records on selected date
  const recordsOnDate = records.filter((r) => r.tanggal === activeDate);
  const evaluatedOnDateStaff = Array.from(
    new Set(recordsOnDate.map((r) => (r.nip && r.nip !== '-' ? r.nip : r.nama.toLowerCase())))
  );
  const evaluatedOnDateCount = evaluatedOnDateStaff.length;

  const totalEvaluasi = records.length;
  const totalUniqueStaffAllTime = Array.from(
    new Set(records.map((r) => (r.nip && r.nip !== '-' ? r.nip : r.nama.toLowerCase())))
  ).length;

  // Determine staff denominator
  const staffTargetCount =
    totalStaff !== undefined && totalStaff > 0
      ? totalStaff
      : Math.max(evaluatedOnDateCount, totalUniqueStaffAllTime, 1);

  const completionRate =
    totalStaff !== undefined && totalStaff > 0
      ? Math.min(100, Math.round((evaluatedOnDateCount / totalStaff) * 100))
      : totalEvaluasi > 0
      ? 100
      : 0;

  // Empty state handling
  if (records.length === 0) {
    return (
      <div className="mb-4 sm:mb-6 space-y-3">
        <div className="bg-white rounded-2xl border border-dashed border-slate-300/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                Belum Ada Data Evaluasi di {unitName}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Pilih tanggal <span className="font-semibold text-slate-700">{formattedDate}</span> dan klik tombol <span className="font-semibold text-emerald-700">"Simpan"</span> atau <span className="font-semibold text-emerald-700">"Nilai Semua 5★"</span> pada tabel di atas untuk mulai mencatat.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Target: {totalStaff || 0} Pegawai</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate average scores (scale 1-5)
  const avgSeragam = (
    records.reduce((acc, curr) => acc + curr.seragamSesuaiKetentuan, 0) / totalEvaluasi
  ).toFixed(2);

  const avgAtribut = (
    records.reduce((acc, curr) => acc + curr.atributKerjaSesuaiKetentuan, 0) / totalEvaluasi
  ).toFixed(2);

  const avgSepatu = (
    records.reduce((acc, curr) => acc + curr.sepatuSaatPelayanan, 0) / totalEvaluasi
  ).toFixed(2);

  const avgSalam = (
    records.reduce((acc, curr) => acc + curr.salamPrimaLingkunganRS, 0) / totalEvaluasi
  ).toFixed(2);

  // Overall average numeric score (scale 1-5)
  const avgOverallNumeric = (
    (parseFloat(avgSeragam) + parseFloat(avgAtribut) + parseFloat(avgSepatu) + parseFloat(avgSalam)) / 4
  ).toFixed(2);

  // Calculate percentage of 'Ya' across 10 boolean items
  let totalBooleanItems = 0;
  let totalYa = 0;

  records.forEach((rec) => {
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

    boolKeys.forEach((key) => {
      totalBooleanItems++;
      if (rec[key] === 'Ya') {
        totalYa++;
      }
    });
  });

  const percentYa = totalBooleanItems > 0 ? Math.round((totalYa / totalBooleanItems) * 100) : 0;

  return (
    <div className="mb-4 sm:mb-6 space-y-3">
      {/* Mobile Toggle & Guide Trigger Bar */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            Dashboard Kepatuhan & Evaluasi &mdash; {cleanUnitName}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            <Calendar className="w-3 h-3 text-slate-400" />
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-toggle-metric-explanation"
            type="button"
            onClick={() => setShowExplanationGuide(!showExplanationGuide)}
            className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/80 transition-colors flex items-center gap-1 cursor-pointer"
            title="Klik untuk melihat penjelasan arti setiap angka"
          >
            <HelpCircle className="w-3 h-3 text-indigo-600" />
            <span>{showExplanationGuide ? 'Tutup Arti Angka' : 'Arti Angka Dashboard'}</span>
          </button>

          <button
            onClick={() => setIsCollapsedOnMobile(!isCollapsedOnMobile)}
            className="sm:hidden text-[11px] font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 py-1 px-2 bg-slate-100 rounded-lg"
          >
            <span>{isCollapsedOnMobile ? 'Buka' : 'Tutup'}</span>
            {isCollapsedOnMobile ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Explanatory Guide Box when toggled or needed */}
      {showExplanationGuide && (
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200 rounded-2xl text-xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center gap-2 text-blue-900 font-bold">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <h4>Keterangan & Penjelasan Maksud Angka pada Dashboard:</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-slate-700">
            <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100 shadow-2xs">
              <span className="font-bold text-blue-800 block mb-0.5">1. Pegawai Dinilai (Progres Harian):</span>
              Menampilkan <span className="font-semibold text-slate-900">{evaluatedOnDateCount} dari {totalStaff || staffTargetCount} pegawai</span> yang telah dinilai pada tanggal <span className="font-semibold text-slate-900">{formattedDate}</span>. Jika semua pegawai dinilai, progres mencapai 100%. Total seluruh formulir tersimpan adalah {totalEvaluasi} catatan.
            </div>
            <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100 shadow-2xs">
              <span className="font-bold text-emerald-800 block mb-0.5">2. Rata-rata Seragam & Atribut (Skala 1 - 5):</span>
              Skor rata-rata penilaian pakaian dinas, kelengkapan atribut (ID Card, pin logo), dan sepatu pelayanan. Angka <span className="font-semibold text-slate-900">{avgSeragam} / 5.0</span> menandakan tingkat kedisiplinan berbusana staf.
            </div>
            <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100 shadow-2xs">
              <span className="font-bold text-amber-800 block mb-0.5">3. Salam Prima RS (Skala 1 - 5):</span>
              Skor rata-rata penerapan budaya 5S (Senyum, Salam, Sapa, Sopan, Santun) dalam pelayanan pasien/keluarga. Nilai <span className="font-semibold text-slate-900">{avgSalam} / 5.0</span> (gabungan 4 kriteria: {avgOverallNumeric}/5.0).
            </div>
            <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100 shadow-2xs">
              <span className="font-bold text-indigo-800 block mb-0.5">4. Kepatuhan 10 Etika RS (%):</span>
              Persentase butir etika kerja yang bernilai <span className="font-semibold text-emerald-700">"Ya"</span> dari 10 indikator integritas (seperti ID Card, pin logo, tidak menerima suap/hadiah, profesionalitas, dll). Saat ini mencapai <span className="font-semibold text-slate-900">{percentYa}%</span> ({totalYa} dari {totalBooleanItems} butir terpenuhi).
            </div>
          </div>
        </div>
      )}

      {/* 4 Main KPI Cards Grid */}
      <div className={`${isCollapsedOnMobile ? 'hidden sm:grid' : 'grid'} grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4`}>
        {/* Card 1: Staf Dinilai Hari Ini */}
        <div id="stat-card-total-pegawai" className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {totalStaff !== undefined ? 'Status Penilaian Hari Ini' : 'Total Arsip Evaluasi'}
              </span>
              <span className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {totalStaff !== undefined ? `${evaluatedOnDateCount} / ${totalStaff}` : totalEvaluasi}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                {totalStaff !== undefined ? 'Staf Dinilai' : 'Formulir'}
              </span>
            </div>

            {/* Visual Progress Bar for Room Today */}
            {totalStaff !== undefined && totalStaff > 0 && (
              <div className="mt-2 space-y-1">
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      completionRate === 100
                        ? 'bg-emerald-500'
                        : completionRate > 0
                        ? 'bg-blue-600'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${completionRate === 100 ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {completionRate}% Selesai
                  </span>
                  <span className="text-slate-400">
                    {totalStaff - evaluatedOnDateCount > 0
                      ? `Sisa ${totalStaff - evaluatedOnDateCount}`
                      : 'Semua Terisi'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            {totalStaff !== undefined ? (
              <span>
                Per {formattedDate} &bull; Total riwayat: <b>{totalEvaluasi}</b> catatan
              </span>
            ) : (
              <span>{totalUniqueStaffAllTime} pegawai unik tercatat</span>
            )}
          </div>
        </div>

        {/* Card 2: Skor Seragam & Atribut (1-5) */}
        <div id="stat-card-skor-seragam" className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Skor Seragam & Atribut
              </span>
              <span className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-emerald-700">{avgSeragam}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">/ 5.0</span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-600">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                Atribut: <b>{avgAtribut}</b>
              </span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                Sepatu: <b>{avgSepatu}</b>
              </span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            <span className="text-emerald-700 font-semibold">
              {parseFloat(avgSeragam) >= 4.5
                ? 'Sangat Rapi & Lengkap'
                : parseFloat(avgSeragam) >= 3.5
                ? 'Sesuai Ketentuan'
                : 'Perlu Perbaikan'}
            </span>{' '}
            &bull; Skala 1 - 5
          </div>
        </div>

        {/* Card 3: Salam Prima RS (1-5) */}
        <div id="stat-card-salam-prima" className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Salam Prima & Sikap
              </span>
              <span className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-amber-700">{avgSalam}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">/ 5.0</span>
            </div>

            <p className="mt-1 text-[10px] text-slate-500">
              Rata-rata 4 Pilar: <span className="font-bold text-slate-700">{avgOverallNumeric} / 5.0</span>
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            <span className="text-amber-700 font-semibold">
              {parseFloat(avgSalam) >= 4.5
                ? 'Budaya 5S Sangat Baik'
                : parseFloat(avgSalam) >= 3.5
                ? 'Ramah & Sopan'
                : 'Perlu Bimbingan'}
            </span>{' '}
            &bull; Skala 1 - 5
          </div>
        </div>

        {/* Card 4: Kepatuhan 10 Etika Kerja (%) */}
        <div id="stat-card-kepatuhan-ya" className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Kepatuhan 10 Etika RS
              </span>
              <span className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-indigo-700">{percentYa}%</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold">Memenuhi (Ya)</span>
            </div>

            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    percentYa >= 90 ? 'bg-emerald-500' : percentYa >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${percentYa}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span
              className={`font-semibold ${
                percentYa >= 90
                  ? 'text-emerald-700'
                  : percentYa >= 75
                  ? 'text-amber-700'
                  : 'text-rose-600'
              }`}
            >
              {percentYa >= 90 ? 'Sangat Patuh' : percentYa >= 75 ? 'Cukup' : 'Perlu Pembinaan'}
            </span>
            <span className="text-slate-400">
              {totalYa}/{totalBooleanItems} Ya
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
