import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Пропускаем статические файлы
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Basic Auth для всего сайта
  const authHeader = request.headers.get('authorization')
  
  // Пароль из env vars (Vercel Settings → Environment Variables)
  const password = process.env.SITE_PASSWORD || 'default123'
  const username = process.env.SITE_USERNAME || 'admin'
  
  if (authHeader) {
    try {
      const base64Credentials = authHeader.split(' ')[1]
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
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
      'WWW-Authenticate': 'Basic realm="Trip Schedule App", charset="UTF-8"',
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
