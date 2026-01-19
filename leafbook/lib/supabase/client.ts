import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

export async function getCurrentUserId() {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims?.sub
}
