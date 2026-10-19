import { type NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'trip_schedule_auth'

/**
 * Middleware для Vercel SSR.
 * Проверяет cookie trip_schedule_auth и редиректит неавторизованных на /login.
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

  // Проверяем cookie
  const authCookie = request.cookies.get(COOKIE_NAME)?.value
  const isAuthenticated = authCookie === 'authenticated'

  // Если не авторизован и не на /login — редирект
  if (!isAuthenticated && pathname !== '/login') {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // Если авторизован и на /login — редирект на главную
  if (isAuthenticated && pathname === '/login') {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
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
