// VALID middleware - exports proper function but matcher is empty (matches nothing)
// This prevents Vercel Edge Runtime from crashing on empty file
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Pass through all requests - auth is handled client-side
  return NextResponse.next()
}

// Empty matcher = middleware never runs
// Auth is handled by client-side redirects and next.config.js redirects
export const config = {
  matcher: [],
}
