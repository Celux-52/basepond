import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/tr/dashboard';

  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${protocol}://${host}` : 'https://www.basepond.com');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/tr/login?error=oauth`);
}
