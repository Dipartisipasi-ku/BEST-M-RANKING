import React, { useState, useEffect } from 'react';
import { getStoredEvalElements, saveStoredEvalElements } from "../utils/evalElements";
import {
  X,
  Database,
  Shield,
  Copy,
  Check,
  Terminal,
  Server,
  Key,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RotateCcw,
  Save,
  UserCheck,
  ShieldAlert,
  Edit3,
  Plus,
  Trash2,
  ChevronRight,
  Info,
  ListChecks,
  Building2,
  FileSpreadsheet,
  GitCompare,
  RefreshCw,
  Layers,
  Pencil,
  Search,
} from 'lucide-react';
import { AddUnitModal } from './AddUnitModal';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  AppRole,
  ROLE_LABELS,
  detectSchemaDiscrepancies,
  type SchemaDiscrepancyReport,
  type ColumnDiscrepancy,
} from '../lib/supabase_config';
import {
  RbacPermissionKey,
  RolePermissions,
  PERMISSION_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
  UserAccountItem,
  loadUserAccounts,
  saveUserAccounts,
} from '../lib/rbac_config';
import { SUPABASE_FULL_SCHEMA_SQL } from '../data/supabaseSqlScript';
import { INITIAL_UNITS } from '../data/initialData';
import { AuthSession, Unit } from '../types';


interface SupabaseRbacModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: AppRole;
  currentSession: AuthSession;
  activeRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  rbacPermissions: RolePermissions;
  onUpdateRbacPermissions: (newPerms: RolePermissions) => void;
  onShowToast: (msg: string) => void;
  units: Unit[];
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  onSwitchToSuperAdmin?: () => void;
}

