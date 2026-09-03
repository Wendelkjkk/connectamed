import { PRODUCT_CATALOG, type CreatePixPaymentInput } from "./payments.schemas";

export async function createPixPaymentImpl(data: CreatePixPaymentInput) {
  const PUSHINPAY_TOKEN = process.env["PUSHINPAY_TOKEN"];
  if (!PUSHINPAY_TOKEN) {
    throw new Error("Pagamento indisponível no momento.");
  }

  // Preço e nome do produto vêm SEMPRE do catálogo do servidor.
  const product = PRODUCT_CATALOG[data.productId];
  if (!product) {
    throw new Error("Produto inválido.");
  }
  const productName = product.name;
  const amount = product.amount;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: payment, error: dbError } = await supabaseAdmin
    .from("payments")
    .insert({
      product_id: data.productId,
      product_name: productName,
      amount,
      customer_name: data.customerName ?? null,
      customer_email: data.customerEmail ?? null,
      customer_cpf: data.customerCpf ?? null,
      customer_birth_date: data.customerBirthDate || null,
      customer_mother_name: data.customerMotherName ?? null,
      customer_whatsapp: data.customerWhatsapp ?? null,
      order_details: (data.orderDetails ?? {}) as never,
      status: "pending",
    })
    .select()
    .single();

  if (dbError || !payment) {
    console.error("Error creating payment record:", dbError);
    throw new Error("Failed to create payment record");
  }


  const siteUrl =
    process.env["SITE_URL"] ||
    `https://${process.env["LOVABLE_PROJECT_ID"] || "project"}.lovable.app`;
  const webhookUrl = `${siteUrl}/api/public/pushinpay-webhook`;

  const response = await fetch("https://api.pushinpay.com.br/api/pix/cashIn", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PUSHINPAY_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: amount,
      webhook_url: webhookUrl,
      description: `ConectaMed - ${productName}`,
    }),

  });

  const pushinData: any = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("PushinPay API error:", pushinData);
    await supabaseAdmin
      .from("payments")
      .update({ status: "failed", metadata: { error: pushinData } })
      .eq("id", payment.id);
    const apiMsg = typeof pushinData?.message === "string" ? pushinData.message : null;
    throw new Error(apiMsg ?? "Não foi possível gerar o pagamento PIX. Tente novamente.");
  }

  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({
      pushinpay_transaction_id: String(pushinData.id),
      pix_code: pushinData.qr_code,
      qr_code: pushinData.qr_code_base64,
      metadata: { pushinpay_response: pushinData },
    })
    .eq("id", payment.id);

  if (updateError) console.error("Error updating payment:", updateError);

  return {
    id: payment.id as string,
    pixCode: pushinData.pixCode || pushinData.qr_code as string,
    qrCode: pushinData.qrCode || pushinData.qr_code_base64 as string | null,
    amount,
  };
}

export async function getPaymentStatusImpl(paymentId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("status, paid_at, pushinpay_transaction_id, customer_email, customer_name")
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching payment status:", error);
    return { status: "pending" as string, paid_at: null as string | null };
  }

  let status = (data?.status ?? "pending") as string;
  let paidAt = (data?.paid_at ?? null) as string | null;

  // Fallback: o webhook pode não chegar (ambiente de preview). Consultamos a
  // PushinPay diretamente enquanto o pagamento estiver pendente.
  const token = process.env["PUSHINPAY_TOKEN"];
  const txId = data?.pushinpay_transaction_id as string | undefined;
  
  if (status === "pending" && token && txId) {
    try {
      const res = await fetch(`https://api.pushinpay.com.br/api/transactions/${txId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const tx: any = await res.json().catch(() => ({}));
      const remote = String(tx?.status ?? "").toLowerCase();
      
      if (res.ok && (remote === "paid" || remote === "approved" || remote === "completed")) {
        // Idempotência: só atualiza se ainda estiver pendente
        const { data: current } = await supabaseAdmin
          .from("payments")
          .select("status")
          .eq("id", paymentId)
          .single();

        if (current?.status === "pending") {
          status = "paid";
          paidAt = new Date().toISOString();
          await supabaseAdmin
            .from("payments")
            .update({ status: "paid", paid_at: paidAt })
            .eq("id", paymentId);

          // E-mail de confirmação
          try {
            const { sendConfirmationEmailOnce } = await import("./email.server");
            await sendConfirmationEmailOnce(paymentId);
          } catch (emailError) {
            console.error("Error sending confirmation email from polling fallback:", emailError);
          }
        } else if (current?.status === "paid") {
          status = "paid";
          paidAt = data?.paid_at ?? null;
        }
      } else if (remote === "failed" || remote === "canceled" || remote === "rejected") {
        status = "failed";
        await supabaseAdmin.from("payments").update({ status: "failed" }).eq("id", paymentId);
      } else if (remote === "expired") {
        status = "expired";
        await supabaseAdmin.from("payments").update({ status: "expired" }).eq("id", paymentId);
      }
    } catch (e) {
      console.error("PushinPay status check failed:", e);
    }
  }

  return { status, paid_at: paidAt };
}
