import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Просто пропускаем все запросы
  // Авторизация обрабатывается на клиенте через localStorage
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
