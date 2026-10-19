import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Используем createClient НАПРЯМУЮ из @supabase/supabase-js
// вместо @supabase/ssr, потому что:
// 1. Мы НЕ используем Supabase Auth (у нас кастомный логин через cookie trip_schedule_auth)
// 2. @supabase/ssr создаёт GoTrue client который делает preflight-запросы к Auth API
//    что может вызывать "Database error querying schema" если auth.users имеет проблемы
// 3. Нам не нужна серверная сессия — только PostgREST для чтения/записи данных

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let cachedClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (cachedClient) return cachedClient

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars не настроены — будет использован fallback на SEED_DATA')
    cachedClient = createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
    return cachedClient
  }

  cachedClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Полностью отключаем Auth — нам не нужна авторизация через Supabase
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return cachedClient
}

// Алиас для обратной совместимости
export const createSupabaseClient = createClient
