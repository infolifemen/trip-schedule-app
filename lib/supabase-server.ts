import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Серверный клиент Supabase для Vercel SSR.
 * Используется в middleware.ts и серверных компонентах.
 * Читает/пишет JWT-куки автоматически через cookies() API.
 *
 * На GitHub Pages этот файл не используется (статический экспорт без серверных функций).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll может вызваться из серверного компонента, где нельзя
            // записывать cookies. Это нормально — middleware.ts перехватит
            // и запишет cookies через response.
          }
        },
      },
    }
  )
}
