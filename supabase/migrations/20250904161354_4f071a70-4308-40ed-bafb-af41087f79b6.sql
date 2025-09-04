-- Make request-attachments bucket public and set robust storage policies

-- Ensure bucket exists and set to public
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'request-attachments') THEN
    UPDATE storage.buckets SET public = TRUE WHERE id = 'request-attachments';
  ELSE
    INSERT INTO storage.buckets (id, name, public) VALUES ('request-attachments', 'request-attachments', TRUE);
  END IF;
END $$;

-- Allow public read access to files in the request-attachments bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public read for request-attachments'
  ) THEN
    CREATE POLICY "Public read for request-attachments"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'request-attachments');
  END IF;
END $$;

-- Allow authenticated users to upload files to their own folder (prefix with their user id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can upload to own folder (request-attachments)'
  ) THEN
    CREATE POLICY "Users can upload to own folder (request-attachments)"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'request-attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Allow authenticated users to update their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can update own files (request-attachments)'
  ) THEN
    CREATE POLICY "Users can update own files (request-attachments)"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'request-attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Allow authenticated users to delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can delete own files (request-attachments)'
  ) THEN
    CREATE POLICY "Users can delete own files (request-attachments)"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'request-attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;