import { createClient } from "@supabase/supabase-js";

/**
 * Admin client for server-side operations that need service role.
 * Use this only in server actions - never expose to client.
 */
export async function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
