import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['melih20052005gs@gmail.com'];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
    }

    // 🔒 ADMIN ONLY - Sadece admin bu endpoint'i kullanabilir
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
    }

    const body = await request.json();
    const amount = Number(body.amount);
    // Admin başka bir kullanıcıya da ekleyebilir, yoksa kendi hesabına
    const targetUserId = body.targetUserId || user.id;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Geçersiz kredi miktarı.' }, { status: 400 });
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: fetchError } = await adminClient
      .from('profiles')
      .select('credits')
      .eq('id', targetUserId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
    }

    const newCredits = (profile.credits || 0) + amount;

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', targetUserId);

    if (updateError) {
      return NextResponse.json({ error: 'Kredi güncellenemedi.' }, { status: 500 });
    }

    console.log(`[Admin Credits] ${user.email} added ${amount} credits to ${targetUserId}. New total: ${newCredits}`);
    return NextResponse.json({ success: true, credits: newCredits });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
