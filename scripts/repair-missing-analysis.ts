import { createClient } from "@supabase/supabase-js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function repair() {
  console.log("🛠️ Starting Database Repair: Finding businesses without analysis rows...");

  // 1. Fetch all businesses
  const { data: businesses, error: bizError } = await supabase
    .from("businesses")
    .select("id, business_name, website");

  if (bizError) {
    console.error("Error fetching businesses:", bizError.message);
    return;
  }

  // 2. Fetch all analysis rows
  const { data: analysisRows, error: analysisError } = await supabase
    .from("business_analysis")
    .select("business_id");

  if (analysisError) {
    console.error("Error fetching analysis rows:", analysisError.message);
    return;
  }

  const existingAnalysisIds = new Set(analysisRows.map(r => r.business_id));
  const missing = businesses.filter(b => !existingAnalysisIds.has(b.id));

  console.log(`📊 Total Businesses: ${businesses.length}`);
  console.log(`📊 Businesses with Analysis: ${existingAnalysisIds.size}`);
  console.log(`⚠️ Missing Analysis Rows: ${missing.length}`);

  if (missing.length === 0) {
    console.log("✅ No missing analysis records. Database is fully consistent!");
    return;
  }

  console.log("✨ Creating blank analysis placeholders for missing records...");
  let created = 0;

  for (const biz of missing) {
    const website = biz.website;
    const { error: insertErr } = await supabase
      .from("business_analysis")
      .upsert({
        business_id: biz.id,
        ai_score: null,
        seo_score: null,
        mobile_score: null,
        social_score: null,
        opportunity_reason: null,
        website_status: website ? "unknown" : "no_website",
        growth_potential: null,
        urgency_score: null,
        sales_readiness: null,
        buy_intent: null,
        why_now_signals: null
      }, { onConflict: "business_id" });

    if (insertErr) {
      console.error(`❌ Failed to create placeholder for ${biz.business_name}:`, insertErr.message);
    } else {
      created++;
      if (created % 50 === 0) {
        console.log(`  Processed ${created}/${missing.length}...`);
      }
    }
  }

  console.log(`\n🎉 Success! Created ${created} analysis placeholders!`);
}

repair();
