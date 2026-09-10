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
