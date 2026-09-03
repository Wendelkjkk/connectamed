import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminDashboardStatsImpl, getRecentOrdersImpl, getAllOrdersImpl } from "./admin-dashboard.server";

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return await getAdminDashboardStatsImpl(context.supabase as any, context.userId);
  });

export const getRecentOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return await getRecentOrdersImpl(context.supabase as any, context.userId);
  });

export const getAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return await getAllOrdersImpl(context.supabase as any, context.userId);
  });
