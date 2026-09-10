export const SUPABASE_FULL_SCHEMA_SQL = `-- ============================================================================
-- SUPABASE POSTGRESQL SCHEMA: EVALUASI KEPATUHAN & DISIPLIN PEGAWAI RS
-- Lengkap dengan: RBAC, RLS, Triggers, Functions, dan Data Awal Rumah Sakit
-- Salin seluruh teks ini & jalankan di Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'komite_mutu', 'kepala_ruangan', 'staf_pegawai');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.unit_category AS ENUM ('Instalasi', 'Ruangan', 'Unit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.shift_type AS ENUM ('Pagi', 'Siang', 'Malam', 'Non-Shift');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.compliance_choice AS ENUM ('Ya', 'Tidak');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE: UNITS (Ruangan / Unit / Instalasi Rumah Sakit)
CREATE TABLE IF NOT EXISTS public.units (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama TEXT NOT NULL,
  kategori public.unit_category NOT NULL DEFAULT 'Ruangan',
  lokasi TEXT,
  kepala_ruangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLE: PROFILES (Extends auth.users dengan role RBAC & penempatan unit)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  nip TEXT,
  role public.app_role NOT NULL DEFAULT 'staf_pegawai',
  unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
  jabatan TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLE: EVALUATION_RECORDS (Formulir Penilaian 13 Kriteria Sesuai Gambar)
CREATE TABLE IF NOT EXISTS public.evaluation_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  unit_nama TEXT NOT NULL,
  nama TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  shift public.shift_type NOT NULL DEFAULT 'Pagi',

  -- 4 Kolom Skala Nilai (1 s/d 5)
  seragam_sesuai_ketentuan SMALLINT NOT NULL CHECK (seragam_sesuai_ketentuan BETWEEN 1 AND 5),
  atribut_kerja_sesuai_ketentuan SMALLINT NOT NULL CHECK (atribut_kerja_sesuai_ketentuan BETWEEN 1 AND 5),
  sepatu_saat_pelayanan SMALLINT NOT NULL CHECK (sepatu_saat_pelayanan BETWEEN 1 AND 5),
  salam_prima_lingkungan_rs SMALLINT NOT NULL CHECK (salam_prima_lingkungan_rs BETWEEN 1 AND 5),

  -- 10 Kolom Kepatuhan Budaya Kerja & Etika (Ya / Tidak)
  identitas_id_card public.compliance_choice NOT NULL DEFAULT 'Ya',
  pin_atribut_logo public.compliance_choice NOT NULL DEFAULT 'Ya',
  menerapkan_salam_prima public.compliance_choice NOT NULL DEFAULT 'Ya',
  seragam_kerja_aturan public.compliance_choice NOT NULL DEFAULT 'Ya',
  ramah_sopan_menghormati public.compliance_choice NOT NULL DEFAULT 'Ya',
  tanggung_jawab_jujur_profesional public.compliance_choice NOT NULL DEFAULT 'Ya',
  tidak_terima_hadiah public.compliance_choice NOT NULL DEFAULT 'Ya',
  pelayanan_sesuai_kewenangan public.compliance_choice NOT NULL DEFAULT 'Ya',
  memenuhi_panggilan_kedinasan public.compliance_choice NOT NULL DEFAULT 'Ya',
  bekerja_penuh_tanggung_jawab public.compliance_choice NOT NULL DEFAULT 'Ya',

  catatan TEXT,
  evaluator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5B. TABLE: MASTER (Format Sesuai Google Form & DDL Tabel Master RS)
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

-- 6. TABLE: AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.evaluation_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. HELPER FUNCTIONS FOR RBAC & RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_komite_mutu()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role IN ('super_admin', 'komite_mutu') FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_kepala_ruangan()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role = 'kepala_ruangan' FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.get_my_unit_id()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT unit_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 8. TRIGGER: AUTO CREATE PROFILE WHEN USER SIGNS UP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'staf_pegawai'::public.app_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master ENABLE ROW LEVEL SECURITY;

-- UNITS POLICIES
DROP POLICY IF EXISTS "Units: Everyone can view units" ON public.units;
CREATE POLICY "Units: Everyone can view units" ON public.units FOR SELECT USING (true);

DROP POLICY IF EXISTS "Units: Super Admin & Komite Mutu can insert" ON public.units;
CREATE POLICY "Units: Super Admin & Komite Mutu can insert" ON public.units FOR INSERT WITH CHECK (public.is_komite_mutu());

DROP POLICY IF EXISTS "Units: Super Admin & Komite Mutu can update" ON public.units;
CREATE POLICY "Units: Super Admin & Komite Mutu can update" ON public.units FOR UPDATE USING (public.is_komite_mutu()) WITH CHECK (public.is_komite_mutu());

DROP POLICY IF EXISTS "Units: Super Admin can delete" ON public.units;
CREATE POLICY "Units: Super Admin can delete" ON public.units FOR DELETE USING (public.is_super_admin());

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles: Users can read own profile or admins" ON public.profiles;
CREATE POLICY "Profiles: Users can read own profile or admins" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_komite_mutu() OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id()) OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Profiles: Update policy" ON public.profiles;
CREATE POLICY "Profiles: Update policy" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_super_admin());

-- EVALUATION_RECORDS POLICIES
DROP POLICY IF EXISTS "EvalRecords: Select policy based on RBAC" ON public.evaluation_records;
CREATE POLICY "EvalRecords: Select policy based on RBAC" ON public.evaluation_records FOR SELECT
  USING (public.is_komite_mutu() OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id()) OR (unit_id = public.get_my_unit_id()) OR auth.role() = 'anon');

DROP POLICY IF EXISTS "EvalRecords: Insert policy based on RBAC" ON public.evaluation_records;
CREATE POLICY "EvalRecords: Insert policy based on RBAC" ON public.evaluation_records FOR INSERT
  WITH CHECK (public.is_komite_mutu() OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id()) OR auth.role() = 'anon');

DROP POLICY IF EXISTS "EvalRecords: Update policy based on RBAC" ON public.evaluation_records;
CREATE POLICY "EvalRecords: Update policy based on RBAC" ON public.evaluation_records FOR UPDATE
  USING (public.is_komite_mutu() OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id()) OR auth.role() = 'anon')
  WITH CHECK (public.is_komite_mutu() OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id()) OR auth.role() = 'anon');

DROP POLICY IF EXISTS "EvalRecords: Delete policy based on RBAC" ON public.evaluation_records;
CREATE POLICY "EvalRecords: Delete policy based on RBAC" ON public.evaluation_records FOR DELETE
  USING (public.is_komite_mutu() OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id()) OR auth.role() = 'anon');

-- MASTER TABLE POLICIES (Google Form & Direct Sync)
DROP POLICY IF EXISTS "Master: Select policy" ON public.master;
CREATE POLICY "Master: Select policy" ON public.master FOR SELECT USING (true);

DROP POLICY IF EXISTS "Master: Insert policy" ON public.master;
CREATE POLICY "Master: Insert policy" ON public.master FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Master: Update policy" ON public.master;
CREATE POLICY "Master: Update policy" ON public.master FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Master: Delete policy" ON public.master;
CREATE POLICY "Master: Delete policy" ON public.master FOR DELETE USING (true);

-- 10. SEED INITIAL UNITS
INSERT INTO public.units (id, nama, kategori, lokasi, kepala_ruangan)
VALUES
  ('bidang-perencanaan', 'BIDANG PERENCANAAN', 'Unit', 'Gedung Administrasi Lantai 2', NULL),
  ('umum-dan-kepegawaian', 'UMUM DAN KEPEGAWAIAN', 'Unit', 'Gedung Administrasi Lantai 1', NULL),
  ('komite-medik', 'KOMITE MEDIK', 'Unit', 'Gedung Manajemen Lantai 2', NULL),
  ('belibis', 'BELIBIS', 'Ruangan', 'Gedung Rawat Inap Blok A', NULL),
  ('cendrawasih', 'CENDRAWASIH', 'Ruangan', 'Gedung Rawat Inap Blok B', NULL),
  ('elang', 'ELANG', 'Ruangan', 'Gedung Rawat Inap Blok C', NULL),
  ('enggang', 'ENGGANG', 'Ruangan', 'Gedung Rawat Inap Blok D', NULL),
  ('gelatik', 'GELATIK', 'Ruangan', 'Gedung Rawat Inap Blok E', NULL),
  ('igd', 'IGD', 'Instalasi', 'Gedung Gawat Darurat Lantai 1', NULL),
  ('inst-farmasi', 'INST FARMASI', 'Instalasi', 'Gedung Pelayanan Sentral Lantai 1', NULL),
  ('inst-gizi', 'INST GIZI', 'Instalasi', 'Gedung Penunjang Lantai 1', NULL),
  ('inst-k3', 'INST K3', 'Instalasi', 'Gedung Penunjang Lantai 2', NULL),
  ('inst-kesling', 'INST KESLING', 'Instalasi', 'Gedung Instalasi Sanitasi & IPAL', NULL),
  ('inst-laboratorium', 'INST LABORATORIUM', 'Instalasi', 'Gedung Diagnostik Lantai 1', NULL),
  ('inst-mcu', 'INST MCU', 'Instalasi', 'Gedung Rawat Jalan Lantai 2', NULL),
  ('cssd-loundry', 'CSSD LOUNDRY', 'Instalasi', 'Gedung Penunjang Medik Lantai 1', NULL),
  ('ipsrs', 'IPSRS', 'Instalasi', 'Gedung Pemeliharaan Sarana (IPSRS)', NULL),
  ('radiologi', 'RADIOLOGI', 'Instalasi', 'Gedung Diagnostik Lantai 1', NULL),
  ('inst-rawat-inap', 'INST RAWAT INAP', 'Instalasi', 'Gedung Rawat Inap Terpadu', NULL),
  ('inst-rawat-jalan', 'INST RAWAT JALAN', 'Instalasi', 'Gedung Poliklinik Lantai 1', NULL),
  ('rehab-medik', 'REHAB MEDIK', 'Instalasi', 'Gedung Fisioterapi Lantai 1', NULL),
  ('rehab-psikososial', 'REHAB PSIKOSOSIAL', 'Instalasi', 'Gedung Unit Rehabilitasi Psikososial', NULL),
  ('inst-napza', 'INST NAPZA', 'Instalasi', 'Gedung Rehabilitasi NAPZA Terpadu', NULL),
  ('pergam-napza', 'PERGAM NAPZA', 'Ruangan', 'Gedung NAPZA Ruangan Pergam', NULL),
  ('perlengkapan', 'PERLENGKAPAN', 'Unit', 'Gedung Logistik & Gudang Perlengkapan', NULL),
  ('punai', 'PUNAI', 'Ruangan', 'Gedung Rawat Inap Blok F', NULL),
  ('simrs', 'SIMRS', 'Unit', 'Gedung IT & Data Center Lantai 2', NULL),
  ('ruang-icu', 'Ruang ICU', 'Ruangan', 'Gedung Perawatan Intensif Lantai 2', NULL),
  ('ruang-upip', 'Ruang upip', 'Ruangan', 'Gedung Unit Perawatan Intensif Psikiatri', NULL),
  ('ruang-tiung', 'RUANG TIUNG', 'Ruangan', 'Gedung Rawat Inap Blok G', NULL),
  ('bagian-keamanan', 'BAGIAN KEAMANAN', 'Unit', 'Pos Keamanan Terpadu & CCTV', NULL),
  ('inst-rekam-medik', 'INST REKAM MEDIK', 'Instalasi', 'Gedung Admisi & Rekam Medik Lantai 1', NULL),
  ('bagian-keuangan', 'BAGIAN KEUANGAN', 'Unit', 'Gedung Administrasi Lantai 2', NULL),
  ('bidang-diklat', 'BIDANG DIKLAT', 'Unit', 'Gedung Aula & Diklat Lantai 3', NULL),
  ('bidang-keperawatan', 'BIDANG KEPERAWATAN', 'Unit', 'Gedung Administrasi Lantai 2', NULL),
  ('pelayanan-medis', 'PELAYANAN MEDIS', 'Unit', 'Gedung Manajemen Lantai 2', NULL),
  ('penunjang-medik', 'PENUNJANG MEDIK', 'Unit', 'Gedung Manajemen Penunjang Lantai 2', NULL),
  ('penunjang-non-medik', 'PENUNJANG NON MEDIK', 'Unit', 'Gedung Manajemen Penunjang Lantai 1', NULL)
ON CONFLICT (id) DO UPDATE
SET nama = EXCLUDED.nama, kategori = EXCLUDED.kategori, lokasi = EXCLUDED.lokasi, kepala_ruangan = EXCLUDED.kepala_ruangan;

-- 11. TABEL EVALUASI BERSIH TANPA DATA DUMMY
-- Data evaluasi diisi langsung secara riil oleh penilai (Kepala Ruangan / Komite Mutu) melalui aplikasi.
`;

export const SUPABASE_MASTER_TABLE_SQL = `-- ============================================================================
-- TABEL: public.master (Format Sesuai Google Form & DDL Tabel Master RS)
-- Jalankan di: Supabase Dashboard -> SQL Editor -> Run
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

-- KEBIJAKAN AKSES (BACA / SIMPAN / EDIT / HAPUS)
DROP POLICY IF EXISTS "Master: Akses Baca Publik / Authenticated" ON public.master;
CREATE POLICY "Master: Akses Baca Publik / Authenticated" ON public.master FOR SELECT USING (true);

DROP POLICY IF EXISTS "Master: Akses Tambah Data" ON public.master;
CREATE POLICY "Master: Akses Tambah Data" ON public.master FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Master: Akses Update Data" ON public.master;
CREATE POLICY "Master: Akses Update Data" ON public.master FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Master: Akses Hapus Data" ON public.master;
CREATE POLICY "Master: Akses Hapus Data" ON public.master FOR DELETE USING (true);
`;
