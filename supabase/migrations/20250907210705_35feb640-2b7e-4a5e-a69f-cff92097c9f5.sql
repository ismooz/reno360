-- Secure smtp_config: restrict to admins only
-- 1) Ensure RLS is enabled
ALTER TABLE public.smtp_config ENABLE ROW LEVEL SECURITY;

-- 2) Drop overly broad policy
DROP POLICY IF EXISTS "Allow authenticated users to manage SMTP config" ON public.smtp_config;

-- 3) Create admin-only policies
CREATE POLICY "Admins can view SMTP config"
ON public.smtp_config
FOR SELECT
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert SMTP config"
ON public.smtp_config
FOR INSERT
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update SMTP config"
ON public.smtp_config
FOR UPDATE
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete SMTP config"
ON public.smtp_config
FOR DELETE
USING (public.get_current_user_role() = 'admin');