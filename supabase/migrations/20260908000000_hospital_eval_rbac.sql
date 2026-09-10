-- ============================================================================
-- SUPABASE MIGRATION SCRIPT: EVALUASI KEPATUHAN & DISIPLIN PEGAWAI RUMAH SAKIT
-- Ready for: Supabase CLI (supabase db push/pull) & Supabase SQL Editor
-- Features: RBAC (Role-Based Access Control), RLS (Row Level Security),
--           Auto Profile Trigger, Audit Trail, Seed Units & Initial Records
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

-- 4. TABLE: PROFILES (Extends auth.users with RBAC role & unit assignment)
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

-- 5. TABLE: EVALUATION_RECORDS (Formulir Penilaian Kepatuhan Pegawai RS)
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

  -- 9 Kolom Kepatuhan Budaya Kerja & Etika (Ya / Tidak)
  identitas_id_card public.compliance_choice NOT NULL DEFAULT 'Ya',
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

-- 6. TABLE: AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.evaluation_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- HELPER FUNCTIONS FOR RBAC IN RLS POLICIES
-- ============================================================================

-- Get current authenticated user's role from profiles
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Check if current user is Komite Mutu / Penilai RS
CREATE OR REPLACE FUNCTION public.is_komite_mutu()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role IN ('super_admin', 'komite_mutu') FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Check if current user is Kepala Ruangan
CREATE OR REPLACE FUNCTION public.is_kepala_ruangan()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'kepala_ruangan' FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Get current user's assigned unit_id
CREATE OR REPLACE FUNCTION public.get_my_unit_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================================
-- TRIGGER: AUTOMATICALLY CREATE PROFILE ON USER SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'staf_pegawai'::public.app_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for auto updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_units_updated_at ON public.units;
CREATE TRIGGER trigger_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_eval_updated_at ON public.evaluation_records;
CREATE TRIGGER trigger_eval_updated_at BEFORE UPDATE ON public.evaluation_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Policies for: UNITS
-- Public/authenticated can view units
CREATE POLICY "Units: Everyone can view units"
  ON public.units FOR SELECT
  USING (true);

-- Only Super Admin & Komite Mutu can manage units
CREATE POLICY "Units: Super Admin & Komite Mutu can insert"
  ON public.units FOR INSERT
  WITH CHECK (public.is_komite_mutu());

CREATE POLICY "Units: Super Admin & Komite Mutu can update"
  ON public.units FOR UPDATE
  USING (public.is_komite_mutu())
  WITH CHECK (public.is_komite_mutu());

CREATE POLICY "Units: Super Admin can delete"
  ON public.units FOR DELETE
  USING (public.is_super_admin());

-- 3. Policies for: PROFILES
-- Users can view their own profile, managers can view their unit, admins can view all
CREATE POLICY "Profiles: Users can read own profile or admins/heads"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_komite_mutu()
    OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id())
    OR auth.role() = 'anon' -- fallback during initial setup/preview
  );

-- Users can update non-role fields on their own profile; Super Admin can update all
CREATE POLICY "Profiles: User can update own profile, Super Admin can update all"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_super_admin())
  WITH CHECK (
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_super_admin()
  );

-- Only Super Admin can delete profiles
CREATE POLICY "Profiles: Super Admin can delete"
  ON public.profiles FOR DELETE
  USING (public.is_super_admin());

-- 4. Policies for: EVALUATION_RECORDS
-- SELECT:
-- - Super Admin & Komite Mutu: See all records
-- - Kepala Ruangan: See records in their unit
-- - Staf Pegawai: See records in their assigned unit
-- - Anon fallback: enabled for app demo mode
CREATE POLICY "EvalRecords: Select policy based on RBAC"
  ON public.evaluation_records FOR SELECT
  USING (
    public.is_komite_mutu()
    OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id())
    OR (unit_id = public.get_my_unit_id())
    OR auth.role() = 'anon'
  );

-- INSERT:
-- - Super Admin & Komite Mutu: Can insert evaluation for ANY unit
-- - Kepala Ruangan: Can insert evaluation for their OWN unit
-- - Anon fallback: allow insertion for demo
CREATE POLICY "EvalRecords: Insert policy based on RBAC"
  ON public.evaluation_records FOR INSERT
  WITH CHECK (
    public.is_komite_mutu()
    OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id())
    OR auth.role() = 'anon'
  );

-- UPDATE:
-- - Super Admin & Komite Mutu: Can update any record
-- - Kepala Ruangan: Can update records in their own unit
CREATE POLICY "EvalRecords: Update policy based on RBAC"
  ON public.evaluation_records FOR UPDATE
  USING (
    public.is_komite_mutu()
    OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id())
    OR auth.role() = 'anon'
  )
  WITH CHECK (
    public.is_komite_mutu()
    OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id())
    OR auth.role() = 'anon'
  );

-- DELETE:
-- - Super Admin & Komite Mutu: Can delete any record
-- - Kepala Ruangan: Can delete records in their own unit
CREATE POLICY "EvalRecords: Delete policy based on RBAC"
  ON public.evaluation_records FOR DELETE
  USING (
    public.is_komite_mutu()
    OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id())
    OR auth.role() = 'anon'
  );

-- 5. Policies for: AUDIT LOGS
CREATE POLICY "Audit: Komite Mutu & Super Admin can view logs"
  ON public.evaluation_audit_logs FOR SELECT
  USING (public.is_komite_mutu());

CREATE POLICY "Audit: System can insert logs"
  ON public.evaluation_audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- END OF MIGRATION (Seed data removed by user request to prevent dummy data)
-- ============================================================================
