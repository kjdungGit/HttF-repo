import type { SupabaseClient } from "@supabase/supabase-js";

/** Read rows using the caller's session and the project's RLS policies. */
export function listTodos(supabase: SupabaseClient) {
  return supabase.from("todos").select("id, name").order("id").limit(100);
}
