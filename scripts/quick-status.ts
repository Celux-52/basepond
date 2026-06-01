import { createClient } from '@supabase/supabase-js';

async function check() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Disable SSL reject unauthorized for local proxy bypass (trailing dot issue)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { count: totalCount } = await sb.from('business_analysis').select('*', { count: 'exact', head: true });
  const { count: nullCount } = await sb.from('business_analysis').select('*', { count: 'exact', head: true }).is('ai_score', null);
  const { count: lockedCount } = await sb.from('business_analysis').select('*', { count: 'exact', head: true }).eq('ai_score', -1);
  const { count: completedCount } = await sb.from('business_analysis').select('*', { count: 'exact', head: true }).not('ai_score', 'is', null).neq('ai_score', -1);

  // Check phone and email counts on businesses table
  let allBusinesses: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await sb
      .from('businesses')
      .select('phone, email, website')
      .range(offset, offset + batchSize - 1);
      
    if (error || !data || data.length === 0) {
      break;
    }
    
    allBusinesses = [...allBusinesses, ...data];
    offset += batchSize;
  }
  
  let totalBusinesses = 0;
  let withPhone = 0;
  let withEmail = 0;
  let withWebsite = 0;
  let withBoth = 0;
  let withNeither = 0;

  totalBusinesses = allBusinesses.length;
  for (const b of allBusinesses) {
    const hasP = !!(b.phone && b.phone.trim());
    const hasE = !!(b.email && b.email.trim());
    const hasW = !!(b.website && b.website.trim());

    if (hasP) withPhone++;
    if (hasE) withEmail++;
    if (hasW) withWebsite++;
    if (hasP && hasE) withBoth++;
    if (!hasP && !hasE) withNeither++;
  }

  console.log('--- STATS REPORT ---');
  console.log('Total business_analysis rows:', totalCount);
  console.log('Completed AI score enrichment:', completedCount);
  console.log('Processing/Locked right now (-1):', lockedCount);
  console.log('Pending/Null AI score rows:', nullCount);
  console.log('--- GLOBAL PHONE & EMAIL STATS ---');
  console.log('Total businesses in DB:', totalBusinesses);
  console.log('Businesses with PHONE:', withPhone);
  console.log('Businesses with EMAIL:', withEmail);
  console.log('Businesses with WEBSITE:', withWebsite);
  console.log('Businesses with BOTH Phone & Email:', withBoth);
  console.log('Businesses with NEITHER Phone nor Email:', withNeither);
  console.log('--------------------');
}

check().catch(console.error);
