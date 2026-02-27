
-- 1. Fix/Create `block_role_change` to be secure but allow system updates (via triggers)
-- We'll assume the trigger uses `handle_new_user` which runs as security definer, so it bypasses RLS/permissions,
-- but `protect_role_change` trigger on update checks for admin.
-- We need to ensure that the initial INSERT (trigger) or admin updates work.

CREATE OR REPLACE FUNCTION public.protect_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if it's a new row (INSERT) - usually handled by separate trigger, but handle logic here if mixed
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Allow if old role is null (first set)
  IF OLD.role IS NULL THEN
     RETURN NEW;
  END IF;

  -- Allow if role hasn't changed
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
      RETURN NEW;
  END IF;
  
  -- Allow if user is ADMIN (checking public.profiles for the *executor* of the query, not the target)
  -- Uses `auth.uid()` which is the current session user.
  IF public.is_admin() THEN
      RETURN NEW;
  END IF;

  -- Otherwise block
  RAISE EXCEPTION 'Only ADMIN can change roles. Action blocked for user %', auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger to be sure
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_role_change();


-- 2. Bootstrap Script
-- a) Ensure all auth.users have a profile
INSERT INTO public.profiles (id, email, username, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    'PARTICIPANT'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- b) PROMOTE SPECIFIC ADMIN
UPDATE public.profiles
SET role = 'ADMIN'
WHERE id = '404ae908-d086-4302-b436-902a1301d9c7';

-- 3. Validation Query (Run this to check results)
SELECT id, username, email, role FROM public.profiles;
