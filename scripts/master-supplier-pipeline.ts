import { createClient } from '@supabase/supabase-js';
import { searchPlaces, getPlaceDetails } from '../src/lib/services/google-maps';
import { scrapeBusinessWebsite } from '../src/lib/services/native-scraper';
import { enrichCompanyData } from '../src/lib/services/apollo';
import { analyzeWebsite } from '../src/lib/services/analysis';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

// Standardized TR Phone validator
function isValidTurkishPhone(phone: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[^\d+]/g, '');
  if (/^(0|1|2|3|4|5|6|7|8|9)\1+$/.test(digits)) return false;
  if (digits.length < 7) return false;
  if (digits.includes('123456')) return false;
  return /^(?:\+90|90|0)?(?:[2-9]\d{2})\d{7}$/.test(digits);
}

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 10) return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+90 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  if (digits.length === 12 && digits.startsWith('90')) return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  return phone.trim();
}

async function generateMasterAIInsights(businessName: string, category: string, rating: number, webAnalysis: any, hasEmail: boolean) {
  if (!OPENROUTER_API_KEY) {
    const mockReason = JSON.stringify({
      summary: ["Dijital altyapı eksik"],
      services: ["Kapsamlı SEO Hizmeti", "Kurumsal Web Tasarım", "Sosyal Medya Yönetimi"],
      tags: ["HIGH POTENTIAL"]
    });
    return {
      ai_score: 85,
      opportunity_reason: mockReason,
      urgency_score: 75,
      sales_readiness: 70,
      buy_intent: "High",
      why_now_signals: ["Sektörel rekabet artıyor", "Müşteri temas noktaları zayıf"],
      growth_potential: "High"
    };
  }

  const prompt = `
    Sen SnapLead platformunun tedarikçiler ve B2B firmalar için satış zekası üreten elit yapay zekasısın.
    İşletme Adı: ${businessName}
    Kategori: ${category}
    Google Puanı: ${rating}
    Mobil Uyumlu: ${webAnalysis.mobile_responsive}
    E-posta Var Mı: ${hasEmail ? 'Evet' : 'Hayır'}
    
    Lütfen AŞAĞIDAKİ JSON FORMATINDA cevap ver (Markdown olmadan, doğrudan JSON formatında):
    {
      "ai_score": [0-100 arası genel satış puanı],
      "urgency_score": [0-100 arası aciliyet],
      "sales_readiness": [0-100 arası],
      "buy_intent": "High" | "Medium" | "Low",
      "why_now_signals": [
        "Neden şu an satınalma potansiyeli yüksek? 1-2 madde"
      ],
      "opportunity_summary": [
        "Tedarikçiler için fırsat analizi (1-2 madde)"
      ],
      "suggested_services": [
        "Bu işletmeye satılabilecek 3 net B2B hizmet/ürün"
      ],
      "ai_tags": [
        "Kısa etiket (Örn: POTENTIAL BUYER)"
      ],
      "growth_potential": "High" | "Medium" | "Low"
    }
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        models: ["openai/gpt-4o-mini", "google/gemini-2.5-flash"], route: "fallback",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(content);
    
    // PACK INTO THE EXACT EXISTING STRUCTURE EXPECTED BY THE EXCEL EXPORTER
    const structuredReason = JSON.stringify({
      summary: parsed.opportunity_summary || ["Genel Fırsat Analizi"],
      services: parsed.suggested_services || ["Premium Paketleme", "Dijital Destek"],
      tags: parsed.ai_tags || ["POTENTIAL"]
    });

    return {
      ai_score: typeof parsed.ai_score === 'number' ? parsed.ai_score : 70,
      opportunity_reason: structuredReason,
      urgency_score: typeof parsed.urgency_score === 'number' ? parsed.urgency_score : 50,
      sales_readiness: typeof parsed.sales_readiness === 'number' ? parsed.sales_readiness : 50,
      buy_intent: parsed.buy_intent || "Medium",
      why_now_signals: parsed.why_now_signals || [],
      growth_potential: parsed.growth_potential || "Medium"
    };
  } catch (e) {
    const mockReason = JSON.stringify({ summary: ["Sistem hatası koruması"], services: ["Genel Hizmetler"], tags: ["ERROR RECOVERY"] });
    return {
      ai_score: 70, opportunity_reason: mockReason, urgency_score: 50, sales_readiness: 50, buy_intent: "Medium", why_now_signals: [], growth_potential: "Medium"
    };
  }
}

async function runMasterPipeline() {
  console.log('🚀 --- MASTER SUPPLIER INTELLIGENCE PIPELINE STARTED ---');
  
  // Phase 4: Pet Shoplar (Yüksek Hacimli Hedef)
  const targetCategories = ["Pet Shop", "Evcil Hayvan Mağazası"];
  
  // 2000 hedefine ulaşmak için sadece iller değil, büyük ilçeler de eklendi
  const targetCities = [
    // Büyük Şehirler
    "Istanbul", "Ankara", "Izmir", "Antalya", "Bursa", "Adana", "Gaziantep", "Konya", "Kayseri", "Mersin", 
    "Eskişehir", "Diyarbakır", "Samsun", "Denizli", "Şanlıurfa", "Adapazarı", "Malatya", "Kahramanmaraş", "Erzurum", "Van",
    // İstanbul İlçeleri
    "Kadıköy", "Beşiktaş", "Şişli", "Üsküdar", "Maltepe", "Bakırköy", "Beylikdüzü", "Pendik", "Ümraniye", "Ataşehir",
    // Ankara İlçeleri
    "Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Etimesgut",
    // İzmir İlçeleri
    "Karşıyaka", "Bornova", "Buca", "Konak", "Göztepe"
  ];
  
  const searchPairs = [];
  for (const cat of targetCategories) {
    for (const city of targetCities) {
      searchPairs.push({ city, category: cat });
    }
  }
  
  searchPairs.sort(() => Math.random() - 0.5);
  
  let totalSaved = 0;
  let totalSkipped = 0;
  
  for (const pair of searchPairs) {
    console.log(`\n\n📌 TARGET: ${pair.city} - ${pair.category}`);
    try {
      const query = `${pair.city} ${pair.category}`;
      const places = await searchPlaces(query, 60); 
      console.log(`📋 Found ${places.length} raw results. Filtering...`);
      
      for (const place of places) {
        // 1. Deduplicate by Name
        const { data: existingByName } = await sb.from('businesses').select('id').eq('business_name', place.name).eq('city', pair.city).maybeSingle();
        if (existingByName) { console.log(`   ⏭️ Duplicate Name: ${place.name}`); continue; }

        const details = await getPlaceDetails(place.place_id);
        if (!details) continue;

        let foundPhone = details.formatted_phone_number || null;
        let foundWebsite = details.website || null;
        let foundEmail = null;

        let nativeData = null;
        let webAnalysis = { status: "no_website", has_ssl: false, mobile_responsive: false, has_social_links: false };
        
        // 2. Web Scraping
        if (foundWebsite && foundWebsite !== "Yok") {
          try {
            console.log(`   🌐 Scanning: ${foundWebsite}`);
            nativeData = await scrapeBusinessWebsite(foundWebsite);
            webAnalysis = await analyzeWebsite(foundWebsite);
            if (!foundPhone && nativeData.phones?.length > 0) foundPhone = nativeData.phones[0];
            if (nativeData.emails?.length > 0) foundEmail = nativeData.emails[0];
          } catch (e) { }
        }

        // 3. Apollo Enrichment
        const rating = place.rating || 0;
        if (foundWebsite && !foundEmail && rating >= 4.0) {
          try {
            console.log(`   📞 Apollo Triggered...`);
            const apollo = await enrichCompanyData(foundWebsite, place.name);
            if (apollo.phone && !foundPhone) foundPhone = apollo.phone;
            if (apollo.primary_email && !foundEmail) foundEmail = apollo.primary_email;
          } catch (e) {}
        }

        // 4. CRITICAL: PHONE MANDATORY
        if (!isValidTurkishPhone(foundPhone)) {
          totalSkipped++;
          console.log(`   ❌ SKIP: ${place.name} - No Valid Phone`);
          continue;
        }

        const cleanPhone = formatPhoneNumber(foundPhone!);

        // 5. Deduplicate by Phone
        const { data: existingByPhone } = await sb.from('businesses').select('id').eq('phone', cleanPhone).maybeSingle();
        if (existingByPhone) { console.log(`   ⏭️ Duplicate Phone: ${cleanPhone}`); continue; }

        // 6. AI Insights (Perfect Match to Excel Structure)
        console.log(`   🤖 Generating AI Insights...`);
        const ai = await generateMasterAIInsights(place.name, pair.category, rating, webAnalysis, !!foundEmail);

        let trustScore = 40;
        if (rating >= 4.5 && (place.user_ratings_total || 0) > 100) trustScore += 30;
        else if (rating >= 4.0) trustScore += 15;
        if (nativeData?.trust_signals?.has_contact_page) trustScore += 10;
        if (foundEmail) trustScore += 20;
        trustScore = Math.min(100, trustScore);

        // 7. Insert DB - Exact standard columns
        const { data: newBiz, error: insertError } = await sb.from('businesses').insert({
          business_name: place.name,
          category: pair.category,
          city: pair.city,
          phone: cleanPhone,
          email: foundEmail,
          website: foundWebsite || "Yok",
          maps_url: details.url,
          instagram: nativeData?.socials?.instagram || null,
          facebook: nativeData?.socials?.facebook || null,
          linkedin: nativeData?.socials?.linkedin || null,
          twitter: nativeData?.socials?.twitter || null,
          rating: rating,
          review_count: place.user_ratings_total,
          trust_score: trustScore,
          data_freshness: 100,
          is_dead: nativeData ? !nativeData.is_alive : false
        }).select().single();

        if (insertError) {
          console.error(`   ❌ DB Error:`, insertError.message);
          continue;
        }

        await sb.from('business_analysis').insert({
          business_id: newBiz.id,
          ai_score: ai.ai_score,
          opportunity_reason: ai.opportunity_reason,
          urgency_score: ai.urgency_score,
          sales_readiness: ai.sales_readiness,
          buy_intent: ai.buy_intent,
          why_now_signals: ai.why_now_signals,
          growth_potential: ai.growth_potential,
          seo_score: webAnalysis.has_ssl ? 80 : 30,
          mobile_score: webAnalysis.mobile_responsive ? 95 : 20,
          social_score: webAnalysis.has_social_links ? 50 : 10
        });

        totalSaved++;
        console.log(`   ✅ SUCCESS [${totalSaved}]: Saved Premium Lead -> ${place.name} | Phone: ${cleanPhone}`);
        
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (e: any) {
      console.error(`   ❌ Loop error:`, e.message);
    }
  }
  
  console.log('\n🏁 --- PIPELINE COMPLETE ---');
  console.log(`📊 Premium Leads Saved: ${totalSaved}`);
  console.log(`❌ Skipped (No Phone): ${totalSkipped}`);
}

runMasterPipeline().catch(console.error);
