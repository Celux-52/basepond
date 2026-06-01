import { loadEnvConfig } from "@next/env";
// Load Next.js environment variables from .env.local
loadEnvConfig(process.cwd());

import { searchPlaces, getPlaceDetails } from "../src/lib/services/google-maps";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { searchApolloByName } from "../src/lib/services/apollo";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../src/types/supabase";

const TARGET_RECORDS = 10000;

// Initialize Supabase Client directly (Server Context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; 
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Define the comprehensive dataset matrix requested by the user
const CITIES = {
  Istanbul: {
    districts: [
      "Kadıköy", "Şişli", "Beşiktaş", "Üsküdar", "Maltepe", "Ataşehir", "Bakırköy",
      "Beyoğlu", "Fatih", "Sarıyer", "Zeytinburnu", "Ümraniye", "Pendik", "Kartal", "Beylikdüzü"
    ],
    sectors: ["Diş Klinikleri", "Güzellik Merkezleri", "Kuaförler", "Estetik Klinikleri", "Emlak Ofisleri", "Spor Salonları", "Avukatlık Büroları", "Restoranlar"]
  },
  Ankara: {
    districts: ["Çankaya", "Yenimahalle", "Keçiören", "Mamak", "Etimesgut", "Sincan", "Gölbaşı", "Altındağ"],
    sectors: ["Diş Klinikleri", "Güzellik Merkezleri", "Kuaförler", "Estetik Klinikleri", "Emlak Ofisleri", "Spor Salonları", "Avukatlık Büroları"]
  },
  Izmir: {
    districts: ["Konak", "Karşıyaka", "Bornova", "Buca", "Çiğli", "Karabağlar", "Balçova", "Gaziemir", "Bayraklı"],
    sectors: ["Diş Klinikleri", "Güzellik Merkezleri", "Kuaförler", "Estetik Klinikleri", "Restoranlar"]
  },
  Bursa: {
    districts: ["Nilüfer", "Osmangazi", "Yıldırım"],
    sectors: ["Diş Klinikleri", "Güzellik Salonları", "Kuaförler", "Spor Salonları"]
  },
  Antalya: {
    districts: ["Muratpaşa", "Konyaaltı", "Kepez", "Alanya", "Manavgat"],
    sectors: ["Estetik Klinikleri", "Diş Klinikleri", "Güzellik Merkezleri", "Restoranlar"]
  },
  Kocaeli: {
    districts: ["İzmit", "Gebze", "Gölcük", "Körfez", "Darıca"],
    sectors: ["Emlak Ofisleri", "Spor Salonları", "Kuaförler"]
  },
  Adana: {
    districts: ["Çukurova", "Seyhan", "Yüreğir"],
    sectors: ["Güzellik Salonları", "Diş Klinikleri", "Restoranlar"]
  },
  Konya: {
    districts: ["Selçuklu", "Meram", "Karatay"],
    sectors: ["Diş Klinikleri", "Avukatlık Büroları", "Emlak Ofisleri"]
  },
  Gaziantep: {
    districts: ["Şahinbey", "Şehitkamil"],
    sectors: ["Restoranlar", "Diş Klinikleri", "Güzellik Merkezleri"]
  },
  Mersin: {
    districts: ["Yenişehir", "Mezitli", "Akdeniz", "Tarsus"],
    sectors: ["Güzellik Salonları", "Kuaförler", "Restoranlar"]
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getTotalCount(): Promise<number> {
  const { count, error } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true });
  
  if (error) {
    console.error("Error fetching count:", error);
    return 0;
  }
  return count || 0;
}

