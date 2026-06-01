import { createClient } from '@supabase/supabase-js';
import { searchPlaces, getPlaceDetails } from '../src/lib/services/google-maps';
import { scrapeBusinessWebsite } from '../src/lib/services/native-scraper';
import { enrichCompanyData } from '../src/lib/services/apollo';
import { generateAIScore } from '../src/lib/services/ai-scorer';
import { analyzeWebsite } from '../src/lib/services/analysis';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// --- STRICT DATA QUALITY VALIDATION ---

// Standardized TR Phone validator
function isValidTurkishPhone(phone: string | null): boolean {
  if (!phone) return false;
  
  // Strip everything except numbers and leading plus
  const digits = phone.replace(/[^\d+]/g, '');
  
  // Reject mock patterns (e.g., 000000, 1111111, etc.)
  if (/^(0|1|2|3|4|5|6|7|8|9)\1+$/.test(digits)) return false;
  if (digits.length < 7) return false;
  if (digits.includes('abcdef') || digits.includes('123456')) return false;

  // Accept Turkish landline or mobile
  // Mobile: 05xx, Landline: 02xx, 03xx, 0850 etc.
  const isTR = /^(?:\+90|90|0)?(?:[2-9]\d{2})\d{7}$/.test(digits);
  return isTR;
}

// Clean and format phone numbers
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 10) {
    return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+90 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
  if (digits.length === 12 && digits.startsWith('90')) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  return phone.trim();
}

