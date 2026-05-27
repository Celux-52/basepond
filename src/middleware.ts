import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  // 1. Update Supabase Session
  const { supabaseResponse, user } = await updateSession(request);
  
  const pathname = request.nextUrl.pathname;
  
  // Extract locale
  const localeRegex = new RegExp(`^/(${routing.locales.join('|')})`);
  const pathnameWithoutLocale = pathname.replace(localeRegex, '') || '/';

  const isProtectedRoute = protectedRoutes.some(route => pathnameWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathnameWithoutLocale.startsWith(route));

  // 2. Route Protection
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    const localeMatch = pathname.match(localeRegex);
    const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const localeMatch = pathname.match(localeRegex);
    const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
    url.pathname = `/${locale}/dashboard`;
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
    '/(tr|en|de|es|fr|it|pt|ru|zh|ja|ko|ar|hi|nl|sv|pl|no|da)/:path*',
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
};
