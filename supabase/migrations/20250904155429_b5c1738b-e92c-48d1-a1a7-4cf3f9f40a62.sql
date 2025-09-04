-- Créer une politique pour permettre aux admins de voir toutes les demandes
CREATE POLICY "Admins can view all requests" 
ON public.renovation_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Créer une politique pour permettre aux admins de modifier toutes les demandes
CREATE POLICY "Admins can update all requests" 
ON public.renovation_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);