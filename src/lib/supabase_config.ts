import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Unit, EvaluationRecord } from '../types';
import { env } from '../../env.js';

// Environment variables with env.js fallback
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
const supabaseUrl = metaEnv?.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
const supabaseAnonKey = metaEnv?.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref') &&
  supabaseUrl.startsWith('http')
);

// Supabase client instance (null if unconfigured)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export type AppRole = 'super_admin' | 'komite_mutu' | 'kepala_ruangan' | 'staf_pegawai';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  nip?: string;
  role: AppRole;
  unitId?: string;
  unitNama?: string;
  jabatan?: string;
}

export const ROLE_LABELS: Record<AppRole, { title: string; description: string; badgeColor: string }> = {
  super_admin: {
    title: 'Super Admin (Direksi / IT)',
    description: 'Akses penuh ke seluruh unit, kelola user RBAC, tambah/edit/hapus seluruh evaluasi dan unit',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  komite_mutu: {
    title: 'Komite Mutu & K3RS',
    description: 'Tim penilai eksternal RS: menilai seluruh unit/ruangan, audit kepatuhan, ekspor dan cetak',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  kepala_ruangan: {
    title: 'Kepala Ruangan / Unit',
    description: 'Koordinator unit kerja: input & evaluasi khusus staf di ruangannya sendiri',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  staf_pegawai: {
    title: 'Staf Pegawai / Nakes',
    description: 'Staf medis/non-medis: melihat capaian kepatuhan unit dan evaluasi mandiri',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
};

/**
 * Test Supabase live connection and check master / evaluation_records tables
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
  hasMasterTable?: boolean;
  hasEvalTable?: boolean;
  masterCount?: number;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi. Silakan isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env atau Secrets.',
    };
  }

  try {
    // Check units table
    const { data: unitsData, error: unitError } = await supabase.from('units').select('count', { count: 'exact', head: true });

    // Check public.master table
    const { count: masterCount, error: masterError } = await supabase
      .from('master')
      .select('*', { count: 'exact', head: true });

    // Check public.evaluation_records table
    const { count: evalCount, error: evalError } = await supabase
      .from('evaluation_records')
      .select('*', { count: 'exact', head: true });

    const hasMaster = !masterError;
    const hasEval = !evalError;

    if (unitError && masterError && evalError) {
      return {
        success: false,
        message: `Koneksi gagal: ${unitError.message} (${unitError.code || 'RLS/Auth issue'})`,
        details: unitError,
      };
    }

    let statusMsg = 'Koneksi ke Supabase PostgreSQL berhasil! ';
    if (hasMaster) {
      statusMsg += `Tabel public.master aktif (${masterCount ?? 0} data). `;
    }
    if (hasEval) {
      statusMsg += `Tabel public.evaluation_records aktif (${evalCount ?? 0} data).`;
    }

    return {
      success: true,
      message: statusMsg,
      hasMasterTable: hasMaster,
      hasEvalTable: hasEval,
      masterCount: masterCount ?? 0,
      details: { units: unitsData, masterCount, evalCount },
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Terjadi kendala jaringan: ${err?.message || 'Network error'}`,
      details: err,
    };
  }
}

/**
 * Convert DB row (snake_case) to EvaluationRecord (camelCase)
 */
export function mapRowToEvaluationRecord(row: any): EvaluationRecord {
  return {
    id: row.id,
    unitId: row.unit_id,
    unitNama: row.unit_nama,
    nama: row.nama,
    nip: row.nip || '',
    jabatan: row.jabatan || '',
    tanggal: row.tanggal,
    shift: row.shift || 'Pagi',
    seragamSesuaiKetentuan: Number(row.seragam_sesuai_ketentuan),
    atributKerjaSesuaiKetentuan: Number(row.atribut_kerja_sesuai_ketentuan),
    sepatuSaatPelayanan: Number(row.sepatu_saat_pelayanan),
    salamPrimaLingkunganRS: Number(row.salam_prima_lingkungan_rs),
    identitasIdCard: row.identitas_id_card,
    pinAtributLogo: row.pin_atribut_logo || 'Ya',
    menerapkanSalamPrima: row.menerapkan_salam_prima,
    seragamKerjaAturan: row.seragam_kerja_aturan,
    ramahSopanMenghormati: row.ramah_sopan_menghormati,
    tanggungJawabJujurProfesional: row.tanggung_jawab_jujur_profesional,
    tidakTerimaHadiah: row.tidak_terima_hadiah,
    pelayananSesuaiKewenangan: row.pelayanan_sesuai_kewenangan,
    memenuhiPanggilanKedinasan: row.memenuhi_panggilan_kedinasan,
    bekerjaPenuhTanggungJawab: row.bekerja_penuh_tanggung_jawab,
    catatan: row.catatan || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Convert EvaluationRecord (camelCase) to DB row (snake_case) for public.evaluation_records
 */
export function mapRecordToDBRow(record: EvaluationRecord, evaluatorId?: string) {
  return {
    id: record.id,
    unit_id: record.unitId,
    unit_nama: record.unitNama,
    nama: record.nama,
    nip: record.nip || null,
    jabatan: record.jabatan || null,
    tanggal: record.tanggal,
    shift: record.shift || 'Pagi',
    seragam_sesuai_ketentuan: record.seragamSesuaiKetentuan,
    atribut_kerja_sesuai_ketentuan: record.atributKerjaSesuaiKetentuan,
    sepatu_saat_pelayanan: record.sepatuSaatPelayanan,
    salam_prima_lingkungan_rs: record.salamPrimaLingkunganRS,
    identitas_id_card: record.identitasIdCard,
    pin_atribut_logo: record.pinAtributLogo || 'Ya',
    menerapkan_salam_prima: record.menerapkanSalamPrima,
    seragam_kerja_aturan: record.seragamKerjaAturan,
    ramah_sopan_menghormati: record.ramahSopanMenghormati,
    tanggung_jawab_jujur_profesional: record.tanggungJawabJujurProfesional,
    tidak_terima_hadiah: record.tidakTerimaHadiah,
    pelayanan_sesuai_kewenangan: record.pelayananSesuaiKewenangan,
    memenuhi_panggilan_kedinasan: record.memenuhiPanggilanKedinasan,
    bekerja_penuh_tanggung_jawab: record.bekerjaPenuhTanggungJawab,
    catatan: record.catatan || null,
    evaluator_id: evaluatorId || null,
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Convert row from public.master to EvaluationRecord (App model)
 */
export function mapMasterRowToEvaluationRecord(row: any, unitsList: Unit[] = []): EvaluationRecord {
  const rawUnit = row['Ruang/Unit/Instalasi'] || row.unit_nama || 'Instalasi Gawat Darurat (IGD)';
  const matchedUnit = unitsList.find(
    (u) =>
      u.nama.toLowerCase() === rawUnit.toLowerCase() ||
      u.id.toLowerCase() === rawUnit.toLowerCase() ||
      rawUnit.toLowerCase().includes(u.nama.toLowerCase()) ||
      u.nama.toLowerCase().includes(rawUnit.toLowerCase())
  );
  const unitId = matchedUnit ? matchedUnit.id : rawUnit.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'igd';
  const unitNama = matchedUnit ? matchedUnit.nama : rawUnit;

  const today = new Date().toISOString().split('T')[0];
  const timeStr = row['Timestamp'] || '';

  return {
    id: String(row.id || `master-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    unitId,
    unitNama,
    nama: row['DAFTAR NAMA'] || row.nama || 'Pegawai',
    nip: row.nip || '',
    jabatan: row.jabatan || '',
    tanggal: row.tanggal || today,
    shift: (row.shift as any) || 'Pagi',
    seragamSesuaiKetentuan: Number(row['MENGGUNAKAN SERAGAM SESUAI KETENTUAN RUMAH SAKIT'] ?? 5) || 5,
    atributKerjaSesuaiKetentuan:
      Number(
        row['MENGGUNAKAN ATRIBUT KERJA SESUAI KETENTUAN RUMAH SAKIT (NAME TA'] ??
          row['MENGGUNAKAN ATRIBUT KERJA SESUAI KETENTUAN RUMAH SAKIT (NAME TAG)'] ??
          5
      ) || 5,
    sepatuSaatPelayanan:
      Number(
        row['MENGGUNAKAN SEPATU SAAT MEMBERIKAN PELAYANAN KEPADA TAMU ATAU P'] ??
          row['MENGGUNAKAN SEPATU SAAT MEMBERIKAN PELAYANAN KEPADA TAMU ATAU PASIEN'] ??
          5
      ) || 5,
    salamPrimaLingkunganRS: Number(row['MENERAPKAN SALAM PRIMA DI LINGKUNGAN RUMAH SAKIT'] ?? 5) || 5,
    identitasIdCard:
      (row['menggunakan identitas nama / id card / tanda pengenal saat bertuga'] ??
        row['menggunakan identitas nama/ id card/tanda pengenal saat bertugas'] ??
        'Ya') === 'Tidak'
        ? 'Tidak'
        : 'Ya',
    pinAtributLogo:
      (row['menggunakan pin / atribut / logo pelayanan sesuai ketentuan'] ?? 'Ya') === 'Tidak' ? 'Tidak' : 'Ya',
    menerapkanSalamPrima: (row['Menerapkan salam prima'] ?? 'Ya') === 'Tidak' ? 'Tidak' : 'Ya',
    seragamKerjaAturan:
      (row['Menggunakan seragam kerja sesuai aturan yang  berlaku'] ??
        row['Menggunakan seragam kerja sesuai aturan yang berlaku'] ??
        'Ya') === 'Tidak'
        ? 'Tidak'
        : 'Ya',
    ramahSopanMenghormati:
      (row['Bersikap ramah, sopan dan menghormati pasien / pengunjung'] ?? 'Ya') === 'Tidak' ? 'Tidak' : 'Ya',
    tanggungJawabJujurProfesional:
      (row['Melaksanakan tugas dengan penuh tanggung jawab, jujur dan profe'] ??
        row['Melaksanakan tugas dengan penuh tanggung jawab, jujur dan profesional'] ??
        'Ya') === 'Tidak'
        ? 'Tidak'
        : 'Ya',
    tidakTerimaHadiah:
      (row['Tidak menerima hadiah, uang, atau imbalan dalam bentuk apapun'] ?? 'Ya') === 'Tidak' ? 'Tidak' : 'Ya',
    pelayananSesuaiKewenangan:
      (row['Melaksanakan pelayanan sesuai tugas dan kewenangan yang diberik'] ??
        row['Melaksanakan pelayanan sesuai tugas dan kewenangan yang diberikan'] ??
        'Ya') === 'Tidak'
        ? 'Tidak'
        : 'Ya',
    memenuhiPanggilanKedinasan:
      (row['Memenuhi panggilan untuk hadir atau melaksanakan perintah kedin'] ??
        row['Memenuhi panggilan untuk hadir atau melaksanakan perintah kedinasan'] ??
        'Ya') === 'Tidak'
        ? 'Tidak'
        : 'Ya',
    bekerjaPenuhTanggungJawab:
      (row['Bekerja dengan penuh tanggungjawab'] ?? row['Bekerja dengan penuh tanggung jawab'] ?? 'Ya') === 'Tidak'
        ? 'Tidak'
        : 'Ya',
    catatan: row.catatan || '',
    createdAt: timeStr ? `${today}T${timeStr}` : new Date().toISOString(),
  };
}

/**
 * Convert EvaluationRecord to public.master DB Row
 */
export function mapRecordToMasterRow(record: EvaluationRecord): Record<string, any> {
  const isValidId = UUID_REGEX.test(record.id);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
    now.getSeconds()
  ).padStart(2, '0')}`;

  const row: Record<string, any> = {
    Timestamp: timeStr,
    'Ruang/Unit/Instalasi': record.unitNama,
    'DAFTAR NAMA': record.nama,
    'MENGGUNAKAN SERAGAM SESUAI KETENTUAN RUMAH SAKIT': Number(record.seragamSesuaiKetentuan) || 5,
    'MENGGUNAKAN ATRIBUT KERJA SESUAI KETENTUAN RUMAH SAKIT (NAME TA':
      Number(record.atributKerjaSesuaiKetentuan) || 5,
    'MENGGUNAKAN SEPATU SAAT MEMBERIKAN PELAYANAN KEPADA TAMU ATAU P': Number(record.sepatuSaatPelayanan) || 5,
    'MENERAPKAN SALAM PRIMA DI LINGKUNGAN RUMAH SAKIT': Number(record.salamPrimaLingkunganRS) || 5,
    'menggunakan identitas nama / id card / tanda pengenal saat bertuga': record.identitasIdCard,
    'menggunakan pin / atribut / logo pelayanan sesuai ketentuan': record.pinAtributLogo || 'Ya',
    'Menerapkan salam prima': record.menerapkanSalamPrima,
    'Menggunakan seragam kerja sesuai aturan yang  berlaku': record.seragamKerjaAturan,
    'Bersikap ramah, sopan dan menghormati pasien / pengunjung': record.ramahSopanMenghormati,
    'Melaksanakan tugas dengan penuh tanggung jawab, jujur dan profe': record.tanggungJawabJujurProfesional,
    'Tidak menerima hadiah, uang, atau imbalan dalam bentuk apapun': record.tidakTerimaHadiah,
    'Melaksanakan pelayanan sesuai tugas dan kewenangan yang diberik': record.pelayananSesuaiKewenangan,
    'Memenuhi panggilan untuk hadir atau melaksanakan perintah kedin': record.memenuhiPanggilanKedinasan,
    'Bekerja dengan penuh tanggungjawab': record.bekerjaPenuhTanggungJawab,
  };

  if (isValidId) {
    row.id = record.id;
  }

  return row;
}

/**
 * SQL Definition for public.master table with RLS
 */
export const MASTER_TABLE_DDL_SQL = `-- ============================================================================
-- TABEL: public.master (Format Sesuai Google Form & DDL Rumah Sakit)
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.master (
  "Timestamp" time without time zone null,
  id uuid not null default gen_random_uuid (),
  "Ruang/Unit/Instalasi" text null,
  "DAFTAR NAMA" text null,
  "MENGGUNAKAN SERAGAM SESUAI KETENTUAN RUMAH SAKIT" smallint null,
  "MENGGUNAKAN ATRIBUT KERJA SESUAI KETENTUAN RUMAH SAKIT (NAME TA" smallint null,
  "MENGGUNAKAN SEPATU SAAT MEMBERIKAN PELAYANAN KEPADA TAMU ATAU P" smallint null,
  "MENERAPKAN SALAM PRIMA DI LINGKUNGAN RUMAH SAKIT" smallint null,
  "menggunakan identitas nama / id card / tanda pengenal saat bertuga" text null,
  "menggunakan pin / atribut / logo pelayanan sesuai ketentuan" text null,
  "Menerapkan salam prima" text null,
  "Menggunakan seragam kerja sesuai aturan yang  berlaku" text null,
  "Bersikap ramah, sopan dan menghormati pasien / pengunjung" text null,
  "Melaksanakan tugas dengan penuh tanggung jawab, jujur dan profe" text null,
  "Tidak menerima hadiah, uang, atau imbalan dalam bentuk apapun" text null,
  "Melaksanakan pelayanan sesuai tugas dan kewenangan yang diberik" text null,
  "Memenuhi panggilan untuk hadir atau melaksanakan perintah kedin" text null,
  "Bekerja dengan penuh tanggungjawab" text null,
  constraint master_pkey primary key (id)
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.master ENABLE ROW LEVEL SECURITY;

-- KEBIJAKAN AKSES BACA & TULIS
DROP POLICY IF EXISTS "Master: Akses Baca Publik / Authenticated" ON public.master;
CREATE POLICY "Master: Akses Baca Publik / Authenticated" ON public.master FOR SELECT USING (true);

DROP POLICY IF EXISTS "Master: Akses Tambah / Simpan Data" ON public.master;
CREATE POLICY "Master: Akses Tambah / Simpan Data" ON public.master FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Master: Akses Edit Data" ON public.master;
CREATE POLICY "Master: Akses Edit Data" ON public.master FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Master: Akses Hapus Data" ON public.master;
CREATE POLICY "Master: Akses Hapus Data" ON public.master FOR DELETE USING (true);
`;

// Re-export Schema Discrepancy Detector and Comparator for Supabase vs public.master
export {
  detectSchemaDiscrepancies,
  MASTER_SCHEMA_COLUMNS,
  type SchemaDiscrepancyReport,
  type ColumnDiscrepancy,
  type MasterColumnDefinition,
} from './schema_comparator';

