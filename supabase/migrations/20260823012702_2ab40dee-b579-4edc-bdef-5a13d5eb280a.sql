-- Fix security linter warning: Signed-In Users Can Execute SECURITY DEFINER Function
-- The function public.generate_short_code() was previously defined as SECURITY DEFINER or just executable.
-- We ensure it's restricted or switched to SECURITY INVOKER if appropriate.
-- Based on the linter, let's revoke public execute and restrict it.

REVOKE EXECUTE ON FUNCTION public.generate_short_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_short_code() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.generate_short_code() TO service_role;
