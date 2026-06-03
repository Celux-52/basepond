import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { analyzeWebsite } from '@/lib/services/analysis';
import { enrichCompanyData } from '@/lib/services/apollo';
import { generateAIScore } from '@/lib/services/ai-scorer';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId, steal } = await req.json();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const requiredCredits = steal ? 3 : 1;

    // 1. Check if user has credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || profile.credits < requiredCredits) {
      return NextResponse.json({ error: `Yetersiz kredi (Bu işlem için ${requiredCredits} kredi gerekiyor)` }, { status: 403 });
    }

    // 2. Get business data
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // 2.5 Check FOMO Lock (Arazi Kapmaca)
    if (business.claimed_by && business.claimed_by !== user.id && business.claimed_at) {
      const claimedDate = new Date(business.claimed_at);
      const now = new Date();
      const diffDays = (now.getTime() - claimedDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays <= 7 && !steal) {
        return NextResponse.json({ error: 'Bu fırsat yakın zamanda başka bir üye tarafından kilitlendi.' }, { status: 403 });
      }
    }

    // 3. Process the AI Analysis
    let website = business.website;
    let phone = business.phone;

    const websiteAnalysis = await analyzeWebsite(website);
    const apolloData = await enrichCompanyData(website, business.business_name);

    website = website || apolloData.website_url || null;
    phone = phone || apolloData.phone || null;

    const aiScore = await generateAIScore(
      { name: business.business_name, category: business.category || 'business' },
      websiteAnalysis,
      apolloData
    );

    // 4. Update Business and Analysis (Set FOMO Lock)
    await supabaseAdmin.from('businesses').update({
      phone: phone,
      website: website,
      claimed_by: user.id,
      claimed_at: new Date().toISOString()
    }).eq('id', business.id);

    // Fetch existing analysis id to update
    const { data: existingAnalysis } = await supabaseAdmin
      .from('business_analysis')
      .select('id')
      .eq('business_id', business.id)
      .single();

    if (existingAnalysis) {
      await supabaseAdmin.from('business_analysis').update({
        ai_score: aiScore.ai_score,
        opportunity_reason: aiScore.opportunity_reason,
        website_status: websiteAnalysis.status,
        growth_potential: aiScore.growth_potential,
        has_ssl: websiteAnalysis.has_ssl,
        mobile_responsive: websiteAnalysis.mobile_responsive,
        has_social_links: websiteAnalysis.has_social_links,
      }).eq('id', existingAnalysis.id);
    }

    // 5. Deduct credit and unlock
    await supabase.rpc('deduct_credits', {
      user_id_param: user.id,
      amount: requiredCredits
    });

    // Check if user already has a lead status
    const { data: statusRecord } = await supabaseAdmin
      .from('user_lead_status')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_id', business.id)
      .maybeSingle();

    if (statusRecord) {
      await supabaseAdmin.from('user_lead_status').update({
        is_unlocked: true,
        unlocked_at: new Date().toISOString()
      }).eq('id', statusRecord.id);
    } else {
      await supabaseAdmin.from('user_lead_status').insert({
        user_id: user.id,
        business_id: business.id,
        status: 'NEW',
        is_unlocked: true,
        unlocked_at: new Date().toISOString()
      });
    }

    // Return the updated data to the frontend
    return NextResponse.json({ success: true, ai_score: aiScore.ai_score });

  } catch (error: any) {
    console.error('analyze-now error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
