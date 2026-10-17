import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal valid middleware - passes all requests through
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  // Empty matcher - middleware does not run at all
  matcher: [],
}
