import { createBrowserClient } from '@supabase/ssr'

let _supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!_supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase env vars не настроены')
      throw new Error('Supabase credentials не настроены')
    }

    _supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabaseClient
}
