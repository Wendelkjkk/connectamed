import type { SupabaseClient } from "@supabase/supabase-js";
import { assertAdmin } from "./admin.server";

export async function getAdminDashboardStatsImpl(
  supabase: SupabaseClient<any>,
  userId: string,
) {
  if (!(await assertAdmin(supabase, userId))) throw new Error("Unauthorized");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: payments, error } = await supabaseAdmin
    .from("payments")
    .select("status, amount");

  if (error) throw error;

  return {
    totalOrders: payments.length,
    pendingOrders: payments.filter((p) => p.status === "pending").length,
    paidOrders: payments.filter((p) => p.status === "paid").length,
    cancelledOrders: payments.filter((p) => p.status === "cancelled").length,
    totalRevenue:
      payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0) / 100,
  };
}

export async function getRecentOrdersImpl(
  supabase: SupabaseClient<any>,
  userId: string,
) {
  if (!(await assertAdmin(supabase, userId))) throw new Error("Unauthorized");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: orders, error } = await supabaseAdmin
    .from("payments")
    .select("id, customer_name, product_name, amount, status, created_at, short_code")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;

  return orders.map((order) => ({
    ...order,
    amount: (order.amount || 0) / 100,
  }));
}

export async function getAllOrdersImpl(
  supabase: SupabaseClient<any>,
  userId: string,
) {
  if (!(await assertAdmin(supabase, userId))) throw new Error("Unauthorized");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: orders, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return orders.map((order) => ({
    ...order,
    amount: (order.amount || 0) / 100,
  }));
}
