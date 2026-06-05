import { searchPlaces, getPlaceDetails } from "../services/google-maps";
import { enrichCompanyData } from "../services/apollo";
import { analyzeWebsite } from "../services/analysis";
import { generateAIScore } from "../services/ai-scorer";
import { createClient } from "@/lib/supabase/server";
import { scrapeBusinessWebsite } from "../services/native-scraper";

export interface ProcessedBusiness {
  id?: string;
  name: string;
  category: string;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  maps_url: string | null;
  rating: number | null;
  review_count: number | null;
  ai_score: number | null;
  seo_score: number | null;
  mobile_score: number | null;
  social_score: number | null;
  trust_score: number | null;
  growth_score: number | null;
  opportunity_reason: string | null;
  cached: boolean;
}

export async function* runBusinessDiscovery(query: string, city: string, category: string, amount: number, userId: string) {
  const supabase = await createClient();

  // City normalization to prevent duplicates (e.g. "ıstanbul " vs "Istanbul")
  const CITY_NORM_MAP: Record<string, string> = {
    "istanbul": "Istanbul",
    "ıstanbul": "Istanbul",
    "ıstanbul ": "Istanbul",
    "istanbul ": "Istanbul",
    "ankara": "Ankara",
    "izmir": "Izmir",
    "ızmir": "Izmir",
    "bursa": "Bursa",
    "antalya": "Antalya",
    "kocaeli": "Kocaeli",
    "adana": "Adana",
    "konya": "Konya",
    "gaziantep": "Gaziantep",
    "mersin": "Mersin"
  };
  const trimmedLower = city.trim().toLowerCase();
  const normalizedCity = CITY_NORM_MAP[trimmedLower] || (city.trim().charAt(0).toUpperCase() + city.trim().slice(1));

  // 1. Fetch from Database First (The Core "Havuz" Check)
  const { data: cachedDbRecords } = await supabase
    .from("businesses")
    .select("*, business_analysis(*), cache_system(*)")
    .eq("city", normalizedCity)
    .ilike("category", `%${category}%`)
    .order("rating", { ascending: false })
    .limit(amount * 2); // Fetch extra to filter stale ones

  const freshRecords: any[] = [];
  const staleRecords: any[] = [];

  if (cachedDbRecords) {
    for (const record of cachedDbRecords) {
      const lastChecked = new Date(record.cache_system?.last_checked_at || record.updated_at);
      const daysOld = (new Date().getTime() - lastChecked.getTime()) / (1000 * 3600 * 24);
      if (daysOld <= 7) {
        freshRecords.push(record);
      } else {
        staleRecords.push(record);
      }
    }
  }

  // Yield Fresh Records instantly (0 Cost)
  const yieldedNames = new Set<string>();
  let yieldedCount = 0;

  for (const existing of freshRecords) {
    if (yieldedCount >= amount) break;
    
    yield {
      id: existing.id,
      name: existing.business_name,
      category: existing.category,
      city: existing.city,
      phone: existing.phone,
      email: existing.email,
      website: existing.website,
      instagram: existing.instagram,
      facebook: existing.facebook,
      twitter: existing.twitter,
      linkedin: existing.linkedin,
      maps_url: existing.maps_url,
      rating: existing.rating,
      review_count: existing.review_count,
      ai_score: existing.business_analysis?.ai_score || 0,
      seo_score: existing.business_analysis?.seo_score || 0,
      mobile_score: existing.business_analysis?.mobile_score || 0,
      social_score: existing.business_analysis?.social_score || 0,
      trust_score: 50,
      growth_score: Number(existing.business_analysis?.growth_potential) || 50,
      opportunity_reason: existing.business_analysis?.opportunity_reason || "",
      cached: true
    };
    yieldedNames.add(existing.business_name);
    yieldedCount++;
  }

  const remainingNeeded = amount - yieldedCount;
  
  let totalGoogleCost = 0;
  let totalApolloCost = 0;
  let totalAiCost = 0;
  let totalCredits = 0;
  let apiCallsCount = 0;

  // If we still need more, fallback to APIs
  if (remainingNeeded > 0) {
    // 2. Fallback to Google Maps API
    const places = await searchPlaces(query, amount * 2); // Fetch extra to account for skips
    totalGoogleCost += 1;
    totalCredits += 1;
    apiCallsCount += 1;

    // Filter places we already yielded
    const placesToProcess = places.filter(p => !yieldedNames.has(p.name)).slice(0, remainingNeeded);

    const CONCURRENCY_LIMIT = 5;
    for (let i = 0; i < placesToProcess.length; i += CONCURRENCY_LIMIT) {
      const chunk = placesToProcess.slice(i, i + CONCURRENCY_LIMIT);
      
      const processPromises = chunk.map(async (place) => {
      try {
        // Fetch Details
        const details = await getPlaceDetails(place.place_id);
        let costPerScan = 0;

        // Native Web Scraper Integration
        let nativeData = null;
        if (details?.website) {
          nativeData = await scrapeBusinessWebsite(details.website);
        }

        // Web Analysis (Core)
        const webAnalysis = await analyzeWebsite(details?.website);
        costPerScan += 1;
        apiCallsCount += 1;

        // Apollo Enrichment Waterfall (Fill in the blanks)
        // We run this if critical data (website, phone, email) is missing or if we just want full coverage.
        let apolloData: any = {};
        const needsApollo = !details?.website || !details?.formatted_phone_number || !nativeData?.emails?.length;
        
        if (needsApollo) {
          apolloData = await enrichCompanyData(details?.website, place.name);
          costPerScan += 2;
          totalApolloCost += 2;
          apiCallsCount += 1;
        }

        // Merge Data (Waterfall precedence: Google Maps > Native Scraper > Apollo)
        const finalPhone = details?.formatted_phone_number || apolloData.phone || null;
        const finalWebsite = details?.website || apolloData.website_url || null;
        const emailStatus = nativeData?.emails?.[0] || apolloData.primary_email || null;
        
        const instagramStatus = nativeData?.socials.instagram || (webAnalysis.detected_socials.instagram ? "found" : null);
        const linkedinStatus = nativeData?.socials.linkedin || apolloData.linkedin_url || (webAnalysis.detected_socials.linkedin ? "found" : null);
        const facebookStatus = nativeData?.socials.facebook || apolloData.facebook_url || (webAnalysis.detected_socials.facebook ? "found" : null);
        const twitterStatus = nativeData?.socials.twitter || apolloData.twitter_url || (webAnalysis.detected_socials.twitter ? "found" : null);
        const mapsUrlStatus = details?.url || null;

        // AI Analysis
        const aiScore = await generateAIScore(
          { name: place.name, category, rating: place.rating, review_count: place.user_ratings_total },
          webAnalysis,
          apolloData
        );
        costPerScan += 1;
        totalAiCost += 1;
        apiCallsCount += 1;

        const calculatedSeoScore = webAnalysis.has_ssl ? 80 : 30;
        const calculatedMobileScore = webAnalysis.mobile_responsive ? 95 : 20;
        const calculatedSocialScore = webAnalysis.has_social_links ? (apolloData.linkedin_url || apolloData.facebook_url ? 85 : 50) : 10;
        
        const ratingVal = place.rating || 0;
        const reviewVal = place.user_ratings_total || 0;
        let calculatedTrustScore = 30;
        
        // Trust Algorithm
        if (ratingVal > 4.5 && reviewVal > 100) calculatedTrustScore += 40;
        else if (ratingVal > 4.0 && reviewVal > 50) calculatedTrustScore += 20;
        else if (ratingVal > 3.5 && reviewVal > 10) calculatedTrustScore += 10;

        if (nativeData?.is_alive) calculatedTrustScore += 10;
        if (nativeData?.trust_signals.has_contact_page) calculatedTrustScore += 10;
        if (nativeData?.trust_signals.has_booking_system) calculatedTrustScore += 10;
        if (nativeData?.trust_signals.has_pixels) calculatedTrustScore += 5;

        calculatedTrustScore = Math.min(100, calculatedTrustScore);

        // Storage update cost
        costPerScan += 1;
        totalCredits += costPerScan;

        const { data: newBusiness, error: bError } = await supabase
          .from("businesses")
          .upsert({
            business_name: place.name,
            category,
            city: normalizedCity,
            phone: finalPhone,
            website: finalWebsite,
            rating: place.rating || null,
            review_count: place.user_ratings_total || null,
            instagram: instagramStatus,
            linkedin: linkedinStatus,
            facebook: facebookStatus,
            twitter: twitterStatus,
            email: emailStatus,
            maps_url: mapsUrlStatus,
            trust_score: calculatedTrustScore,
            data_freshness: 100,
            is_dead: nativeData ? !nativeData.is_alive : false
          }, { onConflict: "business_name,city" })
          .select()
          .single();

        if (newBusiness) {
          await supabase.from("business_analysis").upsert({
            business_id: newBusiness.id,
            ai_score: aiScore.ai_score,
            seo_score: calculatedSeoScore,
            mobile_score: calculatedMobileScore,
            social_score: calculatedSocialScore,
            opportunity_reason: aiScore.opportunity_reason,
            website_status: webAnalysis.status,
            growth_potential: aiScore.growth_potential,
            urgency_score: aiScore.urgency_score,
            sales_readiness: aiScore.sales_readiness,
            buy_intent: aiScore.buy_intent,
            why_now_signals: aiScore.why_now_signals
          });

          await supabase.from("cache_system").upsert({
            business_id: newBusiness.id,
            last_checked_at: new Date().toISOString(),
            needs_update: false
          });

          return {
            id: newBusiness.id,
            name: newBusiness.business_name,
            category: newBusiness.category,
            city: newBusiness.city,
            phone: newBusiness.phone,
            email: emailStatus,
            website: newBusiness.website,
            instagram: instagramStatus,
            facebook: facebookStatus,
            twitter: twitterStatus,
            linkedin: linkedinStatus,
            maps_url: mapsUrlStatus,
            rating: newBusiness.rating,
            review_count: newBusiness.review_count,
            ai_score: aiScore.ai_score,
            seo_score: calculatedSeoScore,
            mobile_score: calculatedMobileScore,
            social_score: calculatedSocialScore,
            trust_score: calculatedTrustScore,
            growth_score: aiScore.growth_potential,
            opportunity_reason: aiScore.opportunity_reason,
            cached: false
          };
        }
        return null;
      } catch (e) {
        console.error("Error processing place", place.name, e);
        return null;
      }
    });

      const results = await Promise.all(processPromises);
      for (const result of results) {
        if (result) {
          yieldedCount++;
          yield result;
        }
      }

      // API Rate Limit Protection (Cooldown between chunks)
      if (i + CONCURRENCY_LIMIT < placesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  // 3. Log Usage and Cost
  await supabase.from("searches").insert({
    user_id: userId,
    search_query: query,
    city: normalizedCity,
    category,
    requested_amount: amount,
    credits_used: totalCredits
  });
}
