-- Izinkan akses penuh untuk tabel units (Master Ruangan)
DROP POLICY IF EXISTS "Units: Everyone can view units" ON public.units;
DROP POLICY IF EXISTS "Units: Super Admin & Komite Mutu can insert" ON public.units;
DROP POLICY IF EXISTS "Units: Super Admin & Komite Mutu can update" ON public.units;
DROP POLICY IF EXISTS "Units: Super Admin can delete" ON public.units;

CREATE POLICY "Units_Access_All" ON public.units FOR ALL USING (true) WITH CHECK (true);

-- Izinkan akses penuh untuk tabel evaluation_records (Data Evaluasi)
DROP POLICY IF EXISTS "EvalRecords: Select policy based on RBAC" ON public.evaluation_records;
DROP POLICY IF EXISTS "EvalRecords: Insert policy based on RBAC" ON public.evaluation_records;
DROP POLICY IF EXISTS "EvalRecords: Update policy based on RBAC" ON public.evaluation_records;
DROP POLICY IF EXISTS "EvalRecords: Delete policy based on RBAC" ON public.evaluation_records;

CREATE POLICY "EvalRecords_Access_All" ON public.evaluation_records FOR ALL USING (true) WITH CHECK (true);
