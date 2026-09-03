-- Remover a política insegura que permite leitura total por anônimos
DROP POLICY IF EXISTS "Allow anon to read payments" ON public.payments;

-- Revogar o GRANT SELECT direto para anon na tabela de pagamentos
REVOKE SELECT ON public.payments FROM anon;
