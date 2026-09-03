-- Prevent privilege escalation: authenticated/anon may never write admin tables
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_users FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM authenticated, anon;
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Explicit deny for writes even if grants are ever widened
DROP POLICY IF EXISTS "No client writes to admin_users" ON public.admin_users;
CREATE POLICY "No client writes to admin_users"
ON public.admin_users FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client writes to user_roles" ON public.user_roles;
CREATE POLICY "No client writes to user_roles"
ON public.user_roles FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);