-- Remove sensitive password storage from smtp_config and document best practice

-- 1) Drop the password column if it exists
ALTER TABLE public.smtp_config
DROP COLUMN IF EXISTS password;

-- 2) Add documentation comments to guide future maintenance
COMMENT ON TABLE public.smtp_config IS 'SMTP configuration without password. Store sensitive credentials (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_PORT, SMTP_TLS) in Supabase Secrets only.';
COMMENT ON COLUMN public.smtp_config.username IS 'SMTP login name (non-sensitive). Never store passwords in the database.';
