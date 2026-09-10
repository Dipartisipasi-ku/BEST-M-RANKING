import { AppRole } from './supabase_config';
import { loadSettingsFromSupabase, saveSettingsToSupabase } from './supabase_settings';

export interface RolePermissions {
  canManageUnits: boolean;
  canManageUsers: boolean;
  canEditSettings: boolean;
  canViewAllEvals: boolean;
  canSubmitEvals: boolean;
  canEditAnyEval: boolean;
  canDeleteAnyEval: boolean;
  canExportData: boolean;
}

export type RbacMatrix = Record<AppRole, RolePermissions>;

const DEFAULT_RBAC: RbacMatrix = {
  super_admin: {
    canManageUnits: true,
    canManageUsers: true,
    canEditSettings: true,
    canViewAllEvals: true,
    canSubmitEvals: true,
    canEditAnyEval: true,
    canDeleteAnyEval: true,
    canExportData: true,
  },
  komite_mutu: {
    canManageUnits: true,
    canManageUsers: false,
    canEditSettings: true,
    canViewAllEvals: true,
    canSubmitEvals: true,
    canEditAnyEval: true,
    canDeleteAnyEval: false,
    canExportData: true,
  },
  kepala_ruangan: {
    canManageUnits: false,
    canManageUsers: false,
    canEditSettings: false,
    canViewAllEvals: false, // Hanya bisa melihat evaluasi di unitnya (diterapkan di query)
    canSubmitEvals: true,
    canEditAnyEval: false,
    canDeleteAnyEval: false,
    canExportData: true,
  },
  staf_pegawai: {
    canManageUnits: false,
    canManageUsers: false,
    canEditSettings: false,
    canViewAllEvals: false,
    canSubmitEvals: false,
    canEditAnyEval: false,
    canDeleteAnyEval: false,
    canExportData: false,
  },
};

let cachedRbac: RbacMatrix | null = null;

export const loadRbacPermissions = async (): Promise<RbacMatrix> => {
  const remote = await loadSettingsFromSupabase('rbac_permissions');
  if (remote) {
    cachedRbac = remote;
    return remote;
  }
  
  // Fallback to local storage
  const local = localStorage.getItem('hospital_rbac_matrix');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      cachedRbac = parsed;
      return parsed;
    } catch(e){}
  }
  
  cachedRbac = DEFAULT_RBAC;
  return DEFAULT_RBAC;
};

export const saveRbacPermissions = async (matrix: RbacMatrix): Promise<void> => {
  cachedRbac = matrix;
  await saveSettingsToSupabase('rbac_permissions', matrix);
  localStorage.setItem('hospital_rbac_matrix', JSON.stringify(matrix));
};

export const hasRolePermission = (role: AppRole, permission: keyof RolePermissions): boolean => {
  const matrix = cachedRbac || DEFAULT_RBAC;
  return matrix[role]?.[permission] ?? false;
};

// MOCK USER ACCOUNT INTERFACES (For backward compatibility in SupabaseRbacModal)
export interface UserAccountItem {
  id: string;
  username: string;
  fullName: string;
  role: AppRole;
  nip?: string;
  jabatan?: string;
  unitId?: string;
}

export const loadUserAccounts = (): UserAccountItem[] => {
  return [];
};

export const saveUserAccounts = (accounts: UserAccountItem[]): void => {
};

export const DEFAULT_ROLE_PERMISSIONS = DEFAULT_RBAC;

export type RbacPermissionKey = keyof RolePermissions;

export const PERMISSION_DEFINITIONS: Record<RbacPermissionKey, { title: string; description: string }> = {
  canManageUnits: {
    title: 'Kelola Master Ruangan / Unit',
    description: 'Bisa menambah, mengedit, atau menghapus daftar master ruangan dan kepala ruangan di sistem.'
  },
  canManageUsers: {
    title: 'Kelola Akun & Hak Akses',
    description: 'Bisa membuat akun staf baru dan mengubah matriks perizinan role (RBAC).'
  },
  canEditSettings: {
    title: 'Edit Konfigurasi Evaluasi',
    description: 'Bisa menambah, mengubah, atau menghapus pertanyaan (Elemen Penilaian) di form evaluasi.'
  },
  canViewAllEvals: {
    title: 'Lihat Semua Data Evaluasi',
    description: 'Bisa melihat riwayat evaluasi dari seluruh ruangan. Jika off, hanya bisa melihat evaluasi ruangannya sendiri.'
  },
  canSubmitEvals: {
    title: 'Input Evaluasi Baru',
    description: 'Bisa mengisi form evaluasi kepatuhan untuk staf/pegawai.'
  },
  canEditAnyEval: {
    title: 'Edit Data Evaluasi',
    description: 'Bisa mengubah data riwayat evaluasi yang sudah tersimpan.'
  },
  canDeleteAnyEval: {
    title: 'Hapus Data Evaluasi',
    description: 'Bisa menghapus data riwayat evaluasi secara permanen dari sistem.'
  },
  canExportData: {
    title: 'Ekspor Data',
    description: 'Bisa mencetak laporan dan mendownload data riwayat evaluasi ke CSV / Excel.'
  }
};

export const getStoredRbacPermissions = (): RbacMatrix => {
  if (cachedRbac) return cachedRbac;
  const local = localStorage.getItem('hospital_rbac_matrix');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {}
  }
  return DEFAULT_RBAC;
};
