import { loadEnvConfig } from "@next/env";
// Load Next.js environment variables from .env.local
loadEnvConfig(process.cwd());

import { createClient } from '@supabase/supabase-js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { analyzeWebsite } from '../src/lib/services/analysis';
import { generateAIScore } from '../src/lib/services/ai-scorer';
import { scrapeBusinessWebsite } from '../src/lib/services/native-scraper';
import { searchApolloByName } from "../src/lib/services/apollo";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function enrichScores() {
  console.log('🤖 Starting Background AI Enrichment Engine (Engine 2)...');
  console.log('👀 Watching for businesses with null AI scores to analyze...');

  while (true) {
    try {
      // 1. Fetch business_analysis rows where ai_score is null
      const { data: analysisRows, error } = await sb
        .from('business_analysis')
        .select('business_id')
        .is('ai_score', null)
        .limit(10);

      if (error) {
        console.error('❌ Error fetching pending analysis:', error.message);
        await delay(5000); // Back off if there is a DB error
        continue;
      }

      if (!analysisRows || analysisRows.length === 0) {
        console.log('💤 No pending businesses to enrich. Sleeping for 15 seconds...');
        await delay(15000);
        continue;
      }

      const businessIds = analysisRows.map(r => r.business_id);

      // Lock these records by setting ai_score to -1 (distributed queue locking)
      const { error: lockError } = await sb
        .from('business_analysis')
        .update({ ai_score: -1 })
        .in('business_id', businessIds);

      if (lockError) {
        console.error('❌ Error acquiring lock on batch:', lockError.message);
        await delay(3000);
        continue;
      }

      // 2. Fetch corresponding business info
      const { data: businesses, error: bizError } = await sb
        .from('businesses')
        .select('id, business_name, city, website, rating, review_count, category')
        .in('id', businessIds);

      if (bizError) {
        console.error('❌ Error fetching business details:', bizError.message);
        // Release lock
        await sb
          .from('business_analysis')
          .update({ ai_score: null })
          .in('business_id', businessIds);
        await delay(5000);
        continue;
      }

      console.log(`\n📋 Processing batch of ${businesses?.length || 0} pending enrichments...`);

      for (const biz of (businesses || [])) {
        console.log(`\n------------------------------------------------------`);
        console.log(`🔍 Enriching: ${biz.business_name} (${biz.city})`);
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

          // A. Website Scraping
          if (website) {
            try {
              console.log(`   🌐 Scraping website: ${website}`);
              nativeData = await scrapeBusinessWebsite(website);
              await delay(1000); // Delay between scrapers
              
              if (nativeData?.is_alive) {
                console.log(`   📊 Analyzing web performance...`);
                webAnalysis = await analyzeWebsite(website);
              }
            } catch (scrapingErr) {
              console.warn(`   ⚠️ Website scraping failed:`, scrapingErr);
            }
          }

          // Try apollo fallback again if some details were missing in fast gen
          let apolloData: any = {};
          const needsApollo = !biz.phone || !biz.website || !nativeData?.emails?.length;
          if (needsApollo) {
            try {
              console.log(`   📞 Missing core details, searching Apollo...`);
              apolloData = await searchApolloByName(biz.business_name, biz.city);
            } catch (apolloErr) {
              console.warn(`   ⚠️ Apollo search failed:`, apolloErr);
            }
          }

          const finalPhone = biz.phone || apolloData.phone || null;
          const emailStatus = nativeData?.emails?.[0] || apolloData.primary_email || null;
          const instagramStatus = nativeData?.socials?.instagram || (webAnalysis?.detected_socials?.instagram ? "found" : null);
          const linkedinStatus = nativeData?.socials?.linkedin || apolloData.linkedin_url || (webAnalysis?.detected_socials?.linkedin ? "found" : null);
          const facebookStatus = nativeData?.socials?.facebook || apolloData.facebook_url || (webAnalysis?.detected_socials?.facebook ? "found" : null);
          const twitterStatus = nativeData?.socials?.twitter || apolloData.twitter_url || (webAnalysis?.detected_socials?.twitter ? "found" : null);
          
          // B. AI Scoring Engine
          console.log(`   🤖 Generating AI Insights with OpenRouter...`);
          const aiResult = await generateAIScore(
            { name: biz.business_name, category: biz.category || 'Bilinmiyor', rating: biz.rating || 0, review_count: biz.review_count || 0 },
            webAnalysis,
            apolloData
          );

          // C. Calculate final trust score based on richer signals
          const ratingVal = biz.rating || 0;
          const reviewVal = biz.review_count || 0;
          let trustScore = 30;
          if (ratingVal > 4.5 && reviewVal > 100) trustScore += 40;
          else if (ratingVal > 4.0 && reviewVal > 50) trustScore += 20;
          else if (ratingVal > 3.5 && reviewVal > 10) trustScore += 10;
          if (nativeData?.is_alive) trustScore += 10;
          if (nativeData?.trust_signals?.has_contact_page) trustScore += 10;
          if (nativeData?.trust_signals?.has_booking_system) trustScore += 10;
          if (nativeData?.trust_signals?.has_pixels) trustScore += 5;
          trustScore = Math.min(100, trustScore);

          console.log(`   🎯 AI Score: ${aiResult.ai_score} | Urgency: ${aiResult.urgency_score} | Readiness: ${aiResult.sales_readiness} | Intent: ${aiResult.buy_intent}`);

          // D. Update Business Info with Socials and updated Trust Score
          await sb
            .from('businesses')
            .update({
              phone: finalPhone,
              email: emailStatus,
              instagram: instagramStatus,
              linkedin: linkedinStatus,
              facebook: facebookStatus,
              twitter: twitterStatus,
              is_dead: nativeData ? !nativeData.is_alive : false,
              trust_score: trustScore
            })
            .eq('id', biz.id);

          // E. Update Business Analysis Table
          const { error: updateError } = await sb
            .from('business_analysis')
            .update({
              ai_score: aiResult.ai_score,
              urgency_score: aiResult.urgency_score,
              sales_readiness: aiResult.sales_readiness,
              buy_intent: aiResult.buy_intent,
              opportunity_reason: aiResult.opportunity_reason,
              why_now_signals: aiResult.why_now_signals,
              seo_score: webAnalysis.status === "no_website" ? 30 : (webAnalysis.has_ssl ? 80 : 30),
              website_status: webAnalysis.status,
              mobile_score: webAnalysis.mobile_responsive ? 95 : 20,
              social_score: webAnalysis.has_social_links ? 50 : 10,
              growth_potential: aiResult.growth_potential
            })
            .eq('business_id', biz.id);

          if (updateError) {
            console.error(`   ❌ Update error: ${updateError.message}`);
          } else {
            console.log(`   ✅ Successfully Enriched: ${biz.business_name}`);
          }

          // Rate limit delay between entities
          await delay(2000);
        } catch (err: any) {
          console.error(`   ⚠️ Failed to enrich ${biz.business_name}: ${err.message}`);
          // Release lock by setting ai_score back to null so it can be picked up later
          await sb
            .from('business_analysis')
            .update({ ai_score: null })
            .eq('business_id', biz.id);
          await delay(1000);
        }
      }
    } catch (loopError: any) {
      console.error('🚨 Crash in enrichment loop:', loopError.message);
      await delay(5000);
    }
  }
}

enrichScores();
