-- Make the request-attachments bucket private instead of public
UPDATE storage.buckets SET public = FALSE WHERE id = 'request-attachments';

-- Drop the public read policy that allows unrestricted access
DROP POLICY IF EXISTS "Public read for request-attachments" ON storage.objects;

-- Create policy: Users can read their own files (authenticated)
CREATE POLICY "Users can read own request attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'request-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy: Admins can read all files
CREATE POLICY "Admins can read all request attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'request-attachments' AND
  public.is_admin(auth.uid())
);