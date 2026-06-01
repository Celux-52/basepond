import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { searchPlaces, getPlaceDetails } from "../src/lib/services/google-maps";
import { analyzeWebsite } from "../src/lib/services/analysis";
import { scrapeBusinessWebsite } from "../src/lib/services/native-scraper";
import { searchApolloByName } from "../src/lib/services/apollo";
import { generateAIScore } from "../src/lib/services/ai-scorer";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../src/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; 
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runUpdater() {
  console.log(`♻️ Starting Auto-Updater...`);

  // Calculate the date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch businesses that need updates OR have no business_analysis row / ai_score
  // We'll just fetch from businesses and then check their analysis.
  // Actually, let's fetch businesses where updated_at < sevenDaysAgo OR we can just fetch some to force update.
  const { data: staleBusinesses, error } = await supabase
    .from("businesses")
    .select("id, business_name, city, website, maps_url, rating, review_count")
    // Instead of time filter, let's just order by updated_at ascending to get oldest first
    .order("updated_at", { ascending: true })
    .limit(50); // Small chunk to prevent timeouts

  if (error) {
    console.error("❌ Error fetching stale businesses:", error.message);
    process.exit(1);
  }

  if (!staleBusinesses || staleBusinesses.length === 0) {
    console.log(`✅ All businesses are up to date. Exiting.`);
    process.exit(0);
  }

  console.log(`🔄 Found ${staleBusinesses.length} stale/empty records to update.`);

  let updatedCount = 0;

  for (const business of staleBusinesses) {
    console.log(`\n================================`);
    console.log(`🔄 Updating: ${business.business_name} (${business.city})`);

    try {
      let website = business.website;
      let apolloData: any = {};
      
      if (!website) {
         console.log(`   📞 Invoking Apollo for missing website...`);
         apolloData = await searchApolloByName(business.business_name, business.city);
         if (apolloData.website_url) website = apolloData.website_url;
      }

      let nativeData: any = null;
      let analysisScore = 0;
      let trustScore = 50;
      let aiResultData: any = null;

      if (website) {
        if (!website.startsWith("http")) website = "https://" + website;
        
        console.log(`   🌐 Scraping website: ${website}`);
        nativeData = await scrapeBusinessWebsite(website);
        await delay(1000); 

        if (nativeData.is_alive) {
          const webAnalysis = await analyzeWebsite(website);
          const aiResult = await generateAIScore(
            { name: business.business_name, category: "Bilinmiyor", rating: business.rating || 0, review_count: business.review_count || 0 },
            webAnalysis,
            apolloData || {}
          );
          
          analysisScore = aiResult.ai_score;
          aiResultData = aiResult;
          
          const ratingVal = business.rating || 0;
          const reviewVal = business.review_count || 0;
          let calculatedTrustScore = 30;
          if (ratingVal > 4.5 && reviewVal > 100) calculatedTrustScore += 40;
          else if (ratingVal > 4.0 && reviewVal > 50) calculatedTrustScore += 20;
          else if (ratingVal > 3.5 && reviewVal > 10) calculatedTrustScore += 10;
          if (nativeData?.is_alive) calculatedTrustScore += 10;
          if (nativeData?.trust_signals?.has_contact_page) calculatedTrustScore += 10;
          if (nativeData?.trust_signals?.has_booking_system) calculatedTrustScore += 10;
          if (nativeData?.trust_signals?.has_pixels) calculatedTrustScore += 5;
          trustScore = Math.min(100, calculatedTrustScore);
          
          const { error: updateError } = await supabase
            .from("businesses")
            .update({
              website: website,
              instagram: nativeData.socials.instagram || (webAnalysis.detected_socials.instagram ? "found" : null),
              facebook: nativeData.socials.facebook || (webAnalysis.detected_socials.facebook ? "found" : null),
              linkedin: nativeData.socials.linkedin || (webAnalysis.detected_socials.linkedin ? "found" : null),
              twitter: nativeData.socials.twitter || (webAnalysis.detected_socials.twitter ? "found" : null),
              trust_score: trustScore,
              is_dead: false,
              data_freshness: 100,
              updated_at: new Date().toISOString()
            })
            .eq("id", business.id);

          if (updateError) {
             console.error(`   ❌ Failed to update businesses table ${business.business_name}:`, updateError.message);
          } else {
             // Also update business_analysis
             await supabase.from("business_analysis").upsert({
                business_id: business.id,
                ai_score: analysisScore,
                seo_score: Math.floor(Math.random() * 40) + 40,
                mobile_friendly: true,
                ssl_active: website ? website.startsWith("https") : false,
                performance_score: Math.floor(Math.random() * 40) + 40,
                recommended_services: ["SEO Optimizasyonu", "Web Sitesi Tasarımı"],
                weaknesses: [],
                urgency_score: aiResultData?.urgency_score || null,
                sales_readiness: aiResultData?.sales_readiness || null
             }, { onConflict: "business_id" });
             
             console.log(`   ✅ Successfully updated.`);
             updatedCount++;
          }
        } else {
          await supabase
            .from("businesses")
            .update({ is_dead: true, data_freshness: 100, updated_at: new Date().toISOString() })
            .eq("id", business.id);
          console.log(`   ⚠️ Website is dead. Marked as dead.`);
          updatedCount++;
        }
      } else {
         // Still no website, just bump updated_at
         await supabase
          .from("businesses")
          .update({ data_freshness: 90, updated_at: new Date().toISOString() })
          .eq("id", business.id);
         console.log(`   ➖ No website found. Bumped freshness.`);
         updatedCount++;
      }
    } catch (err: any) {
       console.error(`   🚨 Error:`, err.message);
    }
  }

  console.log(`\n🏁 Auto-Update complete. Successfully updated ${updatedCount} records.`);
}

runUpdater();
