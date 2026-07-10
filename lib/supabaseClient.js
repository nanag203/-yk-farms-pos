import { createClient as createSupabaseServerClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export const supabase = createSupabaseServerClient(supabaseUrl, supabaseKey);
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}
