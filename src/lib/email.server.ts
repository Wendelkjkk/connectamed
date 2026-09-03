const SUBJECT = "Pagamento confirmado — Seu pedido está em processamento";

const TEXT_BODY = `Olá!

Seu pagamento foi confirmado com sucesso! ✅

Agora estamos processando seu pedido e, assim que tudo estiver pronto, enviaremos as informações necessárias para você receber seu acesso.

Não se preocupe, seu pedido está sendo processado normalmente.

Caso tenha qualquer dúvida ou precise de ajuda, entre em contato conosco pelo WhatsApp:

(82) 98864-2056

Obrigado pela sua compra!

Em breve entraremos em contato com você.`;

function htmlBody() {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#111">
${TEXT_BODY.split("\n\n")
  .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
  .join("\n")}
</div>`;
}

export async function sendConfirmationEmailImpl(email: string, _customerName?: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"] || "ConectaMed <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("RESEND_API_KEY não configurada — e-mail de confirmação não enviado.");
    return { sent: false, reason: "missing_api_key" as const };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: SUBJECT,
        text: TEXT_BODY,
        html: htmlBody(),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Falha ao enviar e-mail de confirmação:", res.status, detail);
      return { sent: false, reason: "provider_error" as const };
    }

    return { sent: true };
  } catch (err) {
    console.error("Erro ao enviar e-mail de confirmação:", err);
    return { sent: false, reason: "exception" as const };
  }
}

export async function sendConfirmationEmailOnce(paymentId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: claimed, error } = await supabaseAdmin
    .from("payments")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", paymentId)
    .is("email_sent_at", null)
    .select("customer_email, customer_name")
    .maybeSingle();

  if (error) {
    console.error("Erro ao reservar envio de e-mail:", error);
    return { sent: false, reason: "db_error" as const };
  }

  if (!claimed || !claimed.customer_email) {
    return { sent: false, reason: "already_sent_or_no_email" as const };
  }

  const result = await sendConfirmationEmailImpl(
    claimed.customer_email,
    claimed.customer_name || "Cliente",
  );

  if (!result.sent) {
    await supabaseAdmin.from("payments").update({ email_sent_at: null }).eq("id", paymentId);
  }

  return result;
}