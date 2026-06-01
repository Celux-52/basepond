import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeBusinessWebsite } from "@/lib/services/native-scraper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();

  // Basic security: ensure user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch businesses that have 'found' as their social media status
    // Or we can just fetch those where website is not null, but let's be specific to save time
    const { data: businesses, error } = await supabase
      .from("businesses")
      .select("id, business_name, website, instagram, facebook, twitter, linkedin")
      .or('instagram.eq.found,facebook.eq.found,twitter.eq.found,linkedin.eq.found');

    if (error) throw error;

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: "No businesses found requiring fixes." });
    }

    const fixedBusinesses = [];

    // 2. Loop through and process them
    for (const business of businesses) {
      if (!business.website) continue; // Skip if no website

      // Re-scrape the website to get the actual links
      const nativeData = await scrapeBusinessWebsite(business.website);

      if (nativeData.is_alive) {
        // Update the payload only with the actual URLs found
        const updatePayload: any = {};
        
        if (business.instagram === "found" && nativeData.socials.instagram) {
          updatePayload.instagram = nativeData.socials.instagram;
        }
        if (business.facebook === "found" && nativeData.socials.facebook) {
          updatePayload.facebook = nativeData.socials.facebook;
        }
        if (business.twitter === "found" && nativeData.socials.twitter) {
          updatePayload.twitter = nativeData.socials.twitter;
        }
        if (business.linkedin === "found" && nativeData.socials.linkedin) {
          updatePayload.linkedin = nativeData.socials.linkedin;
        }

        // Only perform update if we actually found real links
        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from("businesses")
            .update(updatePayload)
            .eq("id", business.id);

          fixedBusinesses.push({ id: business.id, name: business.business_name, updates: updatePayload });
        }
      }
    }

    return NextResponse.json({
      message: "Data fixing completed successfully",
      total_scanned: businesses.length,
      total_fixed: fixedBusinesses.length,
      details: fixedBusinesses
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
