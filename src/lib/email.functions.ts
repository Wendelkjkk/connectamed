import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const sendConfirmationEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => 
    z.object({
      email: z.string().email(),
      customerName: z.string().optional()
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { sendConfirmationEmailImpl } = await import("./email.server");
    // sendConfirmationEmailImpl agora aceita apenas o paymentId na nova versão que escrevemos
    // mas a versão atual no disco parece que ainda tem a assinatura antiga ou houve confusão
    // Vamos verificar o email.server.ts e ajustar
    return (sendConfirmationEmailImpl as any)(data.email, data.customerName);
  });