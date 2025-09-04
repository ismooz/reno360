-- Corriger la fonction pour extraire le rôle des métadonnées JWT
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role');
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = 'public';

-- Supprimer les anciennes politiques d'admin qui peuvent causer des problèmes
DROP POLICY IF EXISTS "Admins can view all requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.renovation_requests;

-- Créer de nouvelles politiques plus sûres pour les admins
CREATE POLICY "Admins can view all requests" 
ON public.renovation_requests 
FOR SELECT 
USING (
  public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can update all requests" 
ON public.renovation_requests 
FOR UPDATE 
USING (
  public.get_current_user_role() = 'admin'
);