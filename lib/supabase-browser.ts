import { createBrowserClient } from '@supabase/ssr'

// Supabase клиент теперь опциональный
// Приложение работает на localStorage, Supabase можно подключить позже
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Если credentials не настроены — возвращаем null
  // Приложение будет работать на localStorage
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (e) {
    console.warn('Не удалось создать Supabase клиент:', e)
    return null
  }
}