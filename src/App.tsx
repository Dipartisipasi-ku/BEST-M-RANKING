import React, { useState, useEffect, useMemo } from 'react';
import { Unit, EvaluationRecord, AuthSession, StaffMember } from './types';
import { INITIAL_UNITS, INITIAL_RECORDS, UNIT_STAFF_ROSTER } from './data/initialData';
import { StatsCards } from './components/StatsCards';
import { EvaluationTable } from './components/EvaluationTable';
import { EvaluationFormModal } from './components/EvaluationFormModal';
import { AddUnitModal } from './components/AddUnitModal';
import { MasterUnitsModal } from './components/MasterUnitsModal';
import { PrintReportView } from './components/PrintReportView';
import { SupabaseRbacModal } from './components/SupabaseRbacModal';
import { LoginPage } from './components/LoginPage';
import { QuickDirectTable } from './components/QuickDirectTable';
import { AppLayout } from './components/AppLayout';
import { ConfirmModal } from './components/ConfirmModal';
import { exportToCSV } from './utils/exportUtils';
import {
  supabase,
  isSupabaseConfigured,
  AppRole,
  ROLE_LABELS,
  mapRowToEvaluationRecord,
  mapRecordToDBRow,
} from './lib/supabase_config';
import {
  loadRbacPermissions, getStoredRbacPermissions,
  saveRbacPermissions,
  hasRolePermission,
  RolePermissions,
} from './lib/rbac_config';
import {
  Building2,
  Plus,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  CheckCircle,
  Hospital,
  ShieldCheck,
  FolderPlus,
  UserCheck,
  Database,
  Shield,
  Cloud,
  MoreVertical,
  ChevronDown,
  Menu,
  X,
  Stethoscope,
  Sparkles,
  Info,
  Pencil,
} from 'lucide-react';

const STORAGE_UNITS_KEY = 'hospital_eval_units_v3';
const STORAGE_RECORDS_KEY = 'hospital_eval_records_v3';
const STORAGE_ROLE_KEY = 'hospital_eval_active_role_v3';
const STORAGE_SESSION_KEY = 'hospital_eval_auth_session_v3';

// Load stored units from localStorage or fallback to INITIAL_UNITS
const loadStoredUnits = (): Unit[] => {
  const tryParse = (raw: string | null): Unit[] | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return null;
  };

  const saved = tryParse(localStorage.getItem(STORAGE_UNITS_KEY));
  if (saved !== null) return saved;
  return INITIAL_UNITS;
};

const DUMMY_NAMES_BLACKLIST = [
  'mega utami',
  'fitria indah',
  'surya pratama',
  'budi santoso',
  'ahmad fauzi',
  'ratna wulandari',
  'bagus pratama',
  'hendra setiawan',
  'dewi sartika',
];

const isDummyRecord = (r: any): boolean => {
  if (!r || !r.id) return true;
  if (/^rec-[1-9][0-2]?$/.test(r.id)) return true;
  const nameLower = (r.nama || '').toLowerCase();
  if (DUMMY_NAMES_BLACKLIST.some((d) => nameLower.includes(d))) return true;
  return false;
};

