import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = ['/dashboard', '/admin'];
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

export async function proxy(request: NextRequest) {
  // 1. Update Supabase Session
  const { supabaseResponse, user } = await updateSession(request);
  
  const pathname = request.nextUrl.pathname;
  
  // Extract locale
  const localeRegex = new RegExp(`^/(${routing.locales.join('|')})`);
  const pathnameWithoutLocale = pathname.replace(localeRegex, '') || '/';

  // Kesin eşleşme (Exact Match) veya alt sayfa eşleşmesi (StartsWith route + '/')
  const isProtectedRoute = protectedRoutes.some(route => 
    pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(`${route}/`)
  );
  
  const isAuthRoute = authRoutes.some(route => 
    pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(`${route}/`)
  );

  // 2. Route Protection
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    // Default locale'i koruyarak login'e yönlendir
    url.pathname = `/${routing.defaultLocale}/login`;
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // 3. Run next-intl middleware
  const response = intlMiddleware(request);

  // 4. Merge cookies from supabaseResponse into intlResponse
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value);
  });

  return response;
}

export const config = {
  matcher: [
    '/',
    '/(tr)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)' 
  ]
};
