import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/pushinpay-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();

          // Documentação: status 'paid' indica pagamento concluído
          const transactionId = body.id?.toString();
          const status = body.status;

          if (!transactionId || status !== 'paid') {
             return new Response('Ignored', { status: 200 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Buscar pagamento atual para checar idempotência
          const { data: currentPayment } = await supabaseAdmin
            .from("payments")
            .select("id, status")
            .eq("pushinpay_transaction_id", transactionId)
            .maybeSingle();

          if (!currentPayment) {
            console.warn("Payment not found for transaction:", transactionId);
            return new Response('Payment not found', { status: 404 });
          }

          if (currentPayment.status === 'paid') {
            return new Response('Already processed', { status: 200 });
          }

          // Atualizar status do pagamento
          const { data, error } = await supabaseAdmin
            .from("payments")
            .update({ 
              status: 'paid',
              paid_at: new Date().toISOString(),
              metadata: { webhook_payload: body }
            })
            .eq("id", currentPayment.id)
            .select("id")
            .maybeSingle();

          if (error) {
            console.error("Error updating payment from webhook:", error);
            return new Response('Database error', { status: 500 });
          }

          if (!data) {
            console.warn("Payment not found for transaction");
            return new Response('Payment not found', { status: 404 });
          }

          // E-mail de confirmação — idempotente: webhooks repetidos não reenviam
          try {
            const { sendConfirmationEmailOnce } = await import("@/lib/email.server");
            await sendConfirmationEmailOnce(data.id);
          } catch (emailError) {
            console.error("Error sending confirmation email from webhook:", emailError);
          }

          return new Response('OK', { status: 200 });
        } catch (err) {
          console.error("Webhook processing error:", err);
          return new Response('Internal error', { status: 500 });
        }
      }
    }
  }
});
