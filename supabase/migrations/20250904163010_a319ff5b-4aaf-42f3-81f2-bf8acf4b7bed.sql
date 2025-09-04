-- Modifier la structure des attachments pour inclure les noms personnalisés
-- On va garder la compatibilité avec l'ancien format en gardant attachments
-- et ajouter une nouvelle colonne pour les métadonnées des fichiers

ALTER TABLE public.renovation_requests 
ADD COLUMN attachment_metadata JSONB DEFAULT '[]'::jsonb;

-- Ajouter un commentaire pour expliquer la structure
COMMENT ON COLUMN public.renovation_requests.attachment_metadata IS 'Métadonnées des fichiers: [{"filename": "path/to/file", "displayName": "Mon nom personnalisé", "type": "image"}]';