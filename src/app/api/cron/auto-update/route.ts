import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { getPlaceDetails } from "@/lib/services/google-maps";
import { enrichCompanyData } from "@/lib/services/apollo";
import { analyzeWebsite } from "@/lib/services/analysis";
import { generateAIScore } from "@/lib/services/ai-scorer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  // Security check: ensure the request is authorized.
  // E.g. Check for a specific API Key passed in the header
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Find cache entries older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: staleCaches, error } = await supabase
      .from("cache_system")
      .select("business_id")
      .lt("last_checked_at", sevenDaysAgo.toISOString())
      .limit(50); // limit batch size

    if (error || !staleCaches) {
      throw error || new Error("No stale cache found");
    }

    if (staleCaches.length === 0) {
      return NextResponse.json({ message: "No stale records found" });
    }

    let updatedCount = 0;

    // 2. Refresh each business
    for (const cache of staleCaches) {
      const { data: business } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", cache.business_id)
        .single();

      if (!business || !business.maps_url) continue;

      // Extract Place ID from maps URL or re-search if needed...
      // For simplicity in MVP, we just do a quick re-analysis of website/socials
      
      const webAnalysis = await analyzeWebsite(business.website);
      
      // We assume basic info hasn't changed dramatically to save GMaps API cost, 
      // or we could do a full refresh if we stored PlaceID. Let's do a full AI rescore:
      
      const aiScore = await generateAIScore(
        { name: business.business_name, category: business.category, rating: business.rating || 0, review_count: business.review_count || 0 },
        webAnalysis,
        { linkedin_url: business.linkedin || undefined, primary_email: business.email || undefined }
      );

      // Data Cleaning & Verification
      const calculatedSeoScore = webAnalysis.has_ssl ? 80 : 30;
      const calculatedMobileScore = webAnalysis.mobile_responsive ? 95 : 20;
      const calculatedSocialScore = webAnalysis.has_social_links ? 85 : 10;
      
      const ratingVal = business.rating || 0;
      const reviewVal = business.review_count || 0;
      let calculatedTrustScore = 30;
      if (ratingVal > 4.5 && reviewVal > 100) calculatedTrustScore = 95;
      else if (ratingVal > 4.0 && reviewVal > 50) calculatedTrustScore = 75;
      else if (ratingVal > 3.5 && reviewVal > 10) calculatedTrustScore = 50;

      // Update Analysis
      await supabase.from("business_analysis").upsert({
        business_id: business.id,
        ai_score: aiScore.ai_score,
        seo_score: calculatedSeoScore,
        mobile_score: calculatedMobileScore,
        social_score: calculatedSocialScore,
        opportunity_reason: aiScore.opportunity_reason,
        website_status: webAnalysis.status === "error" ? "broken" : webAnalysis.status,
        growth_potential: aiScore.growth_potential,
        updated_at: new Date().toISOString()
      });

      // Update cache
      await supabase.from("cache_system").upsert({
        business_id: business.id,
        last_checked_at: new Date().toISOString(),
        needs_update: false
      });

      updatedCount++;
    }

    return NextResponse.json({ message: `Successfully updated ${updatedCount} businesses` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
