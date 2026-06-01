import { createClient } from "@supabase/supabase-js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

function turkishNormalizeCity(city: string | null): string {
  if (!city) return "Istanbul";
  
  // Custom Turkish-aware character normalization
  let normalized = city.trim();
  normalized = normalized
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .toLowerCase();

  // Handle common variations and typos
  if (normalized.includes("istanbul") || normalized.includes("ıstanbul") || normalized.includes("istnabul")) {
    return "Istanbul";
  }
  if (normalized.includes("ankara")) {
    return "Ankara";
  }
  if (normalized.includes("izmir") || normalized.includes("ızmir")) {
    return "Izmir";
  }
  if (normalized.includes("bursa")) {
    return "Bursa";
  }
  if (normalized.includes("antalya")) {
    return "Antalya";
  }
  if (normalized.includes("kocaeli")) {
    return "Kocaeli";
  }
  if (normalized.includes("adana")) {
    return "Adana";
  }
  if (normalized.includes("konya")) {
    return "Konya";
  }
  if (normalized.includes("gaziantep")) {
    return "Gaziantep";
  }
  if (normalized.includes("mersin")) {
    return "Mersin";
  }
  
  // Default capitalizing first letter for other cities (e.g. Trabzon)
  return city.trim().charAt(0).toUpperCase() + city.trim().slice(1);
}

async function run() {
  console.log("🧹 Starting DB Normalization, Repair & Deduplication Loop...");

  // 1. Fetch all businesses and their analysis using pagination
  const businesses: any[] = [];
  const limit = 10000;
  const MAX_PER_REQUEST = 1000;
  
  for (let offset = 0; offset < limit; offset += MAX_PER_REQUEST) {
    const batchSize = Math.min(MAX_PER_REQUEST, limit - offset);
    const { data, error } = await supabase
      .from("businesses")
      .select("*, business_analysis(*)")
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error("Error fetching businesses:", error.message);
      return;
    }
    
    if (data && data.length > 0) {
      businesses.push(...data);
    }
    
    if (!data || data.length < batchSize) {
      break;
    }
  }

  console.log(`Loaded ${businesses.length} businesses from database.`);

  const seen = new Map<string, any>(); // key -> business record to keep
  const toDeleteIds: string[] = [];
  const toUpdateRecords: any[] = [];
  const missingAnalysisRecords: any[] = [];

  for (const biz of businesses) {
    const normCity = turkishNormalizeCity(biz.city);
    const key = `${biz.business_name.trim().toLowerCase()}__${normCity.toLowerCase()}`;

    // Update city if it was not normalized
    const needsCityUpdate = biz.city !== normCity;

    if (seen.has(key)) {
      const existing = seen.get(key);
      
      // Keep the one that has business_analysis!
      const existingHasAnalysis = !!existing.business_analysis;
      const currentHasAnalysis = !!biz.business_analysis;

      if (currentHasAnalysis && !existingHasAnalysis) {
        // Keep current, delete existing
        toDeleteIds.push(existing.id);
        seen.set(key, biz);
        
        if (needsCityUpdate) {
          toUpdateRecords.push({ id: biz.id, city: normCity });
        }
      } else {
        // Keep existing, delete current
        toDeleteIds.push(biz.id);
      }
    } else {
      seen.set(key, biz);
      if (needsCityUpdate) {
        toUpdateRecords.push({ id: biz.id, city: normCity });
      }
      
      // If it doesn't have a business_analysis row, queue it for creation!
      if (!biz.business_analysis) {
        missingAnalysisRecords.push(biz);
      }
    }
  }

  console.log(`\nFound ${toDeleteIds.length} duplicate records to delete.`);
  console.log(`Found ${toUpdateRecords.length} records needing city normalization.`);
  console.log(`Found ${missingAnalysisRecords.length} records missing business_analysis rows.`);

  // 2. Perform updates in chunks of 50
  if (toUpdateRecords.length > 0) {
    console.log("Updating normalized cities...");
    let updated = 0;
    const chunkSize = 50;
    for (let i = 0; i < toUpdateRecords.length; i += chunkSize) {
      const chunk = toUpdateRecords.slice(i, i + chunkSize);
      const promises = chunk.map(r => 
        supabase
          .from("businesses")
          .update({ city: r.city })
          .eq("id", r.id)
      );
      await Promise.all(promises);
      updated += chunk.length;
      console.log(`  Normalized ${updated}/${toUpdateRecords.length} cities...`);
    }
  }

  // 3. Perform deletes in chunks of 50
  if (toDeleteIds.length > 0) {
    console.log("Deleting duplicate records...");
    let deleted = 0;
    const chunkSize = 50;
    for (let i = 0; i < toDeleteIds.length; i += chunkSize) {
      const chunk = toDeleteIds.slice(i, i + chunkSize);
      const { error: delError } = await supabase
        .from("businesses")
        .delete()
        .in("id", chunk);

      if (delError) {
        console.error(`  ❌ Error deleting chunk:`, delError.message);
      } else {
        deleted += chunk.length;
        console.log(`  Deleted ${deleted}/${toDeleteIds.length} duplicates...`);
      }
    }
  }

  // 4. Create missing analysis placeholders in chunks of 50
  if (missingAnalysisRecords.length > 0) {
    console.log("Creating missing analysis placeholders...");
    let created = 0;
    const chunkSize = 50;
    for (let i = 0; i < missingAnalysisRecords.length; i += chunkSize) {
      const chunk = missingAnalysisRecords.slice(i, i + chunkSize);
      const promises = chunk.map(biz => 
        supabase
          .from("business_analysis")
          .upsert({
            business_id: biz.id,
            ai_score: null,
            seo_score: null,
            mobile_score: null,
            social_score: null,
            opportunity_reason: null,
            website_status: biz.website ? "unknown" : "no_website",
            growth_potential: null,
            urgency_score: null,
            sales_readiness: null,
            buy_intent: null,
            why_now_signals: null
          }, { onConflict: "business_id" })
      );
      await Promise.all(promises);
      created += chunk.length;
      console.log(`  Created ${created}/${missingAnalysisRecords.length} placeholders...`);
    }
  }

  console.log("\n🎉 DB Normalization, Deduplication and Repair Completed Successfully!");
}

run();