export const SupabaseRbacModal: React.FC<SupabaseRbacModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  currentSession,
  activeRole,
  onRoleChange,
  rbacPermissions,
  onUpdateRbacPermissions,
  units,
  setUnits,
  onShowToast,
  onSwitchToSuperAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'elemen' | 'units' | 'overview' | 'schema' | 'sql' | 'cli'>('matrix');
  const [localPerms, setLocalPerms] = useState<RolePermissions>(rbacPermissions);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedCLI, setCopiedCLI] = useState(false);

  // Schema discrepancy auto-detection state
  const [schemaReport, setSchemaReport] = useState<SchemaDiscrepancyReport | null>(null);
  const [isDetectingSchema, setIsDetectingSchema] = useState(false);
  const [copiedAlterSql, setCopiedAlterSql] = useState(false);
  const [copiedUnifiedSql, setCopiedUnifiedSql] = useState(false);
  const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);

  // User accounts management state
  const [userAccounts, setUserAccounts] = useState<UserAccountItem[]>(() => loadUserAccounts());
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserNip, setNewUserNip] = useState('');
  const [newUserUnit, setNewUserUnit] = useState('');
  const [newUserJabatan, setNewUserJabatan] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('kepala_ruangan');
  const [evalElements, setEvalElements] = useState(() => getStoredEvalElements());
  const [editingUnitInRbac, setEditingUnitInRbac] = useState<Unit | null>(null);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');

  // Supabase test connection state
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    loading: boolean;
    success: boolean;
    message: string;
  }>({
    tested: false,
    loading: false,
    success: false,
    message: '',
  });

  // Sync incoming rbacPermissions to localPerms
  useEffect(() => {
    setLocalPerms(rbacPermissions);
    setHasUnsavedChanges(false);
  }, [rbacPermissions]);

  if (!isOpen) return null;

  // Strict RBAC gate: Only super_admin can view and edit this configuration!
  const isSuperAdmin = currentUserRole === 'super_admin';

  const handleTogglePermission = (role: AppRole, permKey: RbacPermissionKey) => {
    // Super admin permissions cannot be turned off for self to prevent lockout
    if (role === 'super_admin' && permKey === 'canManageUsers') return;

    setLocalPerms((prev) => {
      const currentVal = prev[role][permKey];
      const updated = {
        ...prev,
        [role]: {
          ...prev[role],
          [permKey]: !currentVal,
        },
      };
      setHasUnsavedChanges(true);
      return updated;
    });
  };

  const handleSaveMatrix = () => {
    onUpdateRbacPermissions(localPerms);
    setHasUnsavedChanges(false);
    onShowToast('✓ Konfigurasi RBAC berhasil diperbarui & disimpan!');
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan seluruh hak akses RBAC ke standar default rumah sakit?')) {
      setLocalPerms(DEFAULT_ROLE_PERMISSIONS);
      onUpdateRbacPermissions(DEFAULT_ROLE_PERMISSIONS);
      setHasUnsavedChanges(false);
      onShowToast('Konfigurasi RBAC telah direset ke standar RS.');
    }
  };

  const handleChangeUserRole = (userId: string, newRole: AppRole) => {
    const updated = userAccounts.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    setUserAccounts(updated);
    saveUserAccounts(updated);
    onShowToast(`Role pengguna diperbarui ke: ${ROLE_LABELS[newRole].title}`);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const newUser: UserAccountItem = {
      id: `user-${Date.now()}`,
      fullName: newUserName.trim(),
      username: newUserName.trim().toLowerCase().replace(/\s+/g, ''),
      nip: newUserNip.trim() || '-',
      role: newUserRole,
      unitId: newUserUnit.trim() || 'igd',
      jabatan: newUserJabatan.trim() || 'Staf RS',
    };

    const updated = [newUser, ...userAccounts];
    setUserAccounts(updated);
    saveUserAccounts(updated);
    setIsAddingUser(false);
    setNewUserName('');
    setNewUserNip('');
    setNewUserUnit('');
    setNewUserJabatan('');
    onShowToast(`Akun pengguna ${newUser.fullName} berhasil ditambahkan!`);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Hapus akun penilai ini dari daftar?')) {
      const updated = userAccounts.filter((u) => u.id !== userId);
      setUserAccounts(updated);
      saveUserAccounts(updated);
      onShowToast('Akun pengguna berhasil dihapus.');
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_FULL_SCHEMA_SQL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestResult({ tested: true, loading: true, success: false, message: 'Menguji koneksi...' });
    const res = await testSupabaseConnection();
    setTestResult({
      tested: true,
      loading: false,
      success: res.success,
      message: res.message,
    });
  };

  const cliCommands = `# 1. Install Supabase CLI
npm i -g supabase

# 2. Login ke akun Supabase Anda
supabase login

# 3. Hubungkan proyek lokal dengan remote project Supabase
supabase link --project-ref <your-project-id>

# 4. Push migrasi SQL ke database Supabase (Push Ready)
supabase db push

# 5. Pull skema jika ada perubahan dari remote (Pull Ready)
supabase db pull`;

  const handleCopyCLI = () => {
    navigator.clipboard.writeText(cliCommands);
    setCopiedCLI(true);
    setTimeout(() => setCopiedCLI(false), 2500);
  };

  const handleRunSchemaDetection = async () => {
    setIsDetectingSchema(true);
    try {
      const report = await detectSchemaDiscrepancies();
      setSchemaReport(report);
      onShowToast('✓ Audit diskrepansi skema master vs evaluation_records selesai diproses!');
    } catch (err: any) {
      onShowToast(`Gagal memeriksa skema: ${err?.message || 'Error'}`);
    } finally {
      setIsDetectingSchema(false);
    }
  };

  const handleCopyAlterQueries = () => {
    if (!schemaReport) return;
    const text = schemaReport.generatedAlterQueries.join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAlterSql(true);
    setTimeout(() => setCopiedAlterSql(false), 2500);
    onShowToast('✓ Query ALTER TABLE disalin ke clipboard!');
  };

  const handleCopyUnifiedMigrationSql = () => {
    if (!schemaReport) return;
    navigator.clipboard.writeText(schemaReport.migrationScriptSql);
    setCopiedUnifiedSql(true);
    setTimeout(() => setCopiedUnifiedSql(false), 2500);
    onShowToast('✓ Skrip migrasi SQL lengkap disalin ke clipboard!');
  };

  const handleCopySingleQuery = (query: string, index: number) => {
    navigator.clipboard.writeText(query);
    setCopiedRowIndex(index);
    setTimeout(() => setCopiedRowIndex(null), 2000);
    onShowToast('Query ALTER TABLE baris ini berhasil disalin!');
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
      <div
        id="supabase-rbac-modal"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-500 text-white rounded-2xl shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Pusat Konfigurasi RBAC & Database Supabase
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-md">
                  Akses Khusus Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Pengaturan hak akses role rumah sakit, otorisasi RLS PostgreSQL, dan penugasan pengguna
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup jendela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ACCESS DENIED SCREEN IF NOT SUPER ADMIN */}
        {!isSuperAdmin ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center shadow-md">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Akses Terbatas: Hanya Super Admin
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda saat ini masuk sebagai <strong>{ROLE_LABELS[currentUserRole]?.title || currentUserRole}</strong> ({currentSession.userName}). Menu konfigurasi RBAC, pengeditan matriks hak akses, dan manajemen database hanya dapat diakses dan diubah oleh <strong>Super Administrator (SIMRS / IT)</strong>.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              {onSwitchToSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onSwitchToSuperAdmin();
                    onClose();
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Beralih ke Akun Super Admin</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Kembali ke Aplikasi
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-2.5 border-b border-slate-200 bg-slate-50 text-xs font-bold overflow-x-auto scrollbar-thin">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'matrix'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Edit3 className="w-4 h-4 text-purple-600" />
                <span>Editor Matriks Hak Akses</span>
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'users'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Kelola Akun & Role Pengguna</span>
              </button>

              <button
                onClick={() => setActiveTab('elemen')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'elemen'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ListChecks className="w-4 h-4 text-emerald-600" />
                <span>Master Elemen Penilaian</span>
              </button>

              <button
                onClick={() => setActiveTab('units')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'units'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4 text-rose-600" />
                <span>Master Unit & Ruangan</span>
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Server className="w-4 h-4 text-emerald-600" />
                <span>Status Supabase</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('schema');
                  if (!schemaReport && !isDetectingSchema) {
                    handleRunSchemaDetection();
                  }
                }}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'schema'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <GitCompare className="w-4 h-4 text-amber-600" />
                <span>Audit Skema (Master vs Eval)</span>
                {schemaReport && schemaReport.summary.criticalMissingCount > 0 ? (
                  <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                    {schemaReport.summary.criticalMissingCount}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setActiveTab('sql')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'sql'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Database className="w-4 h-4 text-blue-600" />
                <span>Skrip SQL & RLS</span>
              </button>

              <button
                onClick={() => setActiveTab('cli')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'cli'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Terminal className="w-4 h-4 text-slate-700" />
                <span>CLI Push / Pull</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
              
              {/* TAB 1: EDITABLE RBAC MATRIX */}
              {activeTab === 'matrix' && (
                <div className="space-y-4">
                  {/* Action Bar & Warning notice */}
                  <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-xl mt-0.5 shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-purple-900">
                          Editor RBAC Dinamis (Role-Based Access Control)
                        </h4>
                        <p className="text-[11px] text-purple-800/80 leading-relaxed">
                          Klik kotak centang di bawah untuk memberikan atau mencabut hak akses tiap role. Seluruh tombol input, edit nilai, tambah ruangan, ekspor, dan cetak laporan di aplikasi akan otomatis tunduk pada pengaturan ini.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                      <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Kembalikan semua izin ke standar default RS"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reset Standar</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveMatrix}
                        disabled={!hasUnsavedChanges}
                        className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          hasUnsavedChanges
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50 animate-bounce-subtle'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        title="Simpan perubahan hak akses"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Table Matrix */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                            <th className="py-3 px-4 font-bold min-w-[220px]">
                              Fitur & Izin Sistem RS
                            </th>
                            <th className="py-3 px-3 text-center min-w-[140px]">
                              <div className="flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-extrabold text-[11px] border border-purple-200">
                                  Super Admin
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5">Akses Penuh IT</span>
                              </div>
                            </th>
                            <th className="py-3 px-3 text-center min-w-[140px]">
                              <div className="flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[11px] border border-blue-200">
                                  Komite Mutu
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5">Tim Penilai RS</span>
                              </div>
                            </th>
                            <th className="py-3 px-3 text-center min-w-[140px]">
                              <div className="flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[11px] border border-amber-200">
                                  Kepala Ruangan
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5">Penilai Unit Sendiri</span>
                              </div>
                            </th>
                            <th className="py-3 px-3 text-center min-w-[130px]">
                              <div className="flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-200">
                                  Staf Pegawai
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5">Mode Pengamat / Nakes</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {Object.entries(PERMISSION_DEFINITIONS).map(([key, perm]) => {
                            const isManageRbacRow = key === 'canManageUsers';

                            return (
                              <tr
                                key={key}
                                className={`hover:bg-slate-50/80 transition-colors ${
                                  isManageRbacRow ? 'bg-purple-50/30' : ''
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800">{perm.title}</div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">{perm.description}</div>
                                  <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                    Hak Akses
                                  </span>
                                </td>

                                {/* Super Admin column */}
                                <td className="py-3 px-3 text-center bg-purple-50/20">
                                  {isManageRbacRow ? (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-[10px] font-bold border border-purple-200">
                                      <Lock className="w-3 h-3 text-purple-700" />
                                      <span>Terkunci</span>
                                    </div>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={Boolean(localPerms.super_admin[(key as RbacPermissionKey)])}
                                      onChange={() => handleTogglePermission('super_admin', (key as RbacPermissionKey))}
                                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer accent-purple-600"
                                    />
                                  )}
                                </td>

                                {/* Komite Mutu column */}
                                <td className="py-3 px-3 text-center">
                                  {isManageRbacRow ? (
                                    <span className="text-slate-400 font-bold text-sm">&times;</span>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={Boolean(localPerms.komite_mutu[(key as RbacPermissionKey)])}
                                      onChange={() => handleTogglePermission('komite_mutu', (key as RbacPermissionKey))}
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                                    />
                                  )}
                                </td>

                                {/* Kepala Ruangan column */}
                                <td className="py-3 px-3 text-center">
                                  {isManageRbacRow ? (
                                    <span className="text-slate-400 font-bold text-sm">&times;</span>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={Boolean(localPerms.kepala_ruangan[(key as RbacPermissionKey)])}
                                      onChange={() => handleTogglePermission('kepala_ruangan', (key as RbacPermissionKey))}
                                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer accent-amber-600"
                                    />
                                  )}
                                </td>

                                {/* Staf Pegawai column */}
                                <td className="py-3 px-3 text-center">
                                  {isManageRbacRow ? (
                                    <span className="text-slate-400 font-bold text-sm">&times;</span>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={Boolean(localPerms.staf_pegawai[(key as RbacPermissionKey)])}
                                      onChange={() => handleTogglePermission('staf_pegawai', (key as RbacPermissionKey))}
                                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-500" />
                        <span>Centang kotak untuk mengaktifkan izin, hapus centang untuk menonaktifkan.</span>
                      </div>
                      {hasUnsavedChanges && (
                        <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                          Ada perubahan belum disimpan!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: USER ACCOUNTS & ROLE ASSIGNMENT */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Daftar Akun & Penugasan Role Penilai RS
                      </h3>
                      <p className="text-xs text-slate-500">
                        Super Admin dapat mengubah role penilai atau menambahkan akun penilai baru kapan saja
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".csv,.xlsx"
                        className="hidden"
                        id="import-csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const text = event.target?.result as string;
                              const lines = text.split('\n').filter(l => l.trim().length > 0);
                              
                              if (lines.length <= 1) {
                                onShowToast('File CSV kosong atau tidak valid.');
                                return;
                              }
                              
                              const newAccounts = [...userAccounts];
                              let added = 0;
                              
                              // Simple CSV parsing (Name, NIP, Role, Unit)
                              for (let i = 1; i < lines.length; i++) {
                                const [nama, nip, role, unitNama] = lines[i].split(',').map(s => s?.trim());
                                if (nama) {
                                  newAccounts.push({
                                    id: `usr-imported-${Date.now()}-${i}`,
                                    nama: nama.replace(/['"]/g, ''),
                                    nip: (nip || '').replace(/['"]/g, ''),
                                    role: (role as AppRole) || 'staf_pegawai',
                                    unitNama: (unitNama || 'Ruangan Umum').replace(/['"]/g, '')
                                  });
                                  added++;
                                }
                              }
                              
                              setUserAccounts(newAccounts);
                              saveUserAccounts(newAccounts);
                              onShowToast(`Berhasil mengimpor ${added} akun pegawai dari file.`);
                            } catch (err) {
                              onShowToast('Gagal memproses file CSV.');
                            }
                            
                            // Reset file input
                            e.target.value = '';
                          };
                          reader.readAsText(file);
                        }}
                      />
                      <label
                        htmlFor="import-csv"
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Impor CSV/XLSX</span>
                        <span className="sm:hidden">Impor</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddingUser(!isAddingUser)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAddingUser ? 'Batal' : 'Tambah Akun Baru'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Add User Form Drawer */}
                  {isAddingUser && (
                    <form
                      onSubmit={handleCreateUser}
                      className="p-4 bg-white rounded-2xl border-2 border-blue-200 shadow-sm space-y-3 animate-in fade-in"
                    >
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span>Form Tambah Akun Penilai Rumah Sakit</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                          <input
                            type="text"
                            required
                            placeholder="Nama Pegawai / Kepala Ruangan"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                          <input
                            type="text"
                            placeholder="19870101 201201 1 002"
                            value={newUserNip}
                            onChange={(e) => setNewUserNip(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit / Ruangan Kerja</label>
                          <input
                            type="text"
                            placeholder="Contoh: Ruang Rawat Inap Dahlia"
                            value={newUserUnit}
                            onChange={(e) => setNewUserUnit(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Hak Akses Role RBAC</label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as AppRole)}
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 font-semibold"
                          >
                            <option value="kepala_ruangan">Kepala Ruangan / Instalasi</option>
                            <option value="komite_mutu">Komite Mutu & K3RS</option>
                            <option value="super_admin">Super Administrator SIMRS</option>
                            <option value="staf_pegawai">Staf Pegawai / Mode Pengamat</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingUser(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                        >
                          Simpan Akun
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Users List Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                          <th className="py-2.5 px-4 font-bold">Nama Pegawai & NIP</th>
                          <th className="py-2.5 px-3 font-bold">Ruangan / Unit</th>
                          <th className="py-2.5 px-3 font-bold">Jabatan</th>
                          <th className="py-2.5 px-3 font-bold">Role Hak Akses (Bisa Diedit)</th>
                          <th className="py-2.5 px-3 text-right font-bold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {userAccounts.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{user.fullName}</div>
                              <div className="text-[11px] font-mono text-slate-400">{user.nip}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-medium">
                              {user.unitNama}
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[11px]">
                              {user.jabatan}
                            </td>
                            <td className="py-3 px-3">
                              <select
                                value={user.role}
                                onChange={(e) => handleChangeUserRole(user.id, e.target.value as AppRole)}
                                className="bg-slate-50 hover:bg-white border border-slate-300 focus:border-purple-500 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 cursor-pointer"
                              >
                                <option value="super_admin">Super Admin</option>
                                <option value="komite_mutu">Komite Mutu</option>
                                <option value="kepala_ruangan">Kepala Ruangan</option>
                                <option value="staf_pegawai">Staf Pegawai</option>
                              </select>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus akun pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2.5: MASTER ELEMEN PENILAIAN */}
              {activeTab === 'elemen' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <span>Master Database Elemen Penilaian</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                          4 Skala &amp; {evalElements.booleans?.length || 10} Etika
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sesuaikan label kolom input tabel (Skala 1-5 dan Checklist Ya/Tidak)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Kembalikan elemen penilaian ke standar default rumah sakit?')) {
                            const reset = getStoredEvalElements();
                            saveStoredEvalElements(reset);
                            setEvalElements(reset);
                            onShowToast('Elemen penilaian direset ke standar RS.');
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Standar RS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          saveStoredEvalElements(evalElements);
                          onShowToast('Label elemen penilaian berhasil disimpan!');
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <h4 className="font-bold text-xs text-slate-800 border-b pb-2">Kolom Penilaian (Skala Bintang 1-5)</h4>
                      {evalElements.scale.map((el: any, index: number) => (
                        <div key={el.id} className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kolom #{index + 1}</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={el.title}
                              onChange={e => {
                                const newScale = [...evalElements.scale];
                                newScale[index].title = e.target.value;
                                setEvalElements({ ...evalElements, scale: newScale });
                              }}
                              className="w-1/2 text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-semibold"
                              placeholder="Judul Utama (misal: Seragam)"
                            />
                            <input
                              type="text"
                              value={el.subtitle}
                              onChange={e => {
                                const newScale = [...evalElements.scale];
                                newScale[index].subtitle = e.target.value;
                                setEvalElements({ ...evalElements, scale: newScale });
                              }}
                              className="w-1/2 text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 text-slate-600"
                              placeholder="Deskripsi singkat"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="font-bold text-xs text-slate-800">Grup Checklist (Ya/Tidak)</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newId = `custom_${Date.now()}`;
                            const newBooleans = [
                              ...(evalElements.booleans || []),
                              { id: newId, label: 'Indikator Kepatuhan Baru', shortLabel: 'Kepatuhan Baru' }
                            ];
                            setEvalElements({ ...evalElements, booleans: newBooleans });
                          }}
                          className="px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Tambah Indikator</span>
                        </button>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Judul Popover Checklist</label>
                        <input
                          type="text"
                          value={evalElements.booleanTitle}
                          onChange={e => setEvalElements({ ...evalElements, booleanTitle: e.target.value })}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-semibold"
                          placeholder="Judul Checklist (misal: 10 Nilai Etika)"
                        />
                      </div>
                      <div className="space-y-1 pb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Deskripsi Tambahan</label>
                        <input
                          type="text"
                          value={evalElements.booleanSubtitle}
                          onChange={e => setEvalElements({ ...evalElements, booleanSubtitle: e.target.value })}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 text-slate-600"
                          placeholder="Deskripsi (misal: Budaya RS)"
                        />
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                        <h4 className="font-bold text-[11px] text-slate-700">Daftar Indikator (Checklist Ya/Tidak)</h4>
                        {evalElements.booleans?.map((el: any, index: number) => (
                          <div key={el.id} className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex flex-col gap-1.5 relative group">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Indikator {index + 1}</label>
                              <button
                                type="button"
                                onClick={() => {
                                  if (evalElements.booleans.length <= 1) return;
                                  const newBooleans = evalElements.booleans.filter((_: any, idx: number) => idx !== index);
                                  setEvalElements({ ...evalElements, booleans: newBooleans });
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                                title="Hapus indikator"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={el.label}
                              onChange={e => {
                                const newBooleans = [...evalElements.booleans];
                                newBooleans[index].label = e.target.value;
                                setEvalElements({ ...evalElements, booleans: newBooleans });
                              }}
                              className="w-full text-xs p-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
                              placeholder="Deskripsi panjang indikator"
                            />
                            <input
                              type="text"
                              value={el.shortLabel}
                              onChange={e => {
                                const newBooleans = [...evalElements.booleans];
                                newBooleans[index].shortLabel = e.target.value;
                                setEvalElements({ ...evalElements, booleans: newBooleans });
                              }}
                              className="w-full text-[11px] p-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 bg-white font-semibold text-slate-700"
                              placeholder="Label Singkat"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OVERVIEW */}
              {/* TAB 2.6: MASTER UNIT / RUANGAN */}
              {activeTab === 'units' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <span>Master Database Unit / Ruangan</span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md">
                          {units.length} Unit
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Daftar 38 unit, instalasi, dan ruangan resmi rumah sakit dengan aksi edit dan kelola.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Muat ulang 38 Master Unit/Instalasi/Ruangan resmi sesuai spreadsheet rumah sakit?')) {
                            setUnits(INITIAL_UNITS);
                            localStorage.setItem('hospital_eval_units_v2', JSON.stringify(INITIAL_UNITS));
                            localStorage.setItem('units_data', JSON.stringify(INITIAL_UNITS));
                            onShowToast('38 Master Unit/Instalasi/Ruangan berhasil dimuat ulang!');
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Muat Ulang 38 Master RS</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Bar for Units */}
                  <div className="relative max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={unitSearchQuery}
                      onChange={(e) => setUnitSearchQuery(e.target.value)}
                      placeholder="Cari nama ruangan, kepala ruangan, atau lokasi..."
                      className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 z-10">
                          <tr>
                            <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Kategori</th>
                            <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Nama Unit</th>
                            <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Kepala Ruangan</th>
                            <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Lokasi</th>
                            <th className="py-2.5 px-4 text-center font-bold uppercase tracking-wider w-24">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {units
                            .filter((u) => {
                              const q = unitSearchQuery.toLowerCase();
                              return (
                                !q ||
                                u.nama.toLowerCase().includes(q) ||
                                (u.kepalaRuangan && u.kepalaRuangan.toLowerCase().includes(q)) ||
                                (u.lokasi && u.lokasi.toLowerCase().includes(q))
                              );
                            })
                            .map((unit) => (
                              <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2.5 px-4">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    unit.kategori === 'Instalasi' ? 'bg-indigo-100 text-indigo-700' :
                                    unit.kategori === 'Unit' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {unit.kategori}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-semibold text-slate-800">{unit.nama}</td>
                                <td className="py-2.5 px-4 text-slate-600">{unit.kepalaRuangan || '-'}</td>
                                <td className="py-2.5 px-4 text-slate-500 text-[11px]">{unit.lokasi || '-'}</td>
                                <td className="py-2.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingUnitInRbac(unit)}
                                      className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit master ruangan / unit ini"
                                    >
                                      <Pencil className="w-4 h-4 text-amber-600" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Hapus unit "${unit.nama}" dari sistem?`)) {
                                          const newUnits = units.filter(u => u.id !== unit.id);
                                          setUnits(newUnits);
                                          localStorage.setItem('hospital_eval_units_v2', JSON.stringify(newUnits));
                                          localStorage.setItem('units_data', JSON.stringify(newUnits));
                                          onShowToast('Unit berhasil dihapus.');
                                        }
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus Unit"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Modal to edit unit inside RBAC */}
                  {editingUnitInRbac && (
                    <AddUnitModal
                      isOpen={Boolean(editingUnitInRbac)}
                      unitToEdit={editingUnitInRbac}
                      onClose={() => setEditingUnitInRbac(null)}
                      onUpdateUnit={(updatedUnit) => {
                        const next = units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
                        setUnits(next);
                        localStorage.setItem('hospital_eval_units_v2', JSON.stringify(next));
                        localStorage.setItem('units_data', JSON.stringify(next));
                        onShowToast(`Unit "${updatedUnit.nama}" berhasil diperbarui!`);
                        setEditingUnitInRbac(null);
                      }}
                    />
                  )}
                </div>
              )}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Connection Status Card */}
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isSupabaseConfigured
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl mt-0.5 ${
                          isSupabaseConfigured
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isSupabaseConfigured ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Status Supabase:{' '}
                          {isSupabaseConfigured ? 'Dikonfigurasi di .env' : 'Mode Offline / Local Storage'}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {isSupabaseConfigured
                            ? 'Variabel VITE_SUPABASE_URL & ANON KEY aktif. Perubahan terhubung langsung ke database PostgreSQL.'
                            : 'Aplikasi saat ini berjalan mulus dengan LocalStorage. Masukkan kredensial Supabase di `.env` untuk sinkronisasi cloud real-time.'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleTestConnection}
                      disabled={testResult.loading}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer"
                    >
                      {testResult.loading ? 'Menguji...' : 'Uji Koneksi Supabase'}
                    </button>
                  </div>

                  {testResult.tested && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                        testResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  {/* Architecture Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                        <Database className="w-4 h-4 text-blue-600" />
                        Tabel Relasional
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li>&bull; <code className="font-mono text-slate-800">public.units</code> (Ruangan RS)</li>
                        <li>&bull; <code className="font-mono text-slate-800">public.profiles</code> (User RBAC)</li>
                        <li>&bull; <code className="font-mono text-slate-800">public.evaluation_records</code></li>
                        <li>&bull; <code className="font-mono text-slate-800">public.role_permissions</code></li>
                      </ul>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        RLS (Row Level Security)
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Tiap baris data dilindungi RLS. Kepala Ruangan hanya dapat memodifikasi unitnya, sedangkan Komite Mutu & Super Admin memiliki otorisasi penuh.
                      </p>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                        <Terminal className="w-4 h-4 text-purple-600" />
                        File Proyek Siap Pakai
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1 font-mono">
                        <li>&bull; /supabase/schema.sql</li>
                        <li>&bull; /supabase/migrations/..</li>
                        <li>&bull; /src/lib/rbac_config.ts</li>
                        <li>&bull; /src/lib/supabase_config.ts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SCHEMA DISCREPANCY AUDIT & ALTER TABLE GENERATOR */}
              {activeTab === 'schema' && (
                <div className="space-y-4">
                  {/* Action Banner */}
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl mt-0.5 shrink-0 shadow-2xs">
                        <GitCompare className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Audit Diskrepansi Otomatis: <code className="font-mono text-indigo-700 font-bold">evaluation_records</code> vs <code className="font-mono text-emerald-700 font-bold">public.master</code>
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                          Mendeteksi secara mendalam kolom yang hilang, perbedaan nama kolom Google Form vs snake_case, dan menghasilkan perintah <code className="font-mono font-bold text-slate-800">ALTER TABLE</code> otomatis untuk menyelaraskan database live Supabase.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunSchemaDetection}
                      disabled={isDetectingSchema}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDetectingSchema ? 'animate-spin' : ''}`} />
                      <span>{isDetectingSchema ? 'Memeriksa Database...' : 'Deteksi Diskrepansi Sekarang'}</span>
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  {schemaReport && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-semibold text-slate-500 block">Total Kolom Master</span>
                        <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                          {schemaReport.summary.totalMasterColumns}
                        </div>
                        <span className="text-[10px] text-slate-400">Spesifikasi 18 Kolom RS</span>
                      </div>

                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-semibold text-emerald-600 block">Kolom Tersinkron</span>
                        <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                          {schemaReport.summary.syncedCount}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium">Padanan valid di database</span>
                      </div>

                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-semibold text-amber-600 block">Kritis / Perlu ALTER</span>
                        <div className="text-xl font-extrabold text-amber-700 mt-0.5">
                          {schemaReport.summary.criticalMissingCount}
                        </div>
                        <span className="text-[10px] text-amber-600 font-medium">Kolom pin_atribut / constraint</span>
                      </div>

                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-semibold text-indigo-600 block">Format Naming Mismatch</span>
                        <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
                          {schemaReport.summary.namingDiscrepanciesCount}
                        </div>
                        <span className="text-[10px] text-indigo-500 font-medium">Natural vs snake_case</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons to copy ALTER TABLE statements */}
                  {schemaReport && (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {schemaReport.generatedAlterQueries.length} Query ALTER TABLE Dihasilkan
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-md">
                          Live Ready
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyAlterQueries}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          {copiedAlterSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedAlterSql ? 'Tersalin!' : 'Salin Semua ALTER TABLE'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyUnifiedMigrationSql}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          {copiedUnifiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUnifiedSql ? 'Tersalin!' : 'Salin Skrip Migrasi Lengkap'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comparison & Discrepancy Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                            <th className="py-2.5 px-3 font-bold w-8 text-center">No</th>
                            <th className="py-2.5 px-3 font-bold min-w-[220px]">Kolom public.master</th>
                            <th className="py-2.5 px-3 font-bold min-w-[200px]">Padanan evaluation_records</th>
                            <th className="py-2.5 px-3 font-bold w-36 text-center">Status</th>
                            <th className="py-2.5 px-3 font-bold min-w-[280px]">Rekomendasi Query ALTER TABLE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {schemaReport ? (
                            schemaReport.discrepancies.map((disc, idx) => {
                              const isCritical = disc.severity === 'critical' || disc.severity === 'warning';
                              return (
                                <tr
                                  key={disc.masterColumn}
                                  className={`hover:bg-slate-50/70 transition-colors ${
                                    isCritical ? 'bg-amber-50/40' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-semibold text-[11px]">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-slate-900 leading-snug font-mono text-[11px]">
                                      "{disc.masterColumn}"
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      Tipe: <span className="text-indigo-600 font-bold">{disc.masterType}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-slate-800 font-mono text-[11px]">
                                      {disc.evalColumnEquivalent}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      Tipe: <span className="text-emerald-700 font-bold">{disc.evalType}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        disc.severity === 'critical'
                                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                          : disc.severity === 'warning'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : disc.status === 'synced'
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}
                                    >
                                      {disc.statusLabel}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {disc.alterTableQuery ? (
                                      <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-900 text-amber-300 rounded-lg text-[10px] font-mono border border-slate-800">
                                        <span className="truncate max-w-[280px]" title={disc.alterTableQuery}>
                                          {disc.alterTableQuery}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopySingleQuery(disc.alterTableQuery, idx)}
                                          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors shrink-0 cursor-pointer"
                                          title="Salin query ALTER TABLE ini"
                                        >
                                          {copiedRowIndex === idx ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">
                                        Tidak diperlukan ALTER TABLE (Sudah sinkron)
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                                <RefreshCw className="w-5 h-5 mx-auto mb-2 text-slate-400 animate-spin" />
                                Memuat analisis audit diskrepansi...
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SQL Preview of Generated ALTER TABLE Migration */}
                  {schemaReport && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800">
                          Pratinjau Lengkap Skrip Migrasi SQL (<code className="font-mono text-purple-700">ALTER TABLE</code> & <code className="font-mono text-indigo-700">VIEW</code>)
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Salin dan jalankan di Supabase SQL Editor
                        </span>
                      </div>
                      <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[35vh] border border-slate-800 leading-relaxed scrollbar-thin">
                        {schemaReport.migrationScriptSql}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SQL CODE */}
              {activeTab === 'sql' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        Skema SQL & Kebijakan RLS: <code className="font-mono text-blue-600">/supabase/schema.sql</code>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Siap dieksekusi langsung di Supabase SQL Editor dengan 1 klik
                      </p>
                    </div>
                    <button
                      onClick={handleCopySQL}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      {copiedSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSQL ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL'}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-slate-950 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[48vh] border border-slate-800 leading-relaxed scrollbar-thin">
                    {SUPABASE_FULL_SCHEMA_SQL}
                  </pre>
                </div>
              )}

              {/* TAB 5: CLI PUSH / PULL */}
              {activeTab === 'cli' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        Alur Kerja Supabase CLI (Push / Pull Ready)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Perintah terminal untuk sinkronisasi migrasi skema database lokal dan cloud
                      </p>
                    </div>
                    <button
                      onClick={handleCopyCLI}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      {copiedCLI ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCLI ? 'Tersalin!' : 'Salin Perintah CLI'}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
{cliCommands}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Masuk sebagai:</span>
                <span className="font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {currentSession.userName} (Super Administrator)
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
