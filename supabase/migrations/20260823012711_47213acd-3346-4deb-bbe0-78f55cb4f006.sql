-- The linter still points to a SECURITY DEFINER function executable by authenticated users.
-- Looking at previous code, public.is_admin is SECURITY DEFINER and GRANTED to authenticated.
-- Even though it's used in RLS, we should revoke public execute and only allow it to be used by the system.

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
