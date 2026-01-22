-- Fix Storage Policies for resource_entries bucket

-- 1. Drop potentially conflicting or duplicate policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Resource Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Resource Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Resource Auth Delete" ON storage.objects;

-- 2. Create explicit policies for the 'resource_entries' bucket

-- Allow everyone (public) to read/download files
CREATE POLICY "Resource Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'resource_entries' );

-- Allow authenticated users to upload files
CREATE POLICY "Resource Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resource_entries' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own files (if needed)
CREATE POLICY "Resource Auth Update"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'resource_entries' AND
  auth.uid() = owner 
);

-- Allow users to delete their own files
CREATE POLICY "Resource Auth Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resource_entries' AND
  auth.uid() = owner
);
