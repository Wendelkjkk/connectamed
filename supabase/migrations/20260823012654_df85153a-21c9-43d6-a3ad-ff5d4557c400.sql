-- Fix security linter warning: Function Search Path Mutable
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
