-- Complete Phase 1: Secure policies, role functions, and backfill admin role

-- Create security definer function to get a user's highest-priority role
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = check_user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'user' THEN 2
    END
  LIMIT 1;
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
$$;

-- Update existing get_current_user_role to use user_roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.get_user_role(auth.uid()), 'user');
$$;

-- Add RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_admin());

-- Recreate secure RLS policies for renovation_requests
DROP POLICY IF EXISTS "Users can view their own requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Admins can delete requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.renovation_requests;

CREATE POLICY "Users can view their own requests"
ON public.renovation_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
ON public.renovation_requests
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
ON public.renovation_requests
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all requests"
ON public.renovation_requests
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete requests"
ON public.renovation_requests
FOR DELETE
USING (public.is_admin());

-- Preserve public request creation (no auth required)
CREATE POLICY "Users can create requests"
ON public.renovation_requests
FOR INSERT
WITH CHECK (true);

-- Ensure updated_at auto-update on user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_roles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Update handle_new_user to assign default 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Link existing requests to the new user account based on email
  UPDATE public.renovation_requests
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Backfill admin roles for existing admin users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE (raw_user_meta_data->>'role') = 'admin' OR email = 'admin@reno360.ch'
ON CONFLICT (user_id, role) DO NOTHING;