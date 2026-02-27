-- Upgrade suggestions table
ALTER TABLE public.suggestions
ADD COLUMN IF NOT EXISTS suggestion_type TEXT CHECK (suggestion_type IN ('event', 'edition')) DEFAULT 'event',
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS poster_url TEXT;

-- Create storage bucket for suggestion images
INSERT INTO storage.buckets (id, name, public)
VALUES ('suggestion-images', 'suggestion-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for suggestion-images bucket
-- Allow public to read images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'suggestion-images');

-- Allow authenticated users to upload images to suggestion-images
CREATE POLICY "Auth Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'suggestion-images');
