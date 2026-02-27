
-- 1. Create User Roles Enum
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('EXPLORER', 'PARTICIPANT', 'ORGANIZER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Public Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text,
  email text,
  avatar_url text,
  role public.user_role DEFAULT 'EXPLORER',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Helper Functions for Auth Checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_organizer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'ORGANIZER' OR role = 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to Create Profile on New User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'EXPLORER', -- Default role
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Backfill Profiles for Existing Users (Safe to run multiple times due to ON CONFLICT DO NOTHING implicit in logic below if used, but strictly using insert ignore logic here is better handled manually or with ON CONFLICT)
INSERT INTO public.profiles (id, email, username)
SELECT 
    id, 
    email, 
    split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 7. Trigger to Set created_by on Events/Editions
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_events_created_by ON public.events;
CREATE TRIGGER set_events_created_by
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE PROCEDURE public.set_created_by();

DROP TRIGGER IF EXISTS set_editions_created_by ON public.editions;
CREATE TRIGGER set_editions_created_by
  BEFORE INSERT ON public.editions
  FOR EACH ROW EXECUTE PROCEDURE public.set_created_by();

-- 8. RLS Policies for Profiles
-- Public can view basic profile info (username, avatar) for UI consistency if needed, but stricter:
-- Users can view their own profile.
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_admin());

-- Users can update own profile (username/avatar only ideally handled by frontend restriction + triggers if needed, but for now standard update)
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 9. RLS Policies for Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Select: Public sees APPROVED. Admin sees ALL. Organizer sees OWN.
CREATE POLICY "Public views approved events"
ON public.events FOR SELECT
USING (status_moderation = 'approved');

CREATE POLICY "Admins view all events"
ON public.events FOR SELECT
USING (public.is_admin());

CREATE POLICY "Organizers view own events"
ON public.events FOR SELECT
USING (auth.uid() = created_by);

-- Insert: Organizers and Admins can insert
CREATE POLICY "Organizers and Admins can insert events"
ON public.events FOR INSERT
WITH CHECK (public.is_organizer()); 

-- Update: Admin all, Organizer own
CREATE POLICY "Admins can update key info"
ON public.events FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Organizers can update own events"
ON public.events FOR UPDATE
USING (auth.uid() = created_by);

-- Delete: Admin all, Organizer own
CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
USING (public.is_admin());

CREATE POLICY "Organizers can delete own events"
ON public.events FOR DELETE
USING (auth.uid() = created_by);

-- 10. RLS Policies for Editions
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;

-- Select: Public views all (simplified as they are children of events, usually filtered by parent event visibility in app logic)
CREATE POLICY "Public views editions"
ON public.editions FOR SELECT
USING (true);

-- Insert: Organizers (if they own parent event or just general organizer check + trigger sets created_by) and Admins
CREATE POLICY "Organizers and Admins can insert editions"
ON public.editions FOR INSERT
WITH CHECK (public.is_organizer());

-- Update: Admin all, Organizer own
CREATE POLICY "Admins can update editions"
ON public.editions FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Organizers can update own editions"
ON public.editions FOR UPDATE
USING (auth.uid() = created_by);

-- Delete: Admin all, Organizer own
CREATE POLICY "Admins can delete editions"
ON public.editions FOR DELETE
USING (public.is_admin());

CREATE POLICY "Organizers can delete own editions"
ON public.editions FOR DELETE
USING (auth.uid() = created_by);

-- 11. Enforce Role Protection
-- Prevent users from updating their own role column via RLS (requires separating columns or trigger validation)
-- For MVP: Create a trigger that prevents role change unless performed by database owner (service role) or via specific admin function.
CREATE OR REPLACE FUNCTION public.protect_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'You cannot change your own role.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_role_change();
