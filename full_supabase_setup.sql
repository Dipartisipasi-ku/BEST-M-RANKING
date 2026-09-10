-- 1. KEMBALIKAN KEAMANAN (RLS) SEPERTI SEMULA (MENGGUNAKAN AUTH.UID)
-- Hapus bypass sementara
DROP POLICY IF EXISTS "Units_Access_All" ON public.units;
DROP POLICY IF EXISTS "EvalRecords_Access_All" ON public.evaluation_records;

-- Aktifkan ulang RLS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. BUAT TABEL PENGATURAN APLIKASI (Untuk RBAC & Konfigurasi Pertanyaan)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY,
  setting_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy Pengaturan: Semua user yang login bisa baca, hanya Super Admin & Komite Mutu yang bisa ubah
DROP POLICY IF EXISTS "Settings: Everyone can read" ON public.app_settings;
CREATE POLICY "Settings: Everyone can read" ON public.app_settings FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Settings: Admin can update" ON public.app_settings;
CREATE POLICY "Settings: Admin can update" ON public.app_settings FOR ALL 
USING (public.is_komite_mutu() OR public.is_super_admin())
WITH CHECK (public.is_komite_mutu() OR public.is_super_admin());

-- Masukkan data awal pengaturan RBAC
INSERT INTO public.app_settings (id, setting_data) 
VALUES (
  'rbac_permissions', 
  '{"super_admin": {"canManageUnits": true, "canManageUsers": true, "canEditSettings": true, "canViewAllEvals": true, "canSubmitEvals": true, "canEditAnyEval": true, "canDeleteAnyEval": true, "canExportData": true}, "komite_mutu": {"canManageUnits": true, "canManageUsers": false, "canEditSettings": true, "canViewAllEvals": true, "canSubmitEvals": true, "canEditAnyEval": true, "canDeleteAnyEval": false, "canExportData": true}, "kepala_ruangan": {"canManageUnits": false, "canManageUsers": false, "canEditSettings": false, "canViewAllEvals": false, "canSubmitEvals": true, "canEditAnyEval": false, "canDeleteAnyEval": false, "canExportData": true}, "staf_pegawai": {"canManageUnits": false, "canManageUsers": false, "canEditSettings": false, "canViewAllEvals": false, "canSubmitEvals": false, "canEditAnyEval": false, "canDeleteAnyEval": false, "canExportData": false}}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 3. PERBARUI POLICY UNITS (MASTER RUANGAN)
DROP POLICY IF EXISTS "Units: Everyone can view units" ON public.units;
CREATE POLICY "Units: Everyone can view units" ON public.units FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Units: Admin can insert" ON public.units;
CREATE POLICY "Units: Admin can insert" ON public.units FOR INSERT WITH CHECK (public.is_komite_mutu() OR public.is_super_admin());

DROP POLICY IF EXISTS "Units: Admin can update" ON public.units;
CREATE POLICY "Units: Admin can update" ON public.units FOR UPDATE USING (public.is_komite_mutu() OR public.is_super_admin());

DROP POLICY IF EXISTS "Units: Admin can delete" ON public.units;
CREATE POLICY "Units: Admin can delete" ON public.units FOR DELETE USING (public.is_super_admin());


-- 4. PERBARUI POLICY EVALUATION_RECORDS (DATA EVALUASI)
DROP POLICY IF EXISTS "EvalRecords: Select policy" ON public.evaluation_records;
CREATE POLICY "EvalRecords: Select policy" ON public.evaluation_records FOR SELECT
USING (
  public.is_super_admin() 
  OR public.is_komite_mutu() 
  OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id())
);

DROP POLICY IF EXISTS "EvalRecords: Insert policy" ON public.evaluation_records;
CREATE POLICY "EvalRecords: Insert policy" ON public.evaluation_records FOR INSERT
WITH CHECK (
  public.is_super_admin() 
  OR public.is_komite_mutu() 
  OR (public.is_kepala_ruangan() AND unit_id = public.get_my_unit_id())
);

DROP POLICY IF EXISTS "EvalRecords: Update policy" ON public.evaluation_records;
CREATE POLICY "EvalRecords: Update policy" ON public.evaluation_records FOR UPDATE
USING (
  public.is_super_admin() 
  OR public.is_komite_mutu() 
);

DROP POLICY IF EXISTS "EvalRecords: Delete policy" ON public.evaluation_records;
CREATE POLICY "EvalRecords: Delete policy" ON public.evaluation_records FOR DELETE
USING (
  public.is_super_admin()
);
-- 5. UPDATE TRIGGER SUPABASE AUTH AGAR MENDUKUNG ROLE & UNIT_ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, unit_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'staf_pegawai'::public.app_role),
    NEW.raw_user_meta_data->>'unit_id'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    role = EXCLUDED.role,
    unit_id = EXCLUDED.unit_id;

  RETURN NEW;
END;
$$;
