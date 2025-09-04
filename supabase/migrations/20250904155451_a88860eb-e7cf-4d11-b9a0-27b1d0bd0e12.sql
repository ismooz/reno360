-- Corriger les fonctions sans search_path défini
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Corriger la fonction handle_new_user pour éviter la récursion RLS
-- En créant une fonction pour vérifier les rôles depuis les métadonnées utilisateur
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'user_metadata'->>'role';
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