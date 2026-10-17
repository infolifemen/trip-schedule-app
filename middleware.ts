// Middleware DISABLED - this file exists only to prevent Vercel cache issues
// matcher points to non-existent path so middleware NEVER runs
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// This matcher ensures middleware NEVER runs for real requests
// '/__mw_disabled__' is a path that will never be requested
export const config = {
  matcher: '/__mw_disabled__',
}
