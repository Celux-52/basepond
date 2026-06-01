import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId } = await request.json();
  if (!businessId) return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_businesses')
    .select('id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .maybeSingle();

  if (existing) {
    // Unsave
    await supabase.from('saved_businesses').delete().eq('id', existing.id);
    return NextResponse.json({ saved: false });
  } else {
    // Save
    await supabase.from('saved_businesses').insert({ user_id: user.id, business_id: businessId });
    return NextResponse.json({ saved: true });
  }
}
