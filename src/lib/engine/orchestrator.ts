import { searchPlaces, getPlaceDetails } from "../services/google-maps";
import { enrichCompanyData } from "../services/apollo";
import { analyzeWebsite } from "../services/analysis";
import { generateAIScore } from "../services/ai-scorer";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../types/supabase";

// For server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export interface ProcessedBusiness {
  id?: string;
  name: string;
  category: string;
  city: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  ai_score: number | null;
  opportunity_reason: string | null;
  cached: boolean;
}

export async function* runBusinessDiscovery(query: string, city: string, category: string, amount: number, userId: string) {
  // 1. Log search
  await supabase.from("searches").insert({
    user_id: userId,
    search_query: query,
    city,
    category,
    requested_amount: amount,
    credits_used: 0 // Will update later
  });

  // 2. Fetch from Google Maps
  const places = await searchPlaces(query, amount);
  let creditsUsed = 0;

  for (const place of places) {
    // Check if business exists in DB by name and city
    const { data: existing } = await supabase
      .from("businesses")
      .select("*, business_analysis(*), cache_system(*)")
      .eq("business_name", place.name)
      .eq("city", city)
      .single();

    if (existing) {
      // Check cache staleness (7 days)
      const lastChecked = new Date(existing.cache_system?.last_checked_at || existing.updated_at);
      const daysOld = (new Date().getTime() - lastChecked.getTime()) / (1000 * 3600 * 24);

      if (daysOld < 7) {
        // Yield cached result
        yield {
          id: existing.id,
          name: existing.business_name,
          category: existing.category,
          city: existing.city,
          phone: existing.phone,
          website: existing.website,
          rating: existing.rating,
          review_count: existing.review_count,
          ai_score: existing.business_analysis?.ai_score || 0,
          opportunity_reason: existing.business_analysis?.opportunity_reason || "",
          cached: true
        };
        continue;
      }
    }

    // Cache Miss or Stale -> Enrich Data
    const details = await getPlaceDetails(place.place_id);
    const apolloData = await enrichCompanyData(details?.website, place.name);
    const webAnalysis = await analyzeWebsite(details?.website);
    const aiScore = await generateAIScore(
      { name: place.name, category, rating: place.rating, review_count: place.user_ratings_total },
      webAnalysis,
      apolloData
    );

    // Save to DB
    const { data: newBusiness, error: bError } = await supabase
      .from("businesses")
      .upsert({
        business_name: place.name,
        category,
        city,
        phone: details?.formatted_phone_number || null,
        website: details?.website || null,
        rating: place.rating || null,
        review_count: place.user_ratings_total || null,
        instagram: webAnalysis.detected_socials.instagram ? "found" : null,
        linkedin: apolloData.linkedin_url || (webAnalysis.detected_socials.linkedin ? "found" : null),
        facebook: apolloData.facebook_url || (webAnalysis.detected_socials.facebook ? "found" : null),
        twitter: apolloData.twitter_url || (webAnalysis.detected_socials.twitter ? "found" : null),
        email: apolloData.primary_email || null,
        maps_url: details?.url || null
      }, { onConflict: "business_name,city" })
      .select()
      .single();

    if (newBusiness) {
      await supabase.from("business_analysis").upsert({
        business_id: newBusiness.id,
        ai_score: aiScore.ai_score,
        seo_score: webAnalysis.has_ssl ? 50 : 0, // simple heuristic
        mobile_score: webAnalysis.mobile_responsive ? 100 : 0,
        social_score: webAnalysis.has_social_links ? 100 : 0,
        opportunity_reason: aiScore.opportunity_reason,
        website_status: webAnalysis.status,
        growth_potential: aiScore.growth_potential
      });

      await supabase.from("cache_system").upsert({
        business_id: newBusiness.id,
        last_checked_at: new Date().toISOString(),
        needs_update: false
      });

      // Deduct Credits
      const costPerScan = 7;
      creditsUsed += costPerScan;
      await supabase.rpc('decrement_credits', { user_id_param: userId, amount: costPerScan });

      yield {
        id: newBusiness.id,
        name: newBusiness.business_name,
        category: newBusiness.category,
        city: newBusiness.city,
        phone: newBusiness.phone,
        website: newBusiness.website,
        rating: newBusiness.rating,
        review_count: newBusiness.review_count,
        ai_score: aiScore.ai_score,
        opportunity_reason: aiScore.opportunity_reason,
        cached: false
      };
    }
  }
}
