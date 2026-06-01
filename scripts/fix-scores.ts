import { createClient } from '@supabase/supabase-js';
import { analyzeWebsite } from '../src/lib/services/analysis';
import { generateAIScore } from '../src/lib/services/ai-scorer';
import { scrapeBusinessWebsite } from '../src/lib/services/native-scraper';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fixZeroScores() {
  console.log('🔧 Starting Score Fixer — targeting urgency_score=0 AND sales_readiness=0...');

  // Get business_analysis rows where urgency_score is 0
  const { data: analysisRows, error } = await sb
    .from('business_analysis')
    .select('business_id, urgency_score, sales_readiness')
    .eq('urgency_score', 0)
    .limit(100);

  if (error) {
    console.error('Error fetching:', error.message);
    return;
  }

  if (!analysisRows || analysisRows.length === 0) {
    console.log('✅ No records to fix!');
    return;
  }

  const businessIds = analysisRows.map(r => r.business_id);

  // Get corresponding business info — include ones with no website too
  const { data: businesses } = await sb
    .from('businesses')
    .select('id, business_name, city, website, rating, review_count, category')
    .in('id', businessIds);

  console.log(`Found ${businesses?.length || 0} businesses to fix.`);

  let fixed = 0;

  for (const biz of (businesses || [])) {
    console.log(`\n🔄 Fixing: ${biz.business_name}`);
    const website = biz.website as string | null;

    try {
      let nativeData: any = null;
      let webAnalysis: any = {
        status: website ? "unknown" : "no_website",
        has_ssl: false,
        mobile_responsive: false,
        has_social_links: false,
        detected_socials: { instagram: false, linkedin: false, facebook: false, twitter: false },
        page_load_score: 0
      };

      if (website) {
        nativeData = await scrapeBusinessWebsite(website);
        await delay(500);
        if (nativeData?.is_alive) {
          webAnalysis = await analyzeWebsite(website);
        }
      }

      const aiResult = await generateAIScore(
        { name: biz.business_name, category: biz.category || 'Bilinmiyor', rating: biz.rating || 0, review_count: biz.review_count || 0 },
        webAnalysis,
        {}
      );

      console.log(`  AI Score: ${aiResult.ai_score}, Urgency: ${aiResult.urgency_score}, Readiness: ${aiResult.sales_readiness}`);

      const { error: updateError } = await sb
        .from('business_analysis')
        .update({
          ai_score: aiResult.ai_score,
          urgency_score: aiResult.urgency_score,
          sales_readiness: aiResult.sales_readiness,
          buy_intent: aiResult.buy_intent,
          opportunity_reason: aiResult.opportunity_reason,
          why_now_signals: aiResult.why_now_signals
        })
        .eq('business_id', biz.id);

      if (updateError) {
        console.error(`  ❌ Error: ${updateError.message}`);
      } else {
        console.log(`  ✅ Fixed!`);
        fixed++;
      }

      await delay(1000);
    } catch (err: any) {
      console.error(`  ⚠️ Error for ${biz.business_name}: ${err.message}`);
    }
  }

  console.log(`\n🏁 Done! Fixed ${fixed} records.`);
}

fixZeroScores();
