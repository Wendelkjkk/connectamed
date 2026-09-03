-- Criar tipo enum para status de pagamento
DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'expired', 'cancelled', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    product_id text NOT NULL,
    product_name text NOT NULL,
    amount integer NOT NULL, -- em centavos
    status public.payment_status NOT NULL DEFAULT 'pending',
    pushinpay_transaction_id text UNIQUE,
    pix_code text,
    qr_code text,
    customer_name text,
    customer_email text,
    metadata jsonb DEFAULT '{}'::jsonb,
    paid_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Permissões
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
GRANT SELECT ON public.payments TO anon;

-- Políticas
DO $$ BEGIN
    CREATE POLICY "Allow anon to read payments" 
    ON public.payments FOR SELECT TO anon 
    USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated to manage their payments"
    ON public.payments FOR ALL TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Service role has full access"
    ON public.payments FOR ALL TO service_role
    USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
