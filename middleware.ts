import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin and analyst routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/analyst')) {
    const sessionCookie = request.cookies.get('evicheck_session');
    
    if (!sessionCookie || !sessionCookie.value) {
      // Redirect to login if no cookie
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token
    const payload = await verifyJwt(sessionCookie.value);
    
    if (!payload) {
      // Token invalid or expired
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('evicheck_session');
      return response;
    }

    // Role-based access control
    if (pathname.startsWith('/admin') && payload.userType !== 'admin') {
      return NextResponse.redirect(new URL('/analyst', request.url)); 
    }
    
    if (pathname.startsWith('/analyst') && payload.userType !== 'analyst' && payload.userType !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Attach user type to headers to pass to downstream Server Components if needed
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-type', String(payload.userType));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // If going to login/signup while already logged in
  if (pathname === '/login' || pathname === '/signup') {
    const sessionCookie = request.cookies.get('evicheck_session');
    if (sessionCookie && sessionCookie.value) {
      const payload = await verifyJwt(sessionCookie.value);
      if (payload) {
        if (payload.userType === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        } else if (payload.userType === 'analyst') {
          return NextResponse.redirect(new URL('/analyst', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/analyst/:path*',
    '/login',
    '/signup'
  ],
};
