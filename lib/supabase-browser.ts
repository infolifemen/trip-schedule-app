import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // КРИТИЧНО: Все секреты только из env vars, никакого хардкода
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: Supabase env vars не настроены на Vercel')
    throw new Error('Supabase credentials не настроены')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
