-- Créer un bucket pour stocker les pièces jointes des demandes
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-attachments', 'request-attachments', false);

-- Créer des politiques de stockage pour les pièces jointes
-- Les utilisateurs peuvent uploader des fichiers dans leur dossier
CREATE POLICY "Users can upload their own attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'request-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Les utilisateurs peuvent voir leurs propres fichiers
CREATE POLICY "Users can view their own attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'request-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Les admins peuvent voir tous les fichiers
CREATE POLICY "Admins can view all attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'request-attachments' AND
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

-- Ajouter une fonction pour supprimer automatiquement les timestamps lors des insertions/mises à jour
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Créer le trigger pour la table renovation_requests
CREATE TRIGGER handle_renovation_requests_updated_at
  BEFORE UPDATE ON public.renovation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();