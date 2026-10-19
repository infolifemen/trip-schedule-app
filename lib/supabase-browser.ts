import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// === Custom fetch wrapper ===
// Блокируем ВСЕ запросы к Supabase Auth endpoints.
// @supabase/supabase-js GoTrue client делает preflight-запросы к /auth/v1/settings
// даже когда auth полностью отключён. Supabase Auth возвращает
// "Database error querying schema" что ломает приложение.
// Этот wrapper перехватывает все /auth/ запросы и возвращает мок-ответ.

const authBlockFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

  // Блокируем ВСЕ запросы к Supabase Auth
  if (url.includes('/auth/v1/') || url.includes('/auth/v2/')) {
    console.log('[AuthBlock] Заблокирован запрос к Auth:', url)
    return new Response(
      JSON.stringify({
        external: { anonymous_users: false, phone: { enabled: false }, email: { enabled: false } },
        disable_signup: true,
        mailer: { autoconfirm: true },
        user: null,
        error_description: 'Auth disabled',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Все остальные запросы (PostgREST, Storage) — пропускаем как обычно
  return fetch(input, init)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let cachedClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (cachedClient) return cachedClient

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars не настроены — будет использован fallback на SEED_DATA')
    cachedClient = createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        global: { fetch: authBlockFetch },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )
    return cachedClient
  }

  cachedClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: authBlockFetch },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return cachedClient
}

// Алиас для обратной совместимости
export const createSupabaseClient = createClient
