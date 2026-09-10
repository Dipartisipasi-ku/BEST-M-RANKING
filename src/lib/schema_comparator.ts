import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase, isSupabaseConfigured } from './supabase_config';

/**
 * Definition of a column specification in public.master
 */
export interface MasterColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  evalRecordEquivalent: string;
  evalRecordType: string;
  category: 'metadata' | 'rating_1_to_5' | 'compliance_boolean' | 'identifier';
  description: string;
}

/**
 * All 18 columns defined in public.master SQL schema
 */
export const MASTER_SCHEMA_COLUMNS: MasterColumnDefinition[] = [
  {
    name: 'Timestamp',
    type: 'time without time zone',
    nullable: true,
    evalRecordEquivalent: 'Timestamp / created_at',
    evalRecordType: 'TIMESTAMPTZ / time without time zone',
    category: 'metadata',
    description: 'Waktu pencatatan evaluasi Google Form (HH:MM:SS)',
  },
  {
    name: 'id',
    type: 'uuid',
    nullable: false,
    defaultValue: 'gen_random_uuid()',
    evalRecordEquivalent: 'id',
    evalRecordType: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    category: 'identifier',
    description: 'Primary Key identitas unik rekaman evaluasi',
  },
  {
    name: 'Ruang/Unit/Instalasi',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'unit_nama',
    evalRecordType: 'TEXT NOT NULL',
    category: 'metadata',
    description: 'Nama unit, ruangan, atau instalasi rumah sakit',
  },
  {
    name: 'DAFTAR NAMA',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'nama',
    evalRecordType: 'TEXT NOT NULL',
    category: 'metadata',
    description: 'Nama lengkap staf atau tenaga kesehatan yang dievaluasi',
  },
  {
    name: 'MENGGUNAKAN SERAGAM SESUAI KETENTUAN RUMAH SAKIT',
    type: 'smallint',
    nullable: true,
    evalRecordEquivalent: 'seragam_sesuai_ketentuan',
    evalRecordType: 'SMALLINT (1-5)',
    category: 'rating_1_to_5',
    description: 'Skor 1-5 kepatuhan seragam harian rumah sakit',
  },
  {
    name: 'MENGGUNAKAN ATRIBUT KERJA SESUAI KETENTUAN RUMAH SAKIT (NAME TA',
    type: 'smallint',
    nullable: true,
    evalRecordEquivalent: 'atribut_kerja_sesuai_ketentuan',
    evalRecordType: 'SMALLINT (1-5)',
    category: 'rating_1_to_5',
    description: 'Skor 1-5 penggunaan atribut kerja & name tag',
  },
  {
    name: 'MENGGUNAKAN SEPATU SAAT MEMBERIKAN PELAYANAN KEPADA TAMU ATAU P',
    type: 'smallint',
    nullable: true,
    evalRecordEquivalent: 'sepatu_saat_pelayanan',
    evalRecordType: 'SMALLINT (1-5)',
    category: 'rating_1_to_5',
    description: 'Skor 1-5 penggunaan sepatu standar saat pelayanan',
  },
  {
    name: 'MENERAPKAN SALAM PRIMA DI LINGKUNGAN RUMAH SAKIT',
    type: 'smallint',
    nullable: true,
    evalRecordEquivalent: 'salam_prima_lingkungan_rs',
    evalRecordType: 'SMALLINT (1-5)',
    category: 'rating_1_to_5',
    description: 'Skor 1-5 penerapan salam prima 5S di lingkungan RS',
  },
  {
    name: 'menggunakan identitas nama / id card / tanda pengenal saat bertuga',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'identitas_id_card',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan ID Card / tanda pengenal bertugas',
  },
  {
    name: 'menggunakan pin / atribut / logo pelayanan sesuai ketentuan',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'pin_atribut_logo',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan pin / atribut / logo pelayanan sesuai ketentuan',
  },
  {
    name: 'Menerapkan salam prima',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'menerapkan_salam_prima',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan etika salam prima saat pelayanan',
  },
  {
    name: 'Menggunakan seragam kerja sesuai aturan yang  berlaku',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'seragam_kerja_aturan',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan seragam kerja sesuai aturan berlaku',
  },
  {
    name: 'Bersikap ramah, sopan dan menghormati pasien / pengunjung',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'ramah_sopan_menghormati',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan sikap ramah, sopan & menghormati pengunjung',
  },
  {
    name: 'Melaksanakan tugas dengan penuh tanggung jawab, jujur dan profe',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'tanggung_jawab_jujur_profesional',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan tanggung jawab, jujur dan profesional',
  },
  {
    name: 'Tidak menerima hadiah, uang, atau imbalan dalam bentuk apapun',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'tidak_terima_hadiah',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan integritas anti-gratifikasi / imbalan',
  },
  {
    name: 'Melaksanakan pelayanan sesuai tugas dan kewenangan yang diberik',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'pelayanan_sesuai_kewenangan',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan pelayanan sesuai tugas & kewenangan klinis',
  },
  {
    name: 'Memenuhi panggilan untuk hadir atau melaksanakan perintah kedin',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'memenuhi_panggilan_kedinasan',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan memenuhi panggilan kedinasan / rapat dinas',
  },
  {
    name: 'Bekerja dengan penuh tanggungjawab',
    type: 'text',
    nullable: true,
    evalRecordEquivalent: 'bekerja_penuh_tanggung_jawab',
    evalRecordType: "compliance_choice / text ('Ya' | 'Tidak')",
    category: 'compliance_boolean',
    description: 'Kepatuhan bekerja dengan penuh tanggung jawab',
  },
];

/**
 * Result structure of discrepancy detection for a single column
 */
export interface ColumnDiscrepancy {
  masterColumn: string;
  evalColumnEquivalent: string;
  category: string;
  status: 'missing_in_eval' | 'type_or_naming_discrepancy' | 'synced' | 'untested';
  statusLabel: string;
  severity: 'critical' | 'warning' | 'info' | 'ok';
  masterType: string;
  evalType: string;
  detectedInLiveDb: boolean | null;
  alterTableQuery: string;
  explanation: string;
}

/**
 * Full report structure of schema discrepancy audit
 */
export interface SchemaDiscrepancyReport {
  timestamp: string;
  isLiveConnection: boolean;
  hasMasterTable: boolean;
  hasEvalTable: boolean;
  liveEvalColumnsFound: string[];
  liveMasterColumnsFound: string[];
  discrepancies: ColumnDiscrepancy[];
  generatedAlterQueries: string[];
  migrationScriptSql: string;
  summary: {
    totalMasterColumns: number;
    syncedCount: number;
    criticalMissingCount: number;
    namingDiscrepanciesCount: number;
  };
}

/**
 * Detects discrepancies between the existing 'evaluation_records' table in Supabase
 * and the provided 'public.master' SQL schema.
 * 
 * Generates the necessary ALTER TABLE queries to update the live database to match
 * the new master requirements.
 */
