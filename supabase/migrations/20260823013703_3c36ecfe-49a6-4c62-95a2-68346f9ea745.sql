-- Revoke public execution of the has_role function
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM authenticated;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;

-- Grant execution only to service_role (since we use supabaseAdmin to call it)
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
