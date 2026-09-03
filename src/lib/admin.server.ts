import type { SupabaseClient } from "@supabase/supabase-js";

/** Verifies the admin role using the caller's authenticated (RLS-scoped) client. */
export async function assertAdmin(supabase: SupabaseClient<any>, userId: string) {
  // Read the caller's own role row. RLS restricts this to auth.uid() rows only,
  // so no SECURITY DEFINER function needs to be exposed to clients.
  const { data: roleData, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("Error checking admin role:", error.message);
    return false;
  }

  return !!roleData;
}
