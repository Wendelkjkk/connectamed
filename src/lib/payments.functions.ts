import { createServerFn } from "@tanstack/react-start";
import { createPixPaymentSchema, paymentStatusSchema } from "./payments.schemas";
import { createPixPaymentImpl, getPaymentStatusImpl } from "./payments.server";

export const createPixPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createPixPaymentSchema.parse(data))
  .handler(async ({ data }) => createPixPaymentImpl(data));

export const getPaymentStatus = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => paymentStatusSchema.parse(data))
  .handler(async ({ data }) => getPaymentStatusImpl(data.paymentId));
