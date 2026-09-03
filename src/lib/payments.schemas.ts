import { z } from "zod";

// Catálogo de preços autoritativo (server-side). O valor NUNCA vem do cliente.
export const PRODUCT_CATALOG: Record<string, { name: string; amount: number }> = {
  "1": { name: "Atestado Médico - 1 dia", amount: 5000 },
  "2": { name: "Atestado Médico - 2 dias", amount: 5000 },
  "3": { name: "Atestado Médico - 3 dias", amount: 5000 },
  "4": { name: "Atestado Médico - 4 dias", amount: 6000 },
  "5": { name: "Atestado Médico - 5 dias", amount: 7000 },
  "6": { name: "Atestado Médico - 6 dias", amount: 8000 },
  "7": { name: "Atestado Médico - 7 dias", amount: 9000 },
  "8": { name: "Atestado Médico - 8 dias", amount: 10000 },
  "9": { name: "Atestado Médico - 9 dias", amount: 11000 },
  "10": { name: "Atestado Médico - 10 dias", amount: 12000 },
  "11": { name: "Atestado Médico - 11 dias", amount: 13000 },
  "12": { name: "Atestado Médico - 12 dias", amount: 14000 },
  "13": { name: "Atestado Médico - 13 dias", amount: 15000 },
  "14": { name: "Atestado Médico - 14 dias", amount: 16000 },
};

const digits = (max: number) =>
  z.string().trim().max(max).regex(/^[0-9()+\-.\s]*$/, "Formato inválido");

export const createPixPaymentSchema = z.object({
  productId: z.enum(Object.keys(PRODUCT_CATALOG) as [string, ...string[]]),
  // Aceitos por compatibilidade, mas ignorados pelo servidor.
  productName: z.string().trim().max(120).optional(),
  amount: z.number().int().positive().max(1_000_000).optional(),
  customerName: z.string().trim().min(1).max(120).optional(),
  customerEmail: z.string().trim().email().max(160).optional(),
  customerCpf: digits(20).optional(),
  customerBirthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional()
    .or(z.literal("")),
  customerMotherName: z.string().trim().max(120).optional(),
  customerWhatsapp: digits(25).optional(),
  orderDetails: z
    .record(z.string().max(60), z.union([z.string().max(300), z.number(), z.boolean(), z.null()]))
    .optional(),
});

export const paymentStatusSchema = z.object({ paymentId: z.string().uuid() });

export type CreatePixPaymentInput = z.infer<typeof createPixPaymentSchema>;
