import { NextResponse, type NextRequest } from 'next/server'

// Page addresses are all lowercase, but people (and settings pasted into KashPay) may
// type capitals, e.g. /palabras-del-Senor. Send any such address to its lowercase
// page, keeping the query string intact — KashPay's `ks` parameter must survive.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const lower = pathname.toLowerCase()
  if (lower === pathname) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = lower
  return NextResponse.redirect(url, 308)
}

export const config = {
  // Pages only: not assets, images, API routes or files with an extension.
  matcher: ['/((?!_next/|api/|funil/|icons/|.*\\..*).*)'],
}
