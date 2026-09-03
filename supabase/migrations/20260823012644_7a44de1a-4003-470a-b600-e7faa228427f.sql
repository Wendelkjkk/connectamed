-- Migration to prepare database for orders and client data
-- Reusing and refining the existing 'payments' table

-- 1. Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add trigger to payments table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_payments_updated_at') THEN
    CREATE TRIGGER set_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 3. Verify status field has correct default
ALTER TABLE public.payments ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Ensure all requested fields exist
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS order_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pix';

-- 5. Add comments for clarity
COMMENT ON TABLE public.payments IS 'Main table for storing orders and payment transactions.';
COMMENT ON COLUMN public.payments.status IS 'Status of the payment transaction (pending, paid, etc.)';
COMMENT ON COLUMN public.payments.order_status IS 'Internal order processing status (pending, processing, completed)';
COMMENT ON COLUMN public.payments.order_details IS 'JSON containing client form data and consultation details (CID, UPA, etc.)';
