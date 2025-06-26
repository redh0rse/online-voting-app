import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

// Temporarily disable middleware to fix redirect loop
export const config = {
  matcher: [] // Empty matcher means middleware won't run on any routes
};

/*
export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith('/login') ||
      req.nextUrl.pathname.startsWith('/register');

    // Allow access to API routes without redirection
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.next();
    }

    // Allow access to root page and debug page without authentication
    if (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/debug') {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to login page
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Redirect authenticated users away from auth pages
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Admin route protection
    if (req.nextUrl.pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Specify which routes to apply the middleware to
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
};
*/ 