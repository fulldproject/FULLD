-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE editions ENABLE ROW LEVEL SECURITY;

-- Create function to automatically set created_by
CREATE OR REPLACE FUNCTION public.handle_new_user_content()
RETURNS trigger AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for events
DROP TRIGGER IF EXISTS on_events_created ON events;
CREATE TRIGGER on_events_created
  BEFORE INSERT ON events
  FOR EACH ROWEXECUTE PROCEDURE public.handle_new_user_content();

-- Trigger for editions
DROP TRIGGER IF EXISTS on_editions_created ON editions;
CREATE TRIGGER on_editions_created
  BEFORE INSERT ON editions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_content();

-- Policies for EVENTS

-- 1. Public can view approved events
CREATE POLICY "Public can view approved events"
ON events FOR SELECT
USING (status_moderation = 'approved');

-- 2. Organizers/Admins can view all (simplification: if you are authenticated, you can view all status in Admin)
-- Ideally better scoped, but for MVP:
CREATE POLICY "Auth users can view all events"
ON events FOR SELECT
USING (auth.role() = 'authenticated');

-- 3. Insert: Authenticated users can create events
CREATE POLICY "Authenticated users can insert events"
ON events FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 4. Update: Users can update their own events OR if they are admins (check profile role ideally, but here using created_by)
CREATE POLICY "Users can update own events"
ON events FOR UPDATE
USING (auth.uid() = created_by);

-- 5. Delete: Users can delete own events
CREATE POLICY "Users can delete own events"
ON events FOR DELETE
USING (auth.uid() = created_by);


-- Policies for EDITIONS

-- 1. Public can view editions of visible events
-- (Complex join usually needed, but simplistically allow public read if they know the ID)
CREATE POLICY "Public can view editions"
ON editions FOR SELECT
USING (true);

-- 2. Insert: Authenticated users
CREATE POLICY "Authenticated users can insert editions"
ON editions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 3. Update: Own editions (via event ownership or edition ownership)
-- For simplicity, checking edition created_by
CREATE POLICY "Users can update own editions"
ON editions FOR UPDATE
USING (auth.uid() = created_by);

-- 4. Delete: Users can delete own editions
CREATE POLICY "Users can delete own editions"
ON editions FOR DELETE
USING (auth.uid() = created_by);
