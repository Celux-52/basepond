import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
  const { count: totalAnalysis } = await sb
    .from('business_analysis')
    .select('*', { count: 'exact', head: true });

  const { count: withScore } = await sb
    .from('business_analysis')
    .select('*', { count: 'exact', head: true })
    .not('ai_score', 'is', null);

  const { data: sample } = await sb
    .from('business_analysis')
    .select('business_id, ai_score, urgency_score, sales_readiness, buy_intent')
    .not('ai_score', 'is', null)
    .limit(3);

  const { data: joined } = await sb
    .from('businesses')
    .select('id, business_name, business_analysis(*)')
    .limit(3);

  console.log('=== DB HEALTH CHECK ===');
  console.log('Total rows in business_analysis:', totalAnalysis);
  console.log('Rows with ai_score:', withScore);
  console.log('Sample analysis:', JSON.stringify(sample, null, 2));
  console.log('Sample joined (raw):', JSON.stringify(joined?.map((b: any) => ({
    name: b.business_name,
    analysis_raw: b.business_analysis
  })), null, 2));
}

main();
