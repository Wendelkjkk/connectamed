-- 1. has_role is SECURITY DEFINER and should not be directly callable by clients.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_short_code() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM authenticated, anon, public;

-- 2. Close the NULL user_id ownership gap on payments explicitly.
DROP POLICY IF EXISTS "Allow authenticated to manage their payments" ON public.payments;
CREATE POLICY "Users manage only their own payments"
ON public.payments
FOR ALL
TO authenticated
USING (user_id IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

-- Ensure guests/anon have no access at all to payment rows.
REVOKE ALL ON public.payments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;