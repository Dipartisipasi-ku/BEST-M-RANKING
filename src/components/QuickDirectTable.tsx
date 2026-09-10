import React, { useState, useEffect } from 'react';
import { getStoredEvalElements } from "../utils/evalElements";
import {
  Sparkles,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  UserPlus,
  ShieldCheck,
  Save,
  RotateCcw,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCheck,
  X,
  ListChecks,
  Pencil,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { StaffMember, EvaluationRecord, Unit, EVAL_COLUMNS_BOOLEAN } from '../types';

interface QuickDirectTableProps {
  unit: Unit;
  staffList: StaffMember[];
  existingRecords: EvaluationRecord[];
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  onStaffListChange?: (staffList: StaffMember[]) => void;
  onSaveRecord: (record: EvaluationRecord) => void;
  onBulkSaveRecords?: (records: EvaluationRecord[]) => void;
}

export type BooleanKey =
  | 'identitasIdCard'
  | 'pinAtributLogo'
  | 'menerapkanSalamPrima'
  | 'seragamKerjaAturan'
  | 'ramahSopanMenghormati'
  | 'tanggungJawabJujurProfesional'
  | 'tidakTerimaHadiah'
  | 'pelayananSesuaiKewenangan'
  | 'memenuhiPanggilanKedinasan'
  | 'bekerjaPenuhTanggungJawab';

interface DraftRowState {
  seragam: number;
  atribut: number;
  sepatu: number;
  salam: number;
  ethics: Record<BooleanKey, 'Ya' | 'Tidak'>;
  shift: 'Pagi' | 'Siang' | 'Malam' | 'Non-Shift';
  catatan: string;
  isSaved?: boolean;
}

const getDefaultEthics = (): Record<BooleanKey, 'Ya' | 'Tidak'> => ({
  identitasIdCard: 'Ya',
  pinAtributLogo: 'Ya',
  menerapkanSalamPrima: 'Ya',
  seragamKerjaAturan: 'Ya',
  ramahSopanMenghormati: 'Ya',
  tanggungJawabJujurProfesional: 'Ya',
  tidakTerimaHadiah: 'Ya',
  pelayananSesuaiKewenangan: 'Ya',
  memenuhiPanggilanKedinasan: 'Ya',
  bekerjaPenuhTanggungJawab: 'Ya',
});

const getEthicsFromRecord = (rec: EvaluationRecord): Record<BooleanKey, 'Ya' | 'Tidak'> => ({
  identitasIdCard: rec.identitasIdCard || 'Ya',
  pinAtributLogo: rec.pinAtributLogo || 'Ya',
  menerapkanSalamPrima: rec.menerapkanSalamPrima || 'Ya',
  seragamKerjaAturan: rec.seragamKerjaAturan || 'Ya',
  ramahSopanMenghormati: rec.ramahSopanMenghormati || 'Ya',
  tanggungJawabJujurProfesional: rec.tanggungJawabJujurProfesional || 'Ya',
  tidakTerimaHadiah: rec.tidakTerimaHadiah || 'Ya',
  pelayananSesuaiKewenangan: rec.pelayananSesuaiKewenangan || 'Ya',
  memenuhiPanggilanKedinasan: rec.memenuhiPanggilanKedinasan || 'Ya',
  bekerjaPenuhTanggungJawab: rec.bekerjaPenuhTanggungJawab || 'Ya',
});

export const QuickDirectTable: React.FC<QuickDirectTableProps> = ({
  unit,
  staffList = [],
  existingRecords = [],
  selectedDate: propSelectedDate,
  onDateChange,
  onStaffListChange,
  onSaveRecord,
  onBulkSaveRecords,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [internalDate, setInternalDate] = useState<string>(todayStr);
  const selectedDate = propSelectedDate !== undefined ? propSelectedDate : internalDate;
  const handleDateChange = (newDate: string) => {
    setInternalDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };
  const [globalShift, setGlobalShift] = useState<'Pagi' | 'Siang' | 'Malam' | 'Non-Shift'>('Pagi');
    
  // State for opening the 9 Nilai Etika Dropdown checklist
  const [openDropdownStaffId, setOpenDropdownStaffId] = useState<string | null>(null);
  const [evalElements, setEvalElements] = useState(() => getStoredEvalElements());

  useEffect(() => {
    const handleUpdated = () => {
      setEvalElements(getStoredEvalElements());
    };
    window.addEventListener('evalElementsUpdated', handleUpdated);
    return () => window.removeEventListener('evalElementsUpdated', handleUpdated);
  }, []);

  const safeStaffList = staffList || [];
  const safeExistingRecords = existingRecords || [];

  // Local dynamically added staff for this unit (persisted across sessions)
  const [localStaffList, setLocalStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(`unit_staff_${unit.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reload room staff when unit changes
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(`unit_staff_${unit.id}`);
      setLocalStaffList(saved ? JSON.parse(saved) : []);
    } catch {
      setLocalStaffList([]);
    }
  }, [unit.id]);

  // Combined real active staff for this unit (no dummy seeds)
  const activeStaffList = React.useMemo(() => {
    const map = new Map<string, StaffMember>();
    safeStaffList.forEach((s) => map.set(s.nama.toLowerCase(), s));
    localStaffList.forEach((s) => {
      if (!map.has(s.nama.toLowerCase())) {
        map.set(s.nama.toLowerCase(), s);
      }
    });
    return Array.from(map.values());
  }, [safeStaffList, localStaffList]);

  // State for Add Staff modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffNama, setNewStaffNama] = useState('');
  const [newStaffNip, setNewStaffNip] = useState('');
  const [newStaffJabatan, setNewStaffJabatan] = useState('');

  const handleAddNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffNama.trim()) return;

    const newStaff: StaffMember = {
      id: `staf-${unit.id}-${Date.now()}`,
      unitId: unit.id,
      nama: newStaffNama.trim(),
      nip: newStaffNip.trim() || '-',
      jabatan: newStaffJabatan.trim() || 'Staf Pelayanan / Nakes',
    };

    const updated = [...localStaffList, newStaff];
    setLocalStaffList(updated);
    try {
      localStorage.setItem(`unit_staff_${unit.id}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Storage error:', err);
    }
    if (onStaffListChange) {
      onStaffListChange(updated);
    }

    setDrafts((prev) => ({
      ...prev,
      [newStaff.id]: {
        seragam: 5,
        atribut: 5,
        sepatu: 5,
        salam: 5,
        ethics: getDefaultEthics(),
        shift: globalShift,
        catatan: '',
        isSaved: false,
      },
    }));

    setNewStaffNama('');
    setNewStaffNip('');
    setNewStaffJabatan('');
    setShowAddStaffModal(false);
  };

  const handleDeleteStaff = (staffId: string, staffName: string) => {
    if (window.confirm(`Hapus "${staffName}" dari daftar pegawai ruangan ${unit.nama}?`)) {
      const updated = localStaffList.filter((s) => s.id !== staffId && s.nama.toLowerCase() !== staffName.toLowerCase());
      setLocalStaffList(updated);
      try {
        localStorage.setItem(`unit_staff_${unit.id}`, JSON.stringify(updated));
      } catch (err) {
        console.warn('Storage error:', err);
      }
      if (onStaffListChange) {
        onStaffListChange(updated);
      }
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[staffId];
        return next;
      });
    }
  };

  const handleClearAllStaff = () => {
    if (window.confirm(`Bersihkan dan kosongkan seluruh daftar pegawai di ruangan ${unit.nama}?`)) {
      setLocalStaffList([]);
      try {
        localStorage.removeItem(`unit_staff_${unit.id}`);
      } catch (err) {
        console.warn('Storage error:', err);
      }
      if (onStaffListChange) {
        onStaffListChange([]);
      }
      setDrafts({});
    }
  };

  // Initialize draft rows state from activeStaffList & existing records for active selectedDate
  const [drafts, setDrafts] = useState<Record<string, DraftRowState>>(() => {
    const initial: Record<string, DraftRowState> = {};
    activeStaffList.forEach((staf) => {
      const match = safeExistingRecords.find(
        (r) =>
          r.unitId === unit.id &&
          ((r.nip && staf.nip && r.nip !== '-' && r.nip === staf.nip) ||
            r.nama.toLowerCase() === staf.nama.toLowerCase()) &&
          r.tanggal === selectedDate
      );
      if (match) {
        initial[staf.id] = {
          seragam: match.seragamSesuaiKetentuan,
          atribut: match.atributKerjaSesuaiKetentuan,
          sepatu: match.sepatuSaatPelayanan,
          salam: match.salamPrimaLingkunganRS,
          ethics: getEthicsFromRecord(match),
          shift: match.shift || 'Pagi',
          catatan: match.catatan || '',
          isSaved: true,
        };
      } else {
        initial[staf.id] = {
          seragam: 5,
          atribut: 5,
          sepatu: 5,
          salam: 5,
          ethics: getDefaultEthics(),
          shift: 'Pagi',
          catatan: '',
          isSaved: false,
        };
      }
    });
    return initial;
  });

  // Keep drafts synchronized whenever activeStaffList, selectedDate, or safeExistingRecords changes
  React.useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      let changed = false;

      activeStaffList.forEach((staf) => {
        const match = safeExistingRecords.find(
          (r) =>
            r.unitId === unit.id &&
            ((r.nip && staf.nip && r.nip !== '-' && r.nip === staf.nip) ||
              r.nama.toLowerCase() === staf.nama.toLowerCase()) &&
            r.tanggal === selectedDate
        );

        if (match) {
          const current = next[staf.id];
          if (
            !current ||
            !current.isSaved ||
            current.seragam !== match.seragamSesuaiKetentuan ||
            current.atribut !== match.atributKerjaSesuaiKetentuan ||
            current.sepatu !== match.sepatuSaatPelayanan ||
            current.salam !== match.salamPrimaLingkunganRS
          ) {
            changed = true;
            next[staf.id] = {
              seragam: match.seragamSesuaiKetentuan,
              atribut: match.atributKerjaSesuaiKetentuan,
              sepatu: match.sepatuSaatPelayanan,
              salam: match.salamPrimaLingkunganRS,
              ethics: getEthicsFromRecord(match),
              shift: match.shift || globalShift,
              catatan: match.catatan || '',
              isSaved: true,
            };
          }
        } else {
          const current = next[staf.id];
          if (!current || current.isSaved) {
            changed = true;
            next[staf.id] = {
              seragam: 5,
              atribut: 5,
              sepatu: 5,
              salam: 5,
              ethics: getDefaultEthics(),
              shift: globalShift,
              catatan: '',
              isSaved: false,
            };
          }
        }
      });

      return changed ? next : prev;
    });
  }, [activeStaffList, unit.id, selectedDate, safeExistingRecords, globalShift]);

  const handleUpdateDraft = (staffId: string, field: keyof DraftRowState, value: any) => {
    setDrafts((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: value,
        isSaved: false, // mark as unsaved change
      },
    }));
  };

  const handleUpdateEthicsItem = (staffId: string, itemKey: BooleanKey, value: 'Ya' | 'Tidak') => {
    setDrafts((prev) => {
      const currentDraft = prev[staffId] || {
        seragam: 5,
        atribut: 5,
        sepatu: 5,
        salam: 5,
        ethics: getDefaultEthics(),
        shift: globalShift,
        catatan: '',
      };
      return {
        ...prev,
        [staffId]: {
          ...currentDraft,
          ethics: {
            ...currentDraft.ethics,
            [itemKey]: value,
          },
          isSaved: false,
        },
      };
    });
  };

  const handleSetAllEthics = (staffId: string, value: 'Ya' | 'Tidak') => {
    setDrafts((prev) => {
      const currentDraft = prev[staffId] || {
        seragam: 5,
        atribut: 5,
        sepatu: 5,
        salam: 5,
        ethics: getDefaultEthics(),
        shift: globalShift,
        catatan: '',
      };
      const allSet: Record<BooleanKey, 'Ya' | 'Tidak'> = {
        identitasIdCard: value,
        pinAtributLogo: value,
        menerapkanSalamPrima: value,
        seragamKerjaAturan: value,
        ramahSopanMenghormati: value,
        tanggungJawabJujurProfesional: value,
        tidakTerimaHadiah: value,
        pelayananSesuaiKewenangan: value,
        memenuhiPanggilanKedinasan: value,
        bekerjaPenuhTanggungJawab: value,
      };
      return {
        ...prev,
        [staffId]: {
          ...currentDraft,
          ethics: allSet,
          isSaved: false,
        },
      };
    });
  };

  const handleToggleDropdown = (staffId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openDropdownStaffId === staffId) {
      setOpenDropdownStaffId(null);
      return;
    }
    setOpenDropdownStaffId(staffId);
  };

  const handleSaveSingleRow = (staf: StaffMember) => {
    const draft = drafts[staf.id] || {
      seragam: 5,
      atribut: 5,
      sepatu: 5,
      salam: 5,
      ethics: getDefaultEthics(),
      shift: globalShift,
      catatan: '',
    };

    const ethics = draft.ethics || getDefaultEthics();

    // Find if already exists for this staff on this date
    const existing = safeExistingRecords.find(
      (r) =>
        r.unitId === unit.id &&
        ((r.nip && staf.nip && r.nip !== '-' && r.nip === staf.nip) ||
          r.nama.toLowerCase() === staf.nama.toLowerCase()) &&
        r.tanggal === selectedDate
    );

    const record: EvaluationRecord = {
      id: existing ? existing.id : `rec-${unit.id}-${staf.id}-${Date.now()}`,
      unitId: unit.id,
      unitNama: unit.nama,
      nama: staf.nama,
      nip: staf.nip,
      jabatan: staf.jabatan,
      tanggal: selectedDate,
      shift: draft.shift || globalShift,
      seragamSesuaiKetentuan: draft.seragam,
      atributKerjaSesuaiKetentuan: draft.atribut,
      sepatuSaatPelayanan: draft.sepatu,
      salamPrimaLingkunganRS: draft.salam,
      identitasIdCard: ethics.identitasIdCard,
      pinAtributLogo: ethics.pinAtributLogo || 'Ya',
      menerapkanSalamPrima: ethics.menerapkanSalamPrima,
      seragamKerjaAturan: ethics.seragamKerjaAturan,
      ramahSopanMenghormati: ethics.ramahSopanMenghormati,
      tanggungJawabJujurProfesional: ethics.tanggungJawabJujurProfesional,
      tidakTerimaHadiah: ethics.tidakTerimaHadiah,
      pelayananSesuaiKewenangan: ethics.pelayananSesuaiKewenangan,
      memenuhiPanggilanKedinasan: ethics.memenuhiPanggilanKedinasan,
      bekerjaPenuhTanggungJawab: ethics.bekerjaPenuhTanggungJawab,
      catatan: draft.catatan,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    onSaveRecord(record);

    setDrafts((prev) => ({
      ...prev,
      [staf.id]: {
        ...prev[staf.id],
        isSaved: true,
      },
    }));
  };

  // 1-Click: Grade all staff in this room as 5-star perfect compliance and save
  const handleRateAllPerfect = () => {
    if (activeStaffList.length === 0) {
      setShowAddStaffModal(true);
      return;
    }

    const updatedDrafts: Record<string, DraftRowState> = {};
    const recordsToSave: EvaluationRecord[] = [];

    activeStaffList.forEach((staf) => {
      updatedDrafts[staf.id] = {
        seragam: 5,
        atribut: 5,
        sepatu: 5,
        salam: 5,
        ethics: getDefaultEthics(),
        shift: globalShift,
        catatan: 'Penilaian apel / operan shift lengkap & disiplin',
        isSaved: true,
      };

      const existing = safeExistingRecords.find(
        (r) =>
          r.unitId === unit.id &&
          ((r.nip && staf.nip && r.nip !== '-' && r.nip === staf.nip) ||
            r.nama.toLowerCase() === staf.nama.toLowerCase()) &&
          r.tanggal === selectedDate
      );

      const record: EvaluationRecord = {
        id: existing ? existing.id : `rec-${unit.id}-${staf.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        unitId: unit.id,
        unitNama: unit.nama,
        nama: staf.nama,
        nip: staf.nip,
        jabatan: staf.jabatan,
        tanggal: selectedDate,
        shift: globalShift,
        seragamSesuaiKetentuan: 5,
        atributKerjaSesuaiKetentuan: 5,
        sepatuSaatPelayanan: 5,
        salamPrimaLingkunganRS: 5,
        identitasIdCard: 'Ya',
        pinAtributLogo: 'Ya',
        menerapkanSalamPrima: 'Ya',
        seragamKerjaAturan: 'Ya',
        ramahSopanMenghormati: 'Ya',
        tanggungJawabJujurProfesional: 'Ya',
        tidakTerimaHadiah: 'Ya',
        pelayananSesuaiKewenangan: 'Ya',
        memenuhiPanggilanKedinasan: 'Ya',
        bekerjaPenuhTanggungJawab: 'Ya',
        catatan: 'Penilaian apel / operan shift lengkap & disiplin',
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
      };

      if (onBulkSaveRecords) {
        recordsToSave.push(record);
      } else {
        onSaveRecord(record);
      }
    });

    if (onBulkSaveRecords && recordsToSave.length > 0) {
      onBulkSaveRecords(recordsToSave);
    }

    setDrafts(updatedDrafts);
  };

  const completedCount = activeStaffList.filter((s) => drafts[s.id]?.isSaved).length;
  const activeDropdownStaff = activeStaffList.find((s) => s.id === openDropdownStaffId);
  const activeDropdownEthics = activeDropdownStaff
    ? drafts[activeDropdownStaff.id]?.ethics || getDefaultEthics()
    : getDefaultEthics();
  const activeYaCount = Object.values(activeDropdownEthics).filter((v) => v === 'Ya').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0 relative">
      {/* Table Action Bar Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 via-slate-50 to-white border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
                <FileCheck className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Input Cepat Langsung di Tabel &mdash; {unit.nama}
              </h3>
            </div>
          </div>

          {/* Quick Date, Shift, Add Staff & 1-Click All Perfect Action */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="font-semibold text-slate-800 focus:outline-none bg-transparent cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={globalShift}
                onChange={(e) => setGlobalShift(e.target.value as any)}
                className="font-semibold text-slate-800 focus:outline-none bg-transparent cursor-pointer"
              >
                <option value="Pagi">Shift Pagi</option>
                <option value="Siang">Shift Siang</option>
                <option value="Malam">Shift Malam</option>
                <option value="Non-Shift">Non-Shift</option>
              </select>
            </div>

            <button
              id="btn-add-staff-inline"
              type="button"
              onClick={() => setShowAddStaffModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Tambah pegawai yang bertugas di unit ini"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Pegawai</span>
            </button>

            {activeStaffList.length > 0 && (
              <button
                id="btn-clear-staff-list"
                type="button"
                onClick={handleClearAllStaff}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Kosongkan seluruh daftar pegawai di ruangan ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kosongkan Pegawai</span>
              </button>
            )}

            <button
              id="btn-rate-all-perfect"
              type="button"
              onClick={handleRateAllPerfect}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Isi dan simpan semua pegawai ruangan dengan nilai sempurna 5★"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Nilai Semua 5★ (Sempurna)</span>
            </button>
          </div>
        </div>

        {/* Progress Pill Bar */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Status Penilaian Hari Ini:</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              {completedCount} dari {activeStaffList.length} Staf Dinilai
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tersimpan
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Belum Disimpan
            </span>
          </div>
        </div>
      </div>

      {/* Direct Interactive Table Container (Responsive with smooth horizontal scroll) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4 min-w-[200px]">Pegawai & Jabatan</th>
              <th className="py-3 px-3 text-center min-w-[150px]">
                {evalElements.scale[0].title}
                <span className="block text-[9px] font-normal normal-case text-slate-500">{evalElements.scale[0].subtitle}</span>
              </th>
              <th className="py-3 px-3 text-center min-w-[150px]">
                {evalElements.scale[1].title}
                <span className="block text-[9px] font-normal normal-case text-slate-500">{evalElements.scale[1].subtitle}</span>
              </th>
              <th className="py-3 px-3 text-center min-w-[150px]">
                {evalElements.scale[2].title}
                <span className="block text-[9px] font-normal normal-case text-slate-500">{evalElements.scale[2].subtitle}</span>
              </th>
              <th className="py-3 px-3 text-center min-w-[150px]">
                {evalElements.scale[3].title}
                <span className="block text-[9px] font-normal normal-case text-slate-500">{evalElements.scale[3].subtitle}</span>
              </th>
              <th className="py-3 px-3 text-center min-w-[130px]">
                {evalElements.booleanTitle}
                <span className="block text-[9px] font-normal normal-case text-slate-500">{evalElements.booleanSubtitle}</span>
              </th>
              <th className="py-3 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {activeStaffList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 px-4 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Belum Ada Daftar Pegawai di {unit.nama}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sistem ini bersih tanpa data contoh pegawai dummy. Silakan tambahkan nama pegawai riil yang berdinas di ruangan ini untuk langsung dinilai.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddStaffModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Tambah Pegawai di Ruangan Ini</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              activeStaffList.map((staf, idx) => {
              const draft = drafts[staf.id] || {
                seragam: 5,
                atribut: 5,
                sepatu: 5,
                salam: 5,
                ethics: getDefaultEthics(),
                shift: globalShift,
                catatan: '',
                isSaved: false,
              };

              const ethics = draft.ethics || getDefaultEthics();
              const yaCount = Object.values(ethics).filter((v) => v === 'Ya').length;
              const avgScore = ((draft.seragam + draft.atribut + draft.sepatu + draft.salam) / 4).toFixed(1);
              const isPerfect = Number(avgScore) === 5 && yaCount === 9;

              return (
                <tr
                  key={staf.id}
                  className={`transition-colors ${
                    draft.isSaved ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Row No */}
                  <td className="py-3 px-4 text-center font-medium text-slate-500 text-xs">
                    {idx + 1}
                  </td>

                  {/* Staff Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                        {staf.nama.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{staf.nama}</span>
                          {draft.isSaved && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {staf.jabatan}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIP. {staf.nip}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 1. Seragam Rating (1-5 buttons) */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleUpdateDraft(staf.id, 'seragam', val)}
                          className={`w-6 h-6 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            draft.seragam === val
                              ? val >= 4
                                ? 'bg-emerald-600 text-white shadow-2xs scale-105'
                                : 'bg-amber-500 text-white shadow-2xs scale-105'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`Nilai ${val} dari 5`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* 2. Atribut Rating (1-5 buttons) */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleUpdateDraft(staf.id, 'atribut', val)}
                          className={`w-6 h-6 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            draft.atribut === val
                              ? val >= 4
                                ? 'bg-emerald-600 text-white shadow-2xs scale-105'
                                : 'bg-amber-500 text-white shadow-2xs scale-105'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`Nilai ${val} dari 5`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* 3. Sepatu Rating (1-5 buttons) */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleUpdateDraft(staf.id, 'sepatu', val)}
                          className={`w-6 h-6 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            draft.sepatu === val
                              ? val >= 4
                                ? 'bg-emerald-600 text-white shadow-2xs scale-105'
                                : 'bg-amber-500 text-white shadow-2xs scale-105'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`Nilai ${val} dari 5`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* 4. Salam Prima Rating (1-5 buttons) */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleUpdateDraft(staf.id, 'salam', val)}
                          className={`w-6 h-6 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            draft.salam === val
                              ? val >= 4
                                ? 'bg-emerald-600 text-white shadow-2xs scale-105'
                                : 'bg-amber-500 text-white shadow-2xs scale-105'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`Nilai ${val} dari 5`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* 5. Nilai Etika Dropdown Checklist Trigger */}
                  <td className="py-3 px-3 text-center">
                    <button
                      id={`btn-ethics-dropdown-${staf.id}`}
                      type="button"
                      onClick={(e) => handleToggleDropdown(staf.id, e)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                        yaCount === evalElements.booleans.length
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 active:bg-emerald-200'
                          : yaCount >= Math.ceil(evalElements.booleans.length * 0.75)
                          ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 active:bg-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 active:bg-rose-200'
                      }`}
                      title={`Klik untuk membuka dropdown checklist Ya / Tidak ${evalElements.booleans.length} Nilai Etika`}
                    >
                      <span>
                        {yaCount === evalElements.booleans.length
                          ? `✓ ${yaCount}/${evalElements.booleans.length} Patuh`
                          : `⚠ ${yaCount}/${evalElements.booleans.length} Patuh`}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          openDropdownStaffId === staf.id ? 'rotate-180 text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Row Action: Save Row & Delete Staff */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSaveSingleRow(staf)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          draft.isSaved
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-2xs'
                        }`}
                        title="Simpan nilai baris pegawai ini"
                      >
                        {draft.isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Disimpan</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staf.id, staf.nama)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={`Hapus ${staf.nama} dari daftar ruangan`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Floating Dropdown Popover for 9 Nilai Etika Ya/Tidak Checklist */}
      {openDropdownStaffId && activeDropdownStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setOpenDropdownStaffId(null)}
          />

          <div
            id="ethics-dropdown-checklist"
            className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col w-full max-w-md max-h-[85vh]"
          >
            {/* Dropdown Header */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-slate-50 to-white border-b border-slate-200 shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-600 text-white rounded-xl shadow-2xs">
                    <ListChecks className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Checklist {evalElements.booleanTitle}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-semibold truncate max-w-[240px]">
                      {activeDropdownStaff.nama} &bull; <span className="font-normal text-slate-400">{activeDropdownStaff.jabatan}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenDropdownStaffId(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                  title="Tutup checklist"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            {/* Quick Summary & All Ya / All Tidak Bulk Buttons */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  activeYaCount === 9
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeYaCount >= 7
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {activeYaCount === 9 ? '✓ 9/9 Lengkap (Patuh)' : `⚠ ${activeYaCount}/9 Kriteria Terpenuhi`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetAllEthics(activeDropdownStaff.id, 'Ya')}
                  className="px-2 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Ubah semua 9 kriteria menjadi 'Ya'"
                >
                  <Check className="w-3 h-3" />
                  <span>Semua Ya</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllEthics(activeDropdownStaff.id, 'Tidak')}
                  className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Ubah semua 9 kriteria menjadi 'Tidak'"
                >
                  <X className="w-3 h-3" />
                  <span>Semua Tidak</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Checklist Body with 9 Items */}
          <div className="p-2 space-y-1 overflow-y-auto max-h-[350px] divide-y divide-slate-100 scrollbar-thin">
            {evalElements.booleans.map((item, idx) => {
              const currentVal = activeDropdownEthics[item.id as BooleanKey] || 'Ya';
              const isYes = currentVal === 'Ya';

              return (
                <div
                  key={item.id}
                  className={`p-2 rounded-xl transition-all flex items-center justify-between gap-2.5 ${
                    isYes ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/70'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span
                      className={`text-[10px] font-bold w-4 pt-0.5 shrink-0 text-right ${
                        isYes ? 'text-slate-400' : 'text-rose-500 font-bold'
                      }`}
                    >
                      {idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold leading-snug ${
                          isYes ? 'text-slate-800' : 'text-rose-900 font-bold'
                        }`}
                      >
                        {item.shortLabel}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                        {item.label}
                      </p>
                    </div>
                  </div>

                  {/* Segmented Ya / Tidak Toggle Pill */}
                  <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl shrink-0 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleUpdateEthicsItem(activeDropdownStaff.id, item.id as BooleanKey, 'Ya')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        isYes
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Pilih Ya (Memenuhi kriteria)"
                    >
                      <Check className="w-3 h-3" />
                      <span>Ya</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateEthicsItem(activeDropdownStaff.id, item.id as BooleanKey, 'Tidak')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        !isYes
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Pilih Tidak (Tidak memenuhi kriteria)"
                    >
                      <X className="w-3 h-3" />
                      <span>Tidak</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dropdown Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-500 font-medium">
              Kepatuhan Etika: <strong className="text-slate-800">{Math.round((activeYaCount / 9) * 100)}%</strong>
              {activeYaCount < 9 && (
                <span className="text-rose-600 font-bold ml-1">({9 - activeYaCount} kriteria Tidak)</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setOpenDropdownStaffId(null);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Selesai</span>
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>
            Penilaian diverifikasi langsung oleh <strong>{unit.kepalaRuangan ? `${unit.kepalaRuangan} (Kepala ${unit.nama})` : `Kepala ${unit.nama}`}</strong> untuk akreditasi rumah sakit.
          </span>
        </div>
        <div className="font-semibold text-slate-700">
          Total Staf Ruangan: <span className="text-blue-700">{activeStaffList.length} orang</span>
        </div>
      </div>

      {/* Modal Tambah Pegawai Baru Ruangan */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Tambah Pegawai Ruangan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {unit.nama}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pegawai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth: Ns. Nama Lengkap, S.Kep atau dr. Nama, Sp.X"
                  value={newStaffNama}
                  onChange={(e) => setNewStaffNama(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan / Profesi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="cth: Perawat Pelaksana / Dokter Jaga / Bidan"
                  value={newStaffJabatan}
                  onChange={(e) => setNewStaffJabatan(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP / Nomor Identitas Pegawai (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="cth: 19900101 202001 1 001"
                  value={newStaffNip}
                  onChange={(e) => setNewStaffNip(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Pegawai</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
    </div>
  );
};