export async function detectSchemaDiscrepancies(
  customClient?: SupabaseClient | null
): Promise<SchemaDiscrepancyReport> {
  const client = customClient !== undefined ? customClient : defaultSupabase;
  const isLive = Boolean(isSupabaseConfigured && client);

  const liveEvalColumnsFound: string[] = [];
  const liveMasterColumnsFound: string[] = [];
  let hasMasterTable = false;
  let hasEvalTable = false;

  // Probing live Supabase database if connected
  if (isLive && client) {
    try {
      // 1. Test evaluation_records table presence and column availability
      const { data: evalSample, error: evalErr } = await client
        .from('evaluation_records')
        .select('*')
        .limit(1);

      if (!evalErr) {
        hasEvalTable = true;
        if (evalSample && evalSample.length > 0) {
          liveEvalColumnsFound.push(...Object.keys(evalSample[0]));
        } else {
          // Probe known columns individually if table is currently empty
          const testCols = [
            'id',
            'unit_id',
            'unit_nama',
            'nama',
            'seragam_sesuai_ketentuan',
            'atribut_kerja_sesuai_ketentuan',
            'sepatu_saat_pelayanan',
            'salam_prima_lingkungan_rs',
            'identitas_id_card',
            'pin_atribut_logo',
            'menerapkan_salam_prima',
            'seragam_kerja_aturan',
            'ramah_sopan_menghormati',
            'tanggung_jawab_jujur_profesional',
            'tidak_terima_hadiah',
            'pelayanan_sesuai_kewenangan',
            'memenuhi_panggilan_kedinasan',
            'bekerja_penuh_tanggung_jawab',
            'Timestamp',
          ];

          for (const col of testCols) {
            const { error: colErr } = await client
              .from('evaluation_records')
              .select(col)
              .limit(0);
            if (!colErr) {
              liveEvalColumnsFound.push(col);
            }
          }
        }
      }

      // 2. Test master table presence and column availability
      const { data: masterSample, error: masterErr } = await client
        .from('master')
        .select('*')
        .limit(1);

      if (!masterErr) {
        hasMasterTable = true;
        if (masterSample && masterSample.length > 0) {
          liveMasterColumnsFound.push(...Object.keys(masterSample[0]));
        }
      }
    } catch {
      // Fall back gracefully to static structural comparison if network fails
    }
  }

  const discrepancies: ColumnDiscrepancy[] = [];
  const alterQueries: string[] = [];

  for (const masterCol of MASTER_SCHEMA_COLUMNS) {
    const isLiveTested = liveEvalColumnsFound.length > 0;
    const isPresentInEval = isLiveTested
      ? liveEvalColumnsFound.includes(masterCol.evalRecordEquivalent.split(' ')[0])
      : true;

    // Special check for pin_atribut_logo:
    // In live DBs created with older schemas, pin_atribut_logo is frequently missing
    const isPinAtributCol = masterCol.name === 'menggunakan pin / atribut / logo pelayanan sesuai ketentuan';
    const isTimestampCol = masterCol.name === 'Timestamp';

    let status: ColumnDiscrepancy['status'] = 'synced';
    let statusLabel = 'Tersinkronisasi';
    let severity: ColumnDiscrepancy['severity'] = 'ok';
    let alterQuery = '';
    let explanation = `Kolom '${masterCol.name}' pada master telah memiliki padanan valid '${masterCol.evalRecordEquivalent}' di evaluation_records.`;

    if (isPinAtributCol && isLiveTested && !liveEvalColumnsFound.includes('pin_atribut_logo')) {
      status = 'missing_in_eval';
      statusLabel = 'KOLOM HILANG DI EVALUATION_RECORDS';
      severity = 'critical';
      alterQuery = `ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS pin_atribut_logo text DEFAULT 'Ya';`;
      explanation = `Kolom kepatuhan pin/atribut logo belum ada di tabel live evaluation_records. Perlu dieksekusi ALTER TABLE agar data 10 nilai kepatuhan tidak hilang.`;
    } else if (isPinAtributCol && !isLiveTested) {
      status = 'missing_in_eval';
      statusLabel = 'PERLU VERIFIKASI ALTER TABLE';
      severity = 'warning';
      alterQuery = `ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS pin_atribut_logo text DEFAULT 'Ya';`;
      explanation = `Pastikan tabel live evaluation_records telah menjalankan penambahan kolom pin_atribut_logo untuk kesesuaian 10 kepatuhan master.`;
    } else if (isTimestampCol) {
      const hasTimestamp = liveEvalColumnsFound.includes('Timestamp');
      status = hasTimestamp ? 'synced' : 'type_or_naming_discrepancy';
      statusLabel = hasTimestamp ? 'Tersinkronisasi' : 'Perbedaan Tipe / Naming';
      severity = hasTimestamp ? 'ok' : 'info';
      alterQuery = `ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS "Timestamp" time without time zone DEFAULT CURRENT_TIME;`;
      explanation = `Master menggunakan kolom "Timestamp" (time without time zone), sedangkan evaluation_records menggunakan created_at (TIMESTAMPTZ). Disarankan menambahkan alias kolom "Timestamp".`;
    } else if (masterCol.name !== masterCol.evalRecordEquivalent) {
      status = 'type_or_naming_discrepancy';
      statusLabel = 'Perbedaan Format Penamaan';
      severity = 'info';
      explanation = `Master memakai penamaan natural Google Form ("${masterCol.name}"), sedangkan evaluation_records memakai format snake_case ("${masterCol.evalRecordEquivalent}").`;
    }

    if (alterQuery && !alterQueries.includes(alterQuery)) {
      alterQueries.push(alterQuery);
    }

    discrepancies.push({
      masterColumn: masterCol.name,
      evalColumnEquivalent: masterCol.evalRecordEquivalent,
      category: masterCol.category,
      status,
      statusLabel,
      severity,
      masterType: masterCol.type,
      evalType: masterCol.evalRecordType,
      detectedInLiveDb: isLiveTested ? isPresentInEval : null,
      alterTableQuery: alterQuery,
      explanation,
    });
  }

  // Add additional schema resilience ALTER statements
  const additionalAlterQueries = [
    `-- Menjadikan unit_id dapat menerima null jika import master hanya menyediakan nama unit`,
    `ALTER TABLE public.evaluation_records ALTER COLUMN unit_id DROP NOT NULL;`,
    `-- Memastikan tipe kepatuhan pin_atribut_logo mendukung 'Ya' / 'Tidak'`,
    `DO $$ \nBEGIN \n  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_choice') THEN \n    BEGIN \n      ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS pin_atribut_logo public.compliance_choice DEFAULT 'Ya'; \n    EXCEPTION WHEN OTHERS THEN \n      ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS pin_atribut_logo text DEFAULT 'Ya'; \n    END; \n  ELSE \n    ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS pin_atribut_logo text DEFAULT 'Ya'; \n  END IF; \nEND $$;`,
    `-- Memastikan kolom Timestamp tersedia untuk format Google Form langsung`,
    `ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS "Timestamp" time without time zone DEFAULT CURRENT_TIME;`,
  ];

  const fullUnifiedAlterSql = `-- ============================================================================
-- SKRIP MIGRASI OTOMATIS: REKONSILIASI DISKREPANSI EVALUATION_RECORDS VS MASTER
-- Dihasilkan otomatis oleh fungsi: detectSchemaDiscrepancies()
-- Tanggal: ${new Date().toISOString()}
-- ============================================================================

-- 1. Tambahkan kolom pin_atribut_logo (Item kepatuhan ke-10 dari public.master)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_choice') THEN 
    BEGIN 
      ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS pin_atribut_logo public.compliance_choice DEFAULT 'Ya'; 
    EXCEPTION WHEN OTHERS THEN 
      ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS pin_atribut_logo text DEFAULT 'Ya'; 
    END; 
  ELSE 
    ALTER TABLE public.evaluation_records ADD COLUMN IF NOT EXISTS pin_atribut_logo text DEFAULT 'Ya'; 
  END IF; 
END $$;

-- 2. Tambahkan kolom "Timestamp" kompatibel Google Form
ALTER TABLE public.evaluation_records 
  ADD COLUMN IF NOT EXISTS "Timestamp" time without time zone DEFAULT CURRENT_TIME;

-- 3. Longgarkan constraint unit_id agar sinkronisasi dari master tidak gagal akibat foreign key
ALTER TABLE public.evaluation_records 
  ALTER COLUMN unit_id DROP NOT NULL;

-- 4. Longgarkan constraint NOT NULL pada skor numerik jika data master terdapat nilai kosong
ALTER TABLE public.evaluation_records 
  ALTER COLUMN seragam_sesuai_ketentuan DROP NOT NULL;
ALTER TABLE public.evaluation_records 
  ALTER COLUMN atribut_kerja_sesuai_ketentuan DROP NOT NULL;
ALTER TABLE public.evaluation_records 
  ALTER COLUMN sepatu_saat_pelayanan DROP NOT NULL;
ALTER TABLE public.evaluation_records 
  ALTER COLUMN salam_prima_lingkungan_rs DROP NOT NULL;

-- 5. Buat VIEW terpadu yang memetakan kolom evaluation_records ke header public.master
CREATE OR REPLACE VIEW public.v_evaluation_master_aligned AS
SELECT
  er.id,
  COALESCE(er."Timestamp", er.created_at::time) AS "Timestamp",
  er.unit_nama AS "Ruang/Unit/Instalasi",
  er.nama AS "DAFTAR NAMA",
  er.seragam_sesuai_ketentuan AS "MENGGUNAKAN SERAGAM SESUAI KETENTUAN RUMAH SAKIT",
  er.atribut_kerja_sesuai_ketentuan AS "MENGGUNAKAN ATRIBUT KERJA SESUAI KETENTUAN RUMAH SAKIT (NAME TA",
  er.sepatu_saat_pelayanan AS "MENGGUNAKAN SEPATU SAAT MEMBERIKAN PELAYANAN KEPADA TAMU ATAU P",
  er.salam_prima_lingkungan_rs AS "MENERAPKAN SALAM PRIMA DI LINGKUNGAN RUMAH SAKIT",
  er.identitas_id_card AS "menggunakan identitas nama / id card / tanda pengenal saat bertuga",
  COALESCE(er.pin_atribut_logo, 'Ya') AS "menggunakan pin / atribut / logo pelayanan sesuai ketentuan",
  er.menerapkan_salam_prima AS "Menerapkan salam prima",
  er.seragam_kerja_aturan AS "Menggunakan seragam kerja sesuai aturan yang  berlaku",
  er.ramah_sopan_menghormati AS "Bersikap ramah, sopan dan menghormati pasien / pengunjung",
  er.tanggung_jawab_jujur_profesional AS "Melaksanakan tugas dengan penuh tanggung jawab, jujur dan profe",
  er.tidak_terima_hadiah AS "Tidak menerima hadiah, uang, atau imbalan dalam bentuk apapun",
  er.pelayanan_sesuai_kewenangan AS "Melaksanakan pelayanan sesuai tugas dan kewenangan yang diberik",
  er.memenuhi_panggilan_kedinasan AS "Memenuhi panggilan untuk hadir atau melaksanakan perintah kedin",
  er.bekerja_penuh_tanggung_jawab AS "Bekerja dengan penuh tanggungjawab",
  er.unit_id,
  er.nip,
  er.jabatan,
  er.tanggal,
  er.shift,
  er.catatan,
  er.created_at
FROM public.evaluation_records er;

-- 6. Verifikasi skema dengan notifikasi
SELECT 'Migrasi rekonsiliasi evaluation_records vs public.master berhasil dieksekusi!' AS status;
`;

  return {
    timestamp: new Date().toISOString(),
    isLiveConnection: isLive,
    hasMasterTable,
    hasEvalTable,
    liveEvalColumnsFound,
    liveMasterColumnsFound,
    discrepancies,
    generatedAlterQueries: alterQueries.concat(additionalAlterQueries),
    migrationScriptSql: fullUnifiedAlterSql,
    summary: {
      totalMasterColumns: MASTER_SCHEMA_COLUMNS.length,
      syncedCount: discrepancies.filter((d) => d.status === 'synced').length,
      criticalMissingCount: discrepancies.filter((d) => d.severity === 'critical' || d.severity === 'warning').length,
      namingDiscrepanciesCount: discrepancies.filter((d) => d.status === 'type_or_naming_discrepancy').length,
    },
  };
}
