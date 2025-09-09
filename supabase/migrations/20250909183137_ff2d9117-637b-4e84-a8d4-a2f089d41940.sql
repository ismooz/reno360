-- Security fixes: Strengthen RLS policies and improve data validation

-- 1) Update renovation_requests INSERT policy to validate email matches authenticated user
DROP POLICY IF EXISTS "Users can create requests" ON public.renovation_requests;
CREATE POLICY "Users can create requests" ON public.renovation_requests
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to insert only if email matches their auth email
  (auth.uid() IS NOT NULL AND email = auth.email()) OR
  -- Allow unauthenticated users (for public form submissions)
  auth.uid() IS NULL
);

-- 2) Add input validation function for renovation requests
CREATE OR REPLACE FUNCTION public.validate_renovation_request_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitize and validate text inputs
  IF NEW.name IS NOT NULL THEN
    NEW.name = trim(NEW.name);
    IF length(NEW.name) < 2 OR length(NEW.name) > 100 THEN
      RAISE EXCEPTION 'Invalid name length. Must be between 2 and 100 characters.';
    END IF;
  END IF;
  
  IF NEW.email IS NOT NULL THEN
    NEW.email = lower(trim(NEW.email));
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format.';
    END IF;
  END IF;
  
  IF NEW.phone IS NOT NULL THEN
    NEW.phone = regexp_replace(NEW.phone, '[^0-9+\-\s\(\)]', '', 'g');
    IF length(NEW.phone) > 20 THEN
      RAISE EXCEPTION 'Phone number too long.';
    END IF;
  END IF;
  
  IF NEW.description IS NOT NULL THEN
    NEW.description = trim(NEW.description);
    IF length(NEW.description) > 5000 THEN
      RAISE EXCEPTION 'Description too long. Maximum 5000 characters.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3) Add validation trigger to renovation_requests
DROP TRIGGER IF EXISTS validate_renovation_request_input_trigger ON public.renovation_requests;
CREATE TRIGGER validate_renovation_request_input_trigger
  BEFORE INSERT OR UPDATE ON public.renovation_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_renovation_request_input();

-- 4) Update database functions to use proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = check_user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'user' THEN 2
    END
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
$function$;