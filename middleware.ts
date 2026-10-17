import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Пропускаем статические файлы и Next.js внутренние запросы
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // Basic Auth только для HTML страниц
  const authHeader = request.headers.get('authorization')
  
  // Пароль из env vars (Vercel Settings → Environment Variables)
  const password = process.env.SITE_PASSWORD || 'grafik2026'
  const username = process.env.SITE_USERNAME || 'admin'
  
  if (authHeader) {
    try {
      const base64Credentials = authHeader.split(' ')[1]
      // Используем atob() вместо Buffer.from() для Edge Runtime
      const credentials = atob(base64Credentials)
      const [user, pass] = credentials.split(':')
      
      // Проверяем логин и пароль
      if (user === username && pass === password) {
        return NextResponse.next()
      }
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  // Если авторизация не прошла — запрашиваем пароль
  return new Response('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Trip Schedule"',
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
