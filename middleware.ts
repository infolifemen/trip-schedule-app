import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware для Vercel SSR.
 * Проверяет Supabase JWT-сессию и редиректит неавторизованных на /login.
 *
 * На GitHub Pages этот файл удаляется перед сборкой (статический экспорт).
 * Там авторизация проверяется клиентски через components/AuthGate.tsx.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Пропускаем статические файлы и API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ВАЖНО: вызываем getUser() для обновления JWT-куки.
  // Не используем getSession() в middleware — он небезопасен на edge.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Если не авторизован и не на /login — редирект
  if (!user && pathname !== '/login') {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // Если авторизован и на /login — редирект на главную
  if (user && pathname === '/login') {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Все пути кроме:
     * - _next/static (статические файлы)
     * - _next/image (оптимизация изображений)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