async function runEnterpriseDiscovery() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  console.log('🤖 --- SNAPLEAD ENTERPRISE DATA QUALITY PIPELINE ---');
  console.log('👀 Querying target: 1000 new phone-verified business leads...');
  
  // Target cities and categories
  const targetCategories = ["Güzellik Salonu", "Diş Hekimi", "Restoran", "Kuaför"];
  const targetCities = ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Kocaeli"];
  
  let totalSaved = 0;
  let totalSkipped = 0;
  let totalDuplicates = 0;
  
  // Select random city/category pairs to diversify discovery
  const searchPairs = [];
  for (const cat of targetCategories) {
    for (const city of targetCities) {
      searchPairs.push({ city, category: cat });
    }
  }
  
  // Shuffle search pairs
  searchPairs.sort(() => Math.random() - 0.5);
  
  const resultsTable: any[] = [];
  
  for (const pair of searchPairs) {
    if (totalSaved >= 1000) break;
    
    console.log(`\n🚀 Searching for: "${pair.city} ${pair.category}"`);
    
    try {
      const query = `${pair.city} ${pair.category}`;
      const places = await searchPlaces(query, 30); // Grab up to 30 places per batch
      
      console.log(`📋 Found ${places.length} raw results. Processing with strict data quality rules...`);
      
      for (const place of places) {
        if (totalSaved >= 1000) break;
        
        // 1. DEDUPLICATION CHECK (Deduplicate by name & city first)
        const { data: existingByName } = await sb
          .from('businesses')
          .select('id, phone')
          .eq('business_name', place.name)
          .eq('city', pair.city)
          .maybeSingle();
          
        if (existingByName) {
          totalDuplicates++;
          continue;
        }
        
        // Fetch full Google place details (website, phone, etc.)
        const details = await getPlaceDetails(place.place_id);
        if (!details) continue;
        
        // 2. CRITICAL RULE: TELEFON ZORUNLU KURALI
        // Grab phone from Google Maps
        let foundPhone = details.formatted_phone_number || null;
        let foundWebsite = details.website || null;
        let foundEmail = null;
        let sourceUsed = "Google Maps";
        let confidenceScore = "yüksek";
        
        // Website Scraping
        let nativeData = null;
        let webAnalysis = { status: "no_website", has_ssl: false, mobile_responsive: false, has_social_links: false };
        
        if (foundWebsite && foundWebsite !== "Yok") {
          try {
            console.log(`   🌐 Scraping website: ${foundWebsite}`);
            nativeData = await scrapeBusinessWebsite(foundWebsite);
            webAnalysis = await analyzeWebsite(foundWebsite);
            
            // Waterfall Phone recovery from website
            if (!foundPhone && nativeData.phones && nativeData.phones.length > 0) {
              foundPhone = nativeData.phones[0];
              sourceUsed = "resmi website";
              confidenceScore = "yüksek";
            }
            // Email recovery
            if (nativeData.emails && nativeData.emails.length > 0) {
              foundEmail = nativeData.emails[0];
            }
          } catch (e) {
            // scrape error
          }
        }
        
        // 3. APOLLO ENRICHMENT CONDITIONAL RULE
        // Apollo only runs if: website is present, email is missing, and estimated AI score is high
        const estimatedScore = (place.rating || 0) * 15 + (place.user_ratings_total ? Math.min(25, place.user_ratings_total / 10) : 0);
        const shouldRunApollo = foundWebsite && !foundEmail && estimatedScore >= 60;
        
        if (shouldRunApollo) {
          try {
            console.log(`   📞 Enriching with Apollo waterfall...`);
            const apolloResult = await enrichCompanyData(foundWebsite, place.name);
            if (apolloResult.phone && !foundPhone) {
              foundPhone = apolloResult.phone;
              sourceUsed = "Apollo enrichment";
              confidenceScore = "yüksek";
            }
            if (apolloResult.primary_email && !foundEmail) {
              foundEmail = apolloResult.primary_email;
            }
          } catch (e) {
            // apollo failed
          }
        }
        
        // 4. PHONE VALIDATION & DEDUPLICATION BY PHONE
        const hasValidPhone = isValidTurkishPhone(foundPhone);
        
        if (!hasValidPhone) {
          // STRICT RULE: Auto-skip any business without a valid phone number!
          totalSkipped++;
          console.log(`   ❌ SKIP: ${place.name} has no valid Turkish phone. (Auto-filtered)`);
          continue;
        }
        
        const cleanPhone = formatPhoneNumber(foundPhone!);
        
        // Deduplicate globally by phone number to prevent duplicate business lines!
        const { data: existingByPhone } = await sb
          .from('businesses')
          .select('id')
          .eq('phone', cleanPhone)
          .maybeSingle();
          
        if (existingByPhone) {
          totalDuplicates++;
          console.log(`   ❌ SKIP: Duplicate phone number found for ${place.name}`);
          continue;
        }
        
        // 5. AI SUITE ANALYSIS
        console.log(`   🤖 Generating AI Opportunity Insights...`);
        const aiScoreResult = await generateAIScore(
          { name: place.name, category: pair.category, rating: place.rating || 0, review_count: place.user_ratings_total || 0 },
          webAnalysis,
          {}
        );
        
        // Trust Score calculation
        const ratingVal = place.rating || 0;
        const reviewVal = place.user_ratings_total || 0;
        let trustScore = 30;
        if (ratingVal > 4.5 && reviewVal > 100) trustScore += 40;
        else if (ratingVal > 4.0 && reviewVal > 50) trustScore += 20;
        if (nativeData?.is_alive) trustScore += 10;
        if (nativeData?.trust_signals?.has_contact_page) trustScore += 10;
        trustScore = Math.min(100, trustScore);
        
        // 6. DB INSERTION
        const { data: newBiz, error: insertError } = await sb
          .from('businesses')
          .insert({
            business_name: place.name,
            category: pair.category,
            city: pair.city,
            phone: cleanPhone,
            email: foundEmail,
            website: foundWebsite || "Yok",
            maps_url: details.url || null,
            instagram: nativeData?.socials?.instagram || null,
            facebook: nativeData?.socials?.facebook || null,
            linkedin: nativeData?.socials?.linkedin || null,
            twitter: nativeData?.socials?.twitter || null,
            rating: place.rating || null,
            review_count: place.user_ratings_total || null,
            trust_score: trustScore,
            data_freshness: 100,
            is_dead: nativeData ? !nativeData.is_alive : false
          })
          .select()
          .single();
          
        if (insertError) {
          console.error(`   ❌ DB Insert failed: ${insertError.message}`);
          continue;
        }
        
        // Insert Analysis Row
        await sb.from('business_analysis').insert({
          business_id: newBiz.id,
          ai_score: aiScoreResult.ai_score,
          seo_score: webAnalysis.has_ssl ? 80 : 30,
          mobile_score: webAnalysis.mobile_responsive ? 95 : 20,
          social_score: webAnalysis.has_social_links ? 50 : 10,
          opportunity_reason: aiScoreResult.opportunity_reason,
          growth_potential: aiScoreResult.growth_potential,
          urgency_score: aiScoreResult.urgency_score,
          sales_readiness: aiScoreResult.sales_readiness,
          buy_intent: aiScoreResult.buy_intent,
          why_now_signals: aiScoreResult.why_now_signals
        });
        
        totalSaved++;
        console.log(`   ✅ SUCCESS [${totalSaved}/1000]: Saved phone-verified business ${place.name} | Phone: ${cleanPhone}`);
        
        if (resultsTable.length < 10) {
          resultsTable.push({
            business_name: place.name,
            city: pair.city,
            category: pair.category,
            phone: cleanPhone,
            email: foundEmail,
            website: foundWebsite || "Yok",
            source_used: sourceUsed,
            confidence_score: confidenceScore,
            status: "tamamlandı"
          });
        }
        
        // Sleep to avoid maps and openrouter rate limits
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (e: any) {
      console.error(`❌ Search error in pair:`, e.message);
    }
  }
  
  console.log('\n🏁 --- ENTERPRISE DISCOVERY RUN COMPLETE ---');
  console.log(`📊 Total Phone-Verified Businesses Saved: ${totalSaved}`);
  console.log(`❌ Skipped (No valid Phone/Auto-filtered): ${totalSkipped}`);
  console.log(`👥 Skipped (Duplicates by name/phone): ${totalDuplicates}`);
  console.log('---------------------------------------------');
  
  console.log('\n📋 --- SAMPLE QUALITY TELEMETRY REPORT ---');
  console.log(JSON.stringify(resultsTable, null, 2));
}

runEnterpriseDiscovery().catch(console.error);