// Ensure robust URL parser
function ensureHttps(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

// Generate the queue
const queue: { city: string, district: string, sector: string }[] = [];
for (const [city, data] of Object.entries(CITIES)) {
  for (const sector of data.sectors) {
    for (const district of data.districts) {
      queue.push({ city, district, sector });
    }
  }
}

async function run() {
  console.log(`🚀 Starting Super Fast (Engine 1) Dataset Generator`);
  console.log(`📋 Total Combinations in Queue: ${queue.length}`);
  
  let currentCount = await getTotalCount();
  console.log(`📊 Current DB Count: ${currentCount} / ${TARGET_RECORDS}`);

  if (currentCount >= TARGET_RECORDS) {
    console.log(`✅ Target already reached. Exiting.`);
    process.exit(0);
  }

  // Shuffle queue to diversify cities and sectors during ingestion
  const shuffledQueue = [...queue].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffledQueue.length; i++) {
    const { city, district, sector } = shuffledQueue[i];
    const query = `${district} ${sector} ${city}`;
    console.log(`\n======================================================`);
    console.log(`🔍 [${i+1}/${shuffledQueue.length}] Crawling: "${query}"`);
    console.log(`======================================================`);

    try {
      // 1. Fetch from Google Maps API
      const places = await searchPlaces(query, 60);
      console.log(`📍 Found ${places.length} places for query.`);

      for (const place of places) {
        if (currentCount >= TARGET_RECORDS) {
          console.log(`\n🎉 TARGET REACHED: ${currentCount} records! Stopping fast generator.`);
          process.exit(0);
        }

        try {
          // Check if it already exists to save API calls
          const { data: existing } = await supabase
            .from("businesses")
            .select("id")
            .eq("business_name", place.name)
            .eq("city", city)
            .maybeSingle();

          if (existing) {
            console.log(`⏭️  Skipping existing business: ${place.name}`);
            continue;
          }

          // 2. Fetch Place Details (Phone, Website)
          const details = await getPlaceDetails(place.place_id);
          
          let phone = details?.formatted_phone_number || null;
          let rawWebsite = details?.website || null;
          let apolloData: any = null;
          
          // 3. Fallback to Apollo if no phone or website
          if (!phone || !rawWebsite) {
            apolloData = await searchApolloByName(place.name, city);
            if (!phone && apolloData.phone) phone = apolloData.phone;
            if (!rawWebsite && apolloData.website_url) rawWebsite = apolloData.website_url;
          }

          const website = ensureHttps(rawWebsite);

          // Fast Trust Algorithm based only on rating & reviews
          const ratingVal = details?.rating || 0;
          const reviewVal = details?.user_ratings_total || 0;
          let trustScore = 30;
          if (ratingVal > 4.5 && reviewVal > 100) trustScore += 40;
          else if (ratingVal > 4.0 && reviewVal > 50) trustScore += 20;
          else if (ratingVal > 3.5 && reviewVal > 10) trustScore += 10;
          trustScore = Math.min(100, trustScore);

          // 4. Construct payload and Insert
          const payload = {
            business_name: place.name,
            category: sector,
            city: city,
            country: "Turkey",
            phone: phone,
            email: null,
            website: website,
            instagram: null,
            linkedin: null,
            facebook: null,
            twitter: null,
            maps_url: details?.url || `https://maps.google.com/?cid=${place.place_id}`,
            rating: details?.rating || null,
            review_count: details?.user_ratings_total || 0,
            trust_score: trustScore,
            is_dead: false,
            data_freshness: 100
          };

          const { data: insertedData, error } = await supabase
            .from("businesses")
            .upsert(payload, { onConflict: "business_name,city" })
            .select("id")
            .single();

          if (error) {
            console.error(`❌ Error inserting ${place.name}:`, error.message);
          } else {
            console.log(`✅ Saved: ${place.name} (Phone: ${phone ? "Yes" : "No"}, Web: ${website ? "Yes" : "No"})`);
            currentCount++;
            
            // Create a blank analysis record for Engine 2 to pick up and enrich
            if (insertedData) {
              const { error: analysisError } = await supabase.from("business_analysis").upsert({
                business_id: insertedData.id,
                ai_score: null,             // Background process will fill this
                seo_score: null,
                mobile_score: null,
                social_score: null,
                opportunity_reason: null,
                website_status: website ? "unknown" : "no_website",
                growth_potential: null,
                urgency_score: null,        // Background process will fill this
                sales_readiness: null,      // Background process will fill this
                buy_intent: null,
                why_now_signals: null
              }, { onConflict: "business_id" });

              if (analysisError) {
                console.error(`❌ Error creating analysis placeholder for ${place.name}:`, analysisError.message);
              }
            }
          }

        } catch (err: any) {
          console.error(`⚠️ Error processing place ${place.name}:`, err.message);
        }
      }
    } catch (err: any) {
      console.error(`🚨 Fatal error in combination ${query}:`, err.message);
    }
    
    // Minimal cool down to prevent hitting maps API rates too aggressively
    await delay(1000);
  }

  console.log(`\n🏁 Fast Generator finished all queues. Total Records: ${currentCount}`);
}

run();
