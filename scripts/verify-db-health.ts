import { createClient } from "@supabase/supabase-js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log("🔍 Running Comprehensive Database Diagnostics...");

  // 1. Fetch total counts using pagination
  let allBusinesses: any[] = [];
  let allAnalysis: any[] = [];
  const limit = 10000;
  const MAX_PER_REQUEST = 1000;

  // Fetch Businesses
  for (let offset = 0; offset < limit; offset += MAX_PER_REQUEST) {
    const { data } = await supabase
      .from("businesses")
      .select("id, business_name, city, created_at")
      .range(offset, offset + MAX_PER_REQUEST - 1);
    if (data && data.length > 0) allBusinesses.push(...data);
    else break;
  }

  // Fetch Analysis
  for (let offset = 0; offset < limit; offset += MAX_PER_REQUEST) {
    const { data } = await supabase
      .from("business_analysis")
      .select("business_id, ai_score, urgency_score, sales_readiness, buy_intent")
      .range(offset, offset + MAX_PER_REQUEST - 1);
    if (data && data.length > 0) allAnalysis.push(...data);
    else break;
  }

  console.log(`\n📊 Total businesses: ${allBusinesses.length}`);
  console.log(`📊 Total analysis rows: ${allAnalysis.length}`);

  // 2. Count pending vs enriched
  const enrichedCount = allAnalysis.filter(a => a.ai_score !== null).length;
  const pendingCount = allAnalysis.filter(a => a.ai_score === null).length;
  const missingCount = allBusinesses.length - allAnalysis.length;

  console.log(`✅ Fully Enriched (with AI Scores): ${enrichedCount}`);
  console.log(`⏳ Pending Enrichment (in Queue): ${pendingCount}`);
  console.log(`⚠️ Missing Analysis Records: ${missingCount}`);

  // 3. Check for duplicates
  const seenCombos = new Map<string, string[]>();
  let duplicateCombosCount = 0;

  for (const b of allBusinesses) {
    const key = `${b.business_name.trim().toLowerCase()}__${b.city.trim().toLowerCase()}`;
    if (seenCombos.has(key)) {
      seenCombos.get(key)!.push(b.id);
      duplicateCombosCount++;
    } else {
      seenCombos.set(key, [b.id]);
    }
  }

  console.log(`🧹 Duplicate combinations (same name and city): ${duplicateCombosCount}`);

  // 4. Check for city normalization discrepancies
  const allowedCities = new Set(["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Kocaeli", "Adana", "Konya", "Gaziantep", "Mersin"]);
  const abnormalCities = new Map<string, number>();

  for (const b of allBusinesses) {
    if (!allowedCities.has(b.city)) {
      abnormalCities.set(b.city, (abnormalCities.get(b.city) || 0) + 1);
    }
  }

  console.log(`🏙️ Non-normalized city strings: ${abnormalCities.size}`);
  if (abnormalCities.size > 0) {
    console.log("Non-normalized details:");
    for (const [city, count] of abnormalCities) {
      console.log(`  - "${city}": ${count} records`);
    }
  } else {
    console.log("✅ All city names are perfectly normalized!");
  }

  console.log("\n🏁 Database Diagnostics Completed!");
}

verify();