export default function App() {
  // Authentication session (Kepala Ruangan, Komite Mutu, Super Admin)
  const [session, setSession] = useState<AuthSession | null>(null);

  // Active RBAC Role derived from session or fallback
  const [activeRole, setActiveRole] = useState<AppRole>(() => {
    return session ? session.role : 'kepala_ruangan';
  });

  // View mode: 'quick_direct' (input langsung di tabel) | 'cards' (kartu mobile) | 'table' (tabel akreditasi lengkap)
  const [viewMode, setViewMode] = useState<'quick_direct' | 'cards' | 'table'>('quick_direct');

  // Load state from localStorage or use initial defaults (38 Master Units from Images)
  const [units, setUnits] = useState<Unit[]>(() => loadStoredUnits());

  const [records, setRecords] = useState<EvaluationRecord[]>(() => {
    const PURGE_FLAG_KEY = 'purged_dummy_records_v7_clean';
    if (!localStorage.getItem(PURGE_FLAG_KEY)) {
      try {
        localStorage.removeItem(STORAGE_RECORDS_KEY);
        localStorage.removeItem('hospital_eval_records_v1');
        localStorage.removeItem('hospital_eval_records_v2');
        localStorage.removeItem('evaluation_records');
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('unit_staff_')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem(PURGE_FLAG_KEY, 'true');
      } catch (e) {}
      return [];
    }

    const saved = localStorage.getItem(STORAGE_RECORDS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((r: any) => !isDummyRecord(r));
        }
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    return [];
  });

  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => {
    return session && session.unitId ? session.unitId : 'igd';
  });

  // Global evaluation date state synchronized with QuickDirectTable & StatsCards
  const [evaluationDate, setEvaluationDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // State to trigger staff list refresh across components when modified in QuickDirectTable
  const [staffVersion, setStaffVersion] = useState(0);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EvaluationRecord | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isMasterUnitsModalOpen, setIsMasterUnitsModalOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };

  // Dynamic RBAC Permissions Matrix (Editable by Super Admin only)
  const [rbacPermissions, setRbacPermissions] = useState<any>(() => getStoredRbacPermissions());

  useEffect(() => {
    loadRbacPermissions().then(perms => setRbacPermissions(perms));
  }, []);

  const handleUpdateRbacPermissions = (newPerms: any) => {
    setRbacPermissions(newPerms);
    saveRbacPermissions(newPerms);
  };

  // Sync session changes
  useEffect(() => {
    const checkAuth = async () => {
      if (supabase) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
          if (profile) {
            setSession({
              role: profile.role,
              unitId: profile.unit_id || 'all',
              unitNama: units.find((u: Unit) => u.id === profile.unit_id)?.nama || 'Semua Unit',
              userName: profile.full_name,
              nip: profile.nip,
              jabatan: profile.jabatan
            });
          }
        }
      }
    };
    checkAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
        } else if (currentSession?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
          if (profile) {
            setSession({
              role: profile.role,
              unitId: profile.unit_id || 'all',
              unitNama: units.find((u: Unit) => u.id === profile.unit_id)?.nama || 'Semua Unit',
              userName: profile.full_name,
              nip: profile.nip,
              jabatan: profile.jabatan
            });
          }
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [units]);
  
  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
      setActiveRole(session.role);
      if (session.role === 'kepala_ruangan') {
        setSelectedUnitId(session.unitId);
        setViewMode('quick_direct');
      } else if (session.role === 'staf_pegawai') {
        setSelectedUnitId(session.unitId);
        setViewMode('table');
      }
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  }, [session]);

  // Sync session unitNama and userName if the active unit is edited
  useEffect(() => {
    if (session && session.role === 'kepala_ruangan' && session.unitId) {
      const match = units.find((u) => u.id === session.unitId);
      if (match) {
        let shouldUpdate = false;
        let newUnitNama = session.unitNama;
        let newUserName = session.userName;

        if (match.nama && match.nama !== session.unitNama) {
          newUnitNama = match.nama;
          shouldUpdate = true;
        }
        if (match.kepalaRuangan && (session.userName.startsWith('Kepala ') || !session.userName) && match.kepalaRuangan !== session.userName) {
          newUserName = match.kepalaRuangan;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          const updated = {
            ...session,
            unitNama: newUnitNama,
            userName: newUserName,
            jabatan: `Kepala ${newUnitNama}`,
          };
          setSession(updated);
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updated));
        }
      }
    }
  }, [units, session?.unitId]);

  // Sync units to localStorage across all keys
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(units));
      localStorage.setItem('units_data', JSON.stringify(units));
    } catch (e) {}
  }, [units]);

  useEffect(() => {
    localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  // Clean up any legacy dummy records & session from localStorage immediately on mount
  useEffect(() => {
    try {
      const rawRecords = localStorage.getItem(STORAGE_RECORDS_KEY);
      if (rawRecords) {
        const parsed = JSON.parse(rawRecords);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter((r: any) => !isDummyRecord(r));
          if (sanitized.length !== parsed.length) {
            localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(sanitized));
            setRecords(sanitized);
          }
        }
      }

      // Sanitize staff roster in localStorage if any dummy name exists
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('unit_staff_')) {
          try {
            const rawStaff = localStorage.getItem(key);
            if (rawStaff) {
              const parsedStaff = JSON.parse(rawStaff);
              if (Array.isArray(parsedStaff)) {
                const cleanStaff = parsedStaff.filter((s: any) => {
                  if (!s || !s.nama) return false;
                  const lower = s.nama.toLowerCase();
                  return !DUMMY_NAMES_BLACKLIST.some((d) => lower.includes(d));
                });
                if (cleanStaff.length !== parsedStaff.length) {
                  localStorage.setItem(key, JSON.stringify(cleanStaff));
                }
              }
            }
          } catch (e) {}
        }
      });

      // Sanitize old session if it contains dr. Hendra Setiawan or any dummy name
      const rawSession = localStorage.getItem(STORAGE_SESSION_KEY);
      if (rawSession) {
        const sess = JSON.parse(rawSession);
        if (sess && sess.userName && (sess.userName.includes('Hendra Setiawan') || DUMMY_NAMES_BLACKLIST.some(d => sess.userName.toLowerCase().includes(d)))) {
          const cleanSess = {
            ...sess,
            userName: `Kepala ${sess.unitNama || 'Ruangan'}`,
            nip: '',
          };
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(cleanSess));
          setSession(cleanSess);
        }
      }

      if (localStorage.getItem('evaluation_records')) {
        localStorage.removeItem('evaluation_records');
      }
      if (localStorage.getItem('hospital_eval_records_v1')) {
        localStorage.removeItem('hospital_eval_records_v1');
      }
      if (localStorage.getItem('hospital_eval_records_v2')) {
        localStorage.removeItem('hospital_eval_records_v2');
      }
    } catch (err) {
      console.warn('Storage cleanup error:', err);
    }
  }, []);

  // Optional: Load live data from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    async function loadFromSupabase() {
      try {
        const { data: remoteUnits, error: unitError } = await supabase!
          .from('units')
          .select('*')
          .order('nama', { ascending: true });

        if (!unitError && remoteUnits && remoteUnits.length === 0) {
          // Auto-seed to Supabase if empty (helps fresh DBs)
          const seedPayload = INITIAL_UNITS.map(u => ({
            id: u.id,
            nama: u.nama,
            kategori: u.kategori,
            lokasi: u.lokasi || null,
            kepala_ruangan: u.kepalaRuangan || null,
          }));
          const { error: seedErr } = await supabase!.from('units').upsert(seedPayload);
          if (seedErr) {
             console.error('Failed to auto-seed units:', seedErr);
          } else {
             console.log('Successfully auto-seeded units to Supabase');
          }
        }
        
        if (!unitError && remoteUnits && remoteUnits.length > 0) {
          const mappedUnits: Unit[] = remoteUnits.map((u: any) => ({
            id: u.id,
            nama: u.nama,
            kategori: u.kategori || 'Ruangan',
            lokasi: u.lokasi || undefined,
            kepalaRuangan: u.kepala_ruangan || undefined,
          }));
          setUnits(mappedUnits);
        }

        const { data: remoteRecords, error: recordError } = await supabase!
          .from('evaluation_records')
          .select('*')
          .order('tanggal', { ascending: false });

        if (!recordError && remoteRecords && remoteRecords.length > 0) {
          setRecords(remoteRecords.map(mapRowToEvaluationRecord));
        }
      } catch (err) {
        console.warn('Could not sync from remote Supabase, running with local data:', err);
      }
    }

    loadFromSupabase();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Selected Unit object
  const activeUnit = useMemo(() => {
    return (units || []).find((u) => u.id === selectedUnitId);
  }, [units, selectedUnitId]);

  // Strict RBAC Role & Permission checks
  const isSuperAdmin = session?.role === 'super_admin';
  const canManageRbac = isSuperAdmin && hasRolePermission(isSuperAdmin ? 'super_admin' : activeRole, 'canManageUsers');

  const canAddEvaluation = activeRole === 'kepala_ruangan'
    ? hasRolePermission(activeRole, 'canSubmitEvals')
    : (hasRolePermission(activeRole, 'canSubmitEvals') || hasRolePermission(activeRole, 'canSubmitEvals'));

  const canManageUnits = hasRolePermission(activeRole, 'canManageUnits');

  const canEditRecord = (record: EvaluationRecord) => {
    if (hasRolePermission(activeRole, 'canEditAnyEval')) return true;
    if (hasRolePermission(activeRole, 'canEditAnyEval')) {
      return selectedUnitId === 'all' || record.unitId === selectedUnitId;
    }
    return false;
  };

  const canDeleteRecord = hasRolePermission(activeRole, 'canDeleteAnyEval');
  const canExportCSV = hasRolePermission(activeRole, 'canExportData');
  const canPrintReports = hasRolePermission(activeRole, 'canExportData');

  const handleOpenRbacModal = () => {
    if (session?.role !== 'super_admin') {
      showToast('Akses Ditolak: Hanya Super Admin yang berhak mengakses dan mengedit pengaturan RBAC.');
      return;
    }
    setIsSupabaseModalOpen(true);
  };

  // Filtered records by unit
  const filteredRecords = useMemo(() => {
    let filtered = records;
    if (selectedUnitId !== 'all') {
      filtered = filtered.filter((r) => r.unitId === selectedUnitId);
    }
    
    // Khusus Staf Pegawai: Hanya bisa melihat data dirinya sendiri (sesuai nama akun)
    if (activeRole === 'staf_pegawai') {
      filtered = filtered.filter((r) => r.nama === session?.userName);
    }
    
    return filtered;
  }, [records, selectedUnitId, activeRole, session?.userName]);

  // Handle Save Record (Create or Update)
  const handleSaveRecord = async (savedRecord: EvaluationRecord) => {
    setRecords((prev) => {
      const existsIndex = prev.findIndex(
        (r) =>
          r.id === savedRecord.id ||
          (r.unitId === savedRecord.unitId &&
            ((r.nip && savedRecord.nip && r.nip !== '-' && r.nip === savedRecord.nip) ||
              r.nama.toLowerCase() === savedRecord.nama.toLowerCase()) &&
            r.tanggal === savedRecord.tanggal)
      );
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = savedRecord;
        return updated;
      }
      return [savedRecord, ...prev];
    });

    // Remote sync if Supabase is connected
    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = mapRecordToDBRow(savedRecord);
        const { error } = await supabase.from('evaluation_records').upsert(dbPayload);
        if (error) {
          console.error('Supabase upsert error:', error);
          showToast('Gagal sinkronisasi ke Supabase: ' + error.message);
        }
      } catch (err) {
        console.error('Supabase upsert error:', err);
      }
    }

    showToast(
      editingRecord
        ? `Evaluasi untuk ${savedRecord.nama} berhasil diperbarui.`
        : `Evaluasi untuk ${savedRecord.nama} berhasil disimpan!`
    );
    setEditingRecord(null);
  };

  // Handle Delete Record
  const handleDeleteRecord = async (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));

    // Remote sync if Supabase is connected
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('evaluation_records').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete error:', error);
          showToast('Gagal hapus di Supabase: ' + error.message);
        }
      } catch (err) {
        console.error('Supabase delete error:', err);
      }
    }

    showToast('Data evaluasi pegawai berhasil dihapus.');
  };

  // Handle Add New Unit
  const handleAddUnit = async (newUnit: Unit) => {
    const nextUnits = [...units, newUnit];
    setUnits(nextUnits);
    try {
      localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(nextUnits));
      localStorage.setItem('units_data', JSON.stringify(nextUnits));
    } catch (e) {}
    setSelectedUnitId(newUnit.id);

    // Remote sync if Supabase is connected
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('units').upsert({
          id: newUnit.id,
          nama: newUnit.nama,
          kategori: newUnit.kategori,
          lokasi: newUnit.lokasi || null,
          kepala_ruangan: newUnit.kepalaRuangan || null,
        });
        if (error) {
          console.error('Supabase unit insert error:', error);
          showToast('Gagal simpan unit ke Supabase: ' + error.message);
        }
      } catch (err) {
        console.error('Supabase unit insert error:', err);
      }
    }

    showToast(`Unit "${newUnit.nama}" berhasil ditambahkan.`);
    setIsUnitModalOpen(false);
    setUnitToEdit(null);
  };

  // Handle Update Unit (Edit Nama Ruangan & Kepala Ruangan)
  const handleUpdateUnit = async (updatedUnit: Unit) => {
    const nextUnits = units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
    setUnits(nextUnits);
    try {
      localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(nextUnits));
      localStorage.setItem('units_data', JSON.stringify(nextUnits));
    } catch (e) {}

    // Update active session if it matches this unit
    if (session && session.unitId === updatedUnit.id) {
      const updatedSession: AuthSession = {
        ...session,
        unitNama: updatedUnit.nama,
        userName: updatedUnit.kepalaRuangan || session.userName,
        jabatan: `Kepala ${updatedUnit.nama}`,
      };
      setSession(updatedSession);
      try {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedSession));
      } catch (e) {}
    }

    // Remote sync if Supabase is connected
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('units').upsert({
          id: updatedUnit.id,
          nama: updatedUnit.nama,
          kategori: updatedUnit.kategori,
          lokasi: updatedUnit.lokasi || null,
          kepala_ruangan: updatedUnit.kepalaRuangan || null,
        });
        if (error) {
          console.error('Supabase unit update error:', error);
          showToast('Gagal update unit ke Supabase: ' + error.message);
        }
      } catch (err) {
        console.error('Supabase unit update error:', err);
      }
    }

    showToast(`Data ruangan "${updatedUnit.nama}" dan Kepala Ruangan berhasil disimpan!`);
    setIsUnitModalOpen(false);
    setUnitToEdit(null);
  };

  const handleOpenEditUnit = (unit: Unit) => {
    setUnitToEdit(unit);
    setIsUnitModalOpen(true);
  };

  const handleOpenAddUnit = () => {
    setUnitToEdit(null);
    setIsUnitModalOpen(true);
  };

  const handleDeleteUnit = async (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;
    showConfirm(
      'Hapus Unit',
      `Hapus unit "${unit.nama}" dari sistem?`,
      async () => {
      const nextUnits = units.filter((u) => u.id !== unitId);
      setUnits(nextUnits);
      try {
        localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(nextUnits));
        localStorage.setItem('units_data', JSON.stringify(nextUnits));
      } catch (e) {}

      if (selectedUnitId === unitId) {
        setSelectedUnitId(nextUnits[0]?.id || 'all');
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from('units').delete().eq('id', unitId);
          if (error) {
            console.error('Supabase unit delete error:', error);
            showToast('Gagal hapus unit di Supabase: ' + error.message);
          }
        } catch (err) {
          console.error('Supabase unit delete error:', err);
        }
      }

      showToast(`Unit "${unit.nama}" berhasil dihapus.`);
      }
    );
  };

  const handleResetUnits = () => {
    showConfirm(
      'Reset Master Ruangan',
      'Reset daftar master ruangan ke 38 unit standar rumah sakit?',
      () => {
      setUnits(INITIAL_UNITS);
      try {
        localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(INITIAL_UNITS));
        localStorage.setItem('units_data', JSON.stringify(INITIAL_UNITS));
      } catch (e) {}
      showToast('Daftar ruangan berhasil direset ke 38 unit standar.');
      }
    );
  };

  // Bersihkan data evaluasi & penyimpanan lokal (0 data dummy)
  const handleResetData = () => {
    showConfirm(
      'Bersihkan Data Evaluasi',
      'Seluruh data evaluasi akan dikosongkan secara total (0 data). Lanjutkan?',
      () => {
      setRecords([]);
      setSelectedUnitId('all');
      localStorage.removeItem(STORAGE_RECORDS_KEY);
      localStorage.removeItem('hospital_eval_records_v1');
      localStorage.removeItem('hospital_eval_records_v2');
      localStorage.removeItem('evaluation_records');
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('unit_staff_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {}
      showToast('Seluruh data evaluasi & penyimpanan lokal berhasil dibersihkan (0 data).');
      }
    );
  };

  // Export filtered view to CSV
  const handleExportCSV = () => {
    const unitTitle = activeUnit ? activeUnit.nama : 'Semua-Unit-RS';
    exportToCSV(filteredRecords, unitTitle);
    showToast('Data rekap evaluasi berhasil diekspor ke format Excel/CSV!');
  };

  // Import evaluation records from CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    import('papaparse').then((Papa) => {
      Papa.default.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const importedRecords: EvaluationRecord[] = (results.data as any[]).map((row: any) => ({
              id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              unitId: selectedUnitId !== 'all' ? selectedUnitId : (units[0]?.id || 'igd'),
              unitNama: activeUnit?.nama || 'RS',
              nama: row['Nama Pegawai'] || row['Nama'] || row['Nama Staf'] || 'Pegawai',
              nip: row['NIP'] || '',
              jabatan: row['Jabatan'] || row['Profesi'] || 'Staf Medis',
              tanggal: row['Tanggal Penilaian'] || row['Tanggal'] || new Date().toISOString().split('T')[0],
              shift: (row['Shift'] as any) || 'Pagi',
              // Numbers
              seragamSesuaiKetentuan: Number(row['Seragam Sesuai Ketentuan']) || Number(row['Seragam']) || 4,
              atributKerjaSesuaiKetentuan: Number(row['Atribut Kerja Sesuai Ketentuan']) || Number(row['Atribut']) || 4,
              sepatuSaatPelayanan: Number(row['Sepatu Saat Pelayanan']) || Number(row['Sepatu Standar']) || 4,
              salamPrimaLingkunganRS: Number(row['Salam Prima Lingkungan RS']) || Number(row['Salam Prima']) || 4,
              // Booleans (Ya / Tidak)
              identitasIdCard: row['ID Card'] === 'Tidak' || row['identitasIdCard'] === 'Tidak' ? 'Tidak' : 'Ya',
              menerapkanSalamPrima: row['Menerapkan Salam Prima'] === 'Tidak' ? 'Tidak' : 'Ya',
              seragamKerjaAturan: row['Seragam Kerja Aturan'] === 'Tidak' ? 'Tidak' : 'Ya',
              ramahSopanMenghormati: row['Ramah Sopan'] === 'Tidak' ? 'Tidak' : 'Ya',
              tanggungJawabJujurProfesional: row['Tanggung Jawab Profesional'] === 'Tidak' ? 'Tidak' : 'Ya',
              tidakTerimaHadiah: row['Tidak Terima Hadiah'] === 'Tidak' ? 'Tidak' : 'Ya',
              pelayananSesuaiKewenangan: row['Pelayanan Sesuai Kewenangan'] === 'Tidak' ? 'Tidak' : 'Ya',
              memenuhiPanggilanKedinasan: row['Memenuhi Panggilan Kedinasan'] === 'Tidak' ? 'Tidak' : 'Ya',
              bekerjaPenuhTanggungJawab: row['Bekerja Penuh Tanggung Jawab'] === 'Tidak' ? 'Tidak' : 'Ya',
              catatan: row['Catatan'] || '',
              createdAt: new Date().toISOString(),
            }));
            const newRecords = [...importedRecords, ...records];
            setRecords(newRecords);
            localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(newRecords));
            showToast(`${importedRecords.length} data evaluasi berhasil diimpor!`);
          } catch (err) {
            showToast('Format CSV tidak sesuai.');
          }
        },
        error: () => {
          showToast('Gagal membaca file CSV.');
        }
      });
    });

    e.target.value = '';
  };

  // Staff roster for active unit (filtered specifically to this room/unit/installation)
  // Unified single-source-of-truth from: localStorage (unit_staff_...) + UNIT_STAFF_ROSTER + historical records
  const currentStaffList = useMemo(() => {
    if (!activeUnit) return [];

    let dynamicStaff: StaffMember[] = [];
    try {
      const saved = localStorage.getItem(`unit_staff_${activeUnit.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          dynamicStaff = parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }

    const predefined = UNIT_STAFF_ROSTER[activeUnit.id] || [];

    const map = new Map<string, StaffMember>();
    predefined.forEach((s) => map.set(s.nama.toLowerCase(), s));
    dynamicStaff.forEach((s) => {
      if (!map.has(s.nama.toLowerCase())) {
        map.set(s.nama.toLowerCase(), s);
      }
    });

    // Also include any staff with existing records for this unit
    const unitRecords = records.filter((r) => r.unitId === activeUnit.id);
    unitRecords.forEach((r, idx) => {
      const key = r.nama.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: `staf-${activeUnit.id}-${idx}`,
          unitId: activeUnit.id,
          nama: r.nama,
          nip: r.nip || '-',
          jabatan: r.jabatan || 'Staf Ruangan',
        });
      }
    });

    return Array.from(map.values());
  }, [activeUnit, records, staffVersion]);

  // Bulk save for 1-click room rating
  const handleBulkSaveRecords = async (bulkRecords: EvaluationRecord[]) => {
    setRecords((prev) => {
      const copy = [...prev];
      bulkRecords.forEach((item) => {
        const idx = copy.findIndex(
          (r) =>
            r.id === item.id ||
            (r.unitId === item.unitId &&
              ((r.nip && item.nip && r.nip !== '-' && r.nip === item.nip) ||
                r.nama.toLowerCase() === item.nama.toLowerCase()) &&
              r.tanggal === item.tanggal)
        );
        if (idx >= 0) {
          copy[idx] = item;
        } else {
          copy.unshift(item);
        }
      });
      return copy;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const payloads = bulkRecords.map((r) => mapRecordToDBRow(r));
        const { error } = await supabase.from('evaluation_records').upsert(payloads);
        if (error) {
          console.error('Supabase bulk upsert error:', error);
          showToast('Gagal bulk save ke Supabase: ' + error.message);
        }
      } catch (err) {
        console.error('Supabase bulk upsert error:', err);
      }
    }

    showToast(`Berhasil menyimpan nilai untuk ${bulkRecords.length} pegawai ruangan!`);
  };

  // If not logged in, render the dedicated Login Page for Kepala Ruangan & Komite
  if (!session) {
    return (
      <LoginPage
        units={units}
        onLogin={(newSession) => {
          setSession(newSession);
          showToast(`Selamat datang, ${newSession.userName}!`);
        }}
        onExplorePublic={() => {
          setSession({
            role: 'staf_pegawai',
            unitId: 'all',
            unitNama: 'Seluruh Ruangan RS',
            userName: 'Tamu / Staf Pengamat',
          });
          showToast('Masuk dalam Mode Publik / Staf Pegawai');
        }}
      />
    );
  }

  const isKepalaRuangan = activeRole === 'kepala_ruangan';

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Adaptive Responsive & Rotation-Aware Header Toolbar */}
            <AppLayout
        session={session}
        onLogout={() => {
          setSession(null);
          showToast('Anda telah keluar dari sesi.');
        }}
        onOpenSupabase={handleOpenRbacModal}
        onOpenMasterUnits={() => setIsMasterUnitsModalOpen(true)}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onExportCSV={handleExportCSV}
        onResetData={handleResetData}
        isSupabaseConfigured={isSupabaseConfigured}
        canManageRbac={canManageRbac}
        canManageUnits={canManageUnits}
        canExportCSV={canExportCSV}
        canPrintReports={canPrintReports}
        viewMode={viewMode}
        onChangeViewMode={activeRole !== 'staf_pegawai' ? setViewMode : undefined}
      >
        <div className="max-w-7xl w-full mx-auto space-y-3 sm:space-y-4 pb-24">

        {/* Context Banner: Kepala Ruangan or Unit Selector */}
        {isKepalaRuangan || activeRole === 'staf_pegawai' ? (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-white/15 backdrop-blur-xs rounded-xl text-white shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    {activeUnit ? activeUnit.nama : session.unitNama}
                  </h2>
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                    [{activeUnit?.kategori || 'Ruangan'}]
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5">
                  Kepala Unit: <strong className="text-white font-bold">{activeUnit?.kepalaRuangan || session.userName}</strong> &bull; Total {currentStaffList.length} Staf Pegawai
                                  </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              {activeRole !== 'staf_pegawai' && (
              <button
                id="btn-tambah-eval-kepala"
                onClick={() => {
                  setEditingRecord(null);
                  setIsFormModalOpen(true);
                }}
                className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Formulir Lengkap</span>
              </button>
              )}
            </div>
          </div>
        ) : (
          /* Multi-unit Switcher Bar for Super Admin & Komite Mutu */
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Filter Ruangan / Unit / Instalasi
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">
                    Pilih unit kerja untuk melihat dan mengelola hasil kepatuhan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                    title={`Edit nama ruangan & kepala ${activeUnit.nama}`}
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Edit {activeUnit.nama}</span>
                    <span className="inline sm:hidden">Edit</span>
                  </button>
                )}
                {canManageUnits && (
                  <button
                    id="btn-tambah-unit"
                    onClick={handleOpenAddUnit}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Tambah Unit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Native Dropdown Unit Selector */}
            <div className="block sm:hidden">
              <select
                id="mobile-select-unit"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">🏥 Semua Ruangan / Unit RS ({records.length} evaluasi)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    [{u.kategori}] {u.nama} ({records.filter((r) => r.unitId === u.id).length} data)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Select Buttons / Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
              <button
                id="pill-unit-all"
                onClick={() => setSelectedUnitId('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedUnitId === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Semua Unit RS</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedUnitId === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {records.length}
                </span>
              </button>

              {units.map((unit) => {
                const countInUnit = records.filter((r) => r.unitId === unit.id).length;
                const isSelected = selectedUnitId === unit.id;
                return (
                  <button
                    key={unit.id}
                    id={`pill-unit-${unit.id}`}
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold opacity-75">[{unit.kategori.slice(0, 3)}]</span>
                    <span>{unit.nama}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {countInUnit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Display Mode */}
        {viewMode === 'quick_direct' && activeUnit ? (
          /* 1. Quick Direct In-Table Evaluation Mode (Requested by User) */
          <div className="space-y-3">
            <QuickDirectTable
              unit={activeUnit}
              staffList={currentStaffList}
              existingRecords={records}
              selectedDate={evaluationDate}
              onDateChange={setEvaluationDate}
              onStaffListChange={() => setStaffVersion((v) => v + 1)}
              onSaveRecord={handleSaveRecord}
              onBulkSaveRecords={handleBulkSaveRecords}
            />

            {/* Quick Metrics for This Room */}
            <StatsCards
              records={filteredRecords}
              unitName={activeUnit.nama}
              totalStaff={currentStaffList.length}
              selectedDate={evaluationDate}
            />
          </div>
        ) : (
          /* 2. Full Accreditation Results Table & Cards Mode */
          <div className="space-y-4">
            <StatsCards
              records={filteredRecords}
              unitName={activeUnit ? activeUnit.nama : 'Seluruh Unit Rumah Sakit'}
              totalStaff={activeUnit ? currentStaffList.length : undefined}
              selectedDate={evaluationDate}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Tabel Hasil Evaluasi & Kepatuhan Pegawai
                  </h2>
                  <p className="text-xs text-slate-500">
                    Data sesuai kolom instrumen penilaian (4 kriteria skala 1-5 dan 9 kriteria Ya/Tidak)
                  </p>
                </div>
                {activeRole === 'staf_pegawai' && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    Mode Lihat (Staf Pegawai)
                  </span>
                )}
              </div>

              <EvaluationTable
                records={filteredRecords}
                onEdit={(rec) => {
                  if (!canEditRecord(rec)) {
                    showToast('Akses dibatasi: Anda tidak memiliki izin mengedit data unit ini.');
                    return;
                  }
                  setEditingRecord(rec);
                  setIsFormModalOpen(true);
                }}
                onDelete={(id) => {
                  const target = records.find((r) => r.id === id);
                  if (target && !canEditRecord(target)) {
                    showToast('Akses dibatasi: Anda tidak memiliki izin menghapus data unit ini.');
                    return;
                  }
                  handleDeleteRecord(id);
                }}
                selectedUnitName={activeUnit ? activeUnit.nama : 'Semua Unit'}
                canEdit={canEditRecord}
                canDelete={canDeleteRecord}
                onResetData={handleResetData}
              />
            </div>
          </div>
        )}

        {/* Mobile Floating Action Button (FAB) for Easy 1-Thumb Input */}
        {canAddEvaluation && (
          <button
            id="btn-mobile-fab"
            onClick={() => {
              setEditingRecord(null);
              setIsFormModalOpen(true);
            }}
            className="sm:hidden fixed bottom-5 right-5 z-40 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full p-3.5 shadow-xl flex items-center gap-1.5 border-2 border-white transition-transform cursor-pointer"
            title="Tambah Penilaian Pegawai"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-bold pr-1">Nilai</span>
          </button>
        )}
      
        </div>
      </AppLayout>


      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Aplikasi Form Input & Tabel Hasil Evaluasi Kepatuhan Pegawai Unit / Ruangan / Instalasi Rumah Sakit
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Komite Mutu & Disiplin RSUD</span>
            <span>&bull;</span>
            {isSuperAdmin ? (
              <button
                id="btn-footer-rbac"
                onClick={handleOpenRbacModal}
                className="text-purple-700 hover:text-purple-900 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Pengaturan RBAC & Database (Super Admin)</span>
              </button>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-slate-300" />
                <span>RBAC Terproteksi (Super Admin)</span>
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* Modal 1: Form Input Evaluasi Pegawai */}
      <EvaluationFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        units={isKepalaRuangan ? (activeUnit ? [activeUnit] : units) : units}
        initialUnitId={selectedUnitId !== 'all' ? selectedUnitId : (units && units[0]?.id) || 'igd'}
        editRecord={editingRecord}
        isRestrictedRole={isKepalaRuangan}
      />

      {/* Modal 2: Tambah / Edit Ruangan & Kepala Ruangan */}
      <AddUnitModal
        isOpen={isUnitModalOpen}
        onClose={() => {
          setIsUnitModalOpen(false);
          setUnitToEdit(null);
        }}
        onAddUnit={handleAddUnit}
        onUpdateUnit={handleUpdateUnit}
        unitToEdit={unitToEdit}
      />

      <MasterUnitsModal
        isOpen={isMasterUnitsModalOpen}
        onClose={() => setIsMasterUnitsModalOpen(false)}
        units={units}
        onAddUnitClick={handleOpenAddUnit}
        onEditUnitClick={handleOpenEditUnit}
        onDeleteUnit={handleDeleteUnit}
        onResetUnits={handleResetUnits}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
      
      {/* Modal 3: Cetak Dokumen / Print Preview */}
      <PrintReportView
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={filteredRecords}
        selectedUnit={activeUnit}
        allUnits={units}
      />

      {/* Modal 4: Supabase Integration & RBAC Simulator */}
      <SupabaseRbacModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        currentUserRole={session?.role || activeRole}
        currentSession={
          session || {
            role: activeRole,
            unitId: selectedUnitId,
            unitNama: activeUnit?.nama || 'RS',
            userName: 'Pengguna RS',
          }
        }
        activeRole={activeRole}
        units={units}
        setUnits={setUnits}
        onRoleChange={(newRole) => {
          setActiveRole(newRole);
          showToast(`Role aktif diubah menjadi: ${ROLE_LABELS[newRole].title}`);
        }}
        rbacPermissions={rbacPermissions}
        onUpdateRbacPermissions={handleUpdateRbacPermissions}
        onShowToast={showToast}
        onSwitchToSuperAdmin={() => {
          const superAdminSession: AuthSession = {
            role: 'super_admin',
            unitId: 'all',
            unitNama: 'Instalasi SIMRS & Komite Mutu',
            userName: 'Bambang Kusuma, S.Kom, M.TI',
            nip: '19810814 200801 1 007',
            jabatan: 'Kepala Instalasi SIMRS (Super Admin)',
          };
          setSession(superAdminSession);
          setActiveRole('super_admin');
          setSelectedUnitId('all');
          showToast('Beralih ke akun Super Administrator (SIMRS).');
        }}
      />
    </>
  );
}
