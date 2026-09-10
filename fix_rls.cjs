const fs = require('fs');
let code = fs.readFileSync('supabase/schema.sql', 'utf-8');

code = code.replace(
  /CREATE POLICY "Units: Super Admin & Komite Mutu can insert"\n  ON public\.units FOR INSERT WITH CHECK \(public\.is_komite_mutu\(\)\);/g,
  `CREATE POLICY "Units: Super Admin & Komite Mutu can insert"
  ON public.units FOR INSERT WITH CHECK (public.is_komite_mutu() OR auth.role() = 'anon');`
);

code = code.replace(
  /CREATE POLICY "Units: Super Admin & Komite Mutu can update"\n  ON public\.units FOR UPDATE USING \(public\.is_komite_mutu\(\)\) WITH CHECK \(public\.is_komite_mutu\(\)\);/g,
  `CREATE POLICY "Units: Super Admin & Komite Mutu can update"
  ON public.units FOR UPDATE USING (public.is_komite_mutu() OR auth.role() = 'anon') WITH CHECK (public.is_komite_mutu() OR auth.role() = 'anon');`
);

code = code.replace(
  /CREATE POLICY "Units: Super Admin can delete"\n  ON public\.units FOR DELETE USING \(public\.is_super_admin\(\)\);/g,
  `CREATE POLICY "Units: Super Admin can delete"
  ON public.units FOR DELETE USING (public.is_super_admin() OR auth.role() = 'anon');`
);

fs.writeFileSync('supabase/schema.sql', code);
