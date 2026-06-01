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

async function generateJarSupplierInsights(businessName: string, category: string, rating: number, webAnalysis: any, hasEmail: boolean) {
  if (!OPENROUTER_API_KEY) {
    const mockReason = JSON.stringify({
      summary: ["Kavanoz/ambalaj tedariki için yüksek potansiyel"],
      services: ["Cam Kavanoz Tedariği", "Pet Kavanoz", "Özel Etiketli Ambalaj"],
      tags: ["POTENTIAL BUYER"]
    });
    return {
      ai_score: 85, opportunity_reason: mockReason, urgency_score: 80,
      sales_readiness: 75, buy_intent: "High",
      why_now_signals: ["Stok yenileme dönemi", "Gıda ambalaj ihtiyacı sürekli"],
      growth_potential: "High"
    };
  }

  const prompt = `
    Sen SnapLead platformunda çalışan uzman bir B2B Satış İstihbarat (Intelligence) yapay zekasısın.
    Görevin, "Kavanoz, Cam Ambalaj ve Gıda Ambalajı Toptancısı" için müşterinin potansiyelini analiz etmek.
    
    İşletme Adı: ${businessName}
    Kategori: ${category}
    Google Puanı: ${rating}
    Mobil Uyumlu: ${webAnalysis.mobile_responsive}
    E-posta Var Mı: ${hasEmail ? 'Evet' : 'Hayır'}
    
    Lütfen AŞAĞIDAKİ JSON FORMATINDA cevap ver (Asla markdown kullanma, doğrudan JSON formatında dönder):
    {
      "ai_score": [0-100 arası genel satış puanı],
      "urgency_score": [0-100 arası stok/ambalaj aciliyeti],
      "sales_readiness": [0-100 arası satın alma hazır olma durumu],
      "buy_intent": "High" | "Medium" | "Low",
      "why_now_signals": [
        "Bu firma neden KAVANOZ veya AMBALAJ siparişi verebilir? Neden şimdi ulaşılmalı? (1-2 madde)"
      ],
      "opportunity_summary": [
        "Toptancı için fırsat analizi (Kavanoz kullanım potansiyeli nedir? Örn: 'Bal üretimi sebebiyle yoğun cam kavanoz kullanımı' 1-2 cümle)"
      ],
      "suggested_services": [
        "Satılabilecek 3 ürün (Örn: Bal Kavanozu, Cam Şişe, Pet Gıda Ambalajı)"
      ],
      "ai_tags": [
        "Kısa etiket (Örn: JAR BUYER, HIGH VOLUME)"
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
    
    const structuredReason = JSON.stringify({
      summary: parsed.opportunity_summary || ["Kavanoz/Ambalaj kullanım ihtimali yüksek"],
      services: parsed.suggested_services || ["Cam Kavanoz", "Pet Kavanoz", "Gıda Ambalajı"],
      tags: parsed.ai_tags || ["POTENTIAL BUYER"]
    });

    return {
      ai_score: typeof parsed.ai_score === 'number' ? parsed.ai_score : 70,
      opportunity_reason: structuredReason,
      urgency_score: typeof parsed.urgency_score === 'number' ? parsed.urgency_score : 60,
      sales_readiness: typeof parsed.sales_readiness === 'number' ? parsed.sales_readiness : 60,
      buy_intent: parsed.buy_intent || "Medium",
      why_now_signals: parsed.why_now_signals || [],
      growth_potential: parsed.growth_potential || "High"
    };
  } catch (e) {
    const mockReason = JSON.stringify({ summary: ["Sistem hatası koruması"], services: ["Ambalaj Tedariği"], tags: ["ERROR RECOVERY"] });
    return {
      ai_score: 70, opportunity_reason: mockReason, urgency_score: 50, sales_readiness: 50, buy_intent: "Medium", why_now_signals: [], growth_potential: "Medium"
    };
  }
}

async function runJarPipeline() {
  console.log('🍯 --- KAVANOZ TOPTANCISI LEAD PIPELINE BAŞLADI ---');
  
  const targetCategories = [
    "Bal Üreticisi", "Reçel Üreticisi", "Marmelat Üreticisi", "Turşu Üreticisi", 
    "Zeytin Üreticisi", "Zeytinyağı Markası", "Baharat Üreticisi", "Aktar", 
    "Yöresel Ürünler", "Organik Ürünler", "Sos Üreticisi", "Acı Sos Üreticisi",
    "Ev Yapımı Gıda Üreticisi", "Gurme Gıda", "Kuruyemiş Paketleme", "Bitki Çayı",
    "Doğal Kozmetik Üreticisi", "Sabun Üreticisi", "Mum Üreticisi", "Hediyelik Ürün"
  ];
  
  const targetCities = [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya",
    // To reach 3000+, we include major districts of these cities
    "Kadıköy", "Beşiktaş", "Şişli", "Çankaya", "Keçiören", "Yenimahalle",
    "Karşıyaka", "Bornova", "Buca", "Nilüfer", "Osmangazi", "Muratpaşa", "Alanya"
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
    console.log(`\\n\\n📌 TARGET: ${pair.city} - ${pair.category}`);
    try {
      const query = `${pair.city} ${pair.category}`;
      const places = await searchPlaces(query, 60); 
      console.log(`📋 Bulundu: ${places.length} ham sonuç. Filtreleniyor...`);
      
      for (const place of places) {
        // Name Deduplication
        const { data: existingByName } = await sb.from('businesses').select('id').eq('business_name', place.name).eq('city', pair.city).maybeSingle();
        if (existingByName) { console.log(`   ⏭️ Tekrar (İsim): ${place.name}`); continue; }

        const details = await getPlaceDetails(place.place_id);
        if (!details) continue;

        let foundPhone = details.formatted_phone_number || null;
        let foundWebsite = details.website || null;
        let foundEmail = null;

        let nativeData = null;
        let webAnalysis = { status: "no_website", has_ssl: false, mobile_responsive: false, has_social_links: false };
        
        // Scraping
        if (foundWebsite && foundWebsite !== "Yok") {
          try {
            console.log(`   🌐 Taranıyor: ${foundWebsite}`);
            nativeData = await scrapeBusinessWebsite(foundWebsite);
            webAnalysis = await analyzeWebsite(foundWebsite);
            if (!foundPhone && nativeData.phones?.length > 0) foundPhone = nativeData.phones[0];
            if (nativeData.emails?.length > 0) foundEmail = nativeData.emails[0];
          } catch (e) { }
        }

        // Apollo
        const rating = place.rating || 0;
        if (foundWebsite && !foundEmail && rating >= 4.0) {
          try {
            const apollo = await enrichCompanyData(foundWebsite, place.name);
            if (apollo.phone && !foundPhone) foundPhone = apollo.phone;
            if (apollo.primary_email && !foundEmail) foundEmail = apollo.primary_email;
          } catch (e) {}
        }

        // CRITICAL RULE: NO PHONE = SKIP
        if (!isValidTurkishPhone(foundPhone)) {
          totalSkipped++;
          console.log(`   ❌ ATLANDI (Telefonsuz/Geçersiz): ${place.name}`);
          continue;
        }

        const cleanPhone = formatPhoneNumber(foundPhone!);

        // Phone Deduplication
        const { data: existingByPhone } = await sb.from('businesses').select('id').eq('phone', cleanPhone).maybeSingle();
        if (existingByPhone) { console.log(`   ⏭️ Tekrar (Telefon): ${cleanPhone}`); continue; }

        // AI Insights tailored for Jar Supplier
        console.log(`   🤖 Yapay Zeka Ambalaj Analizi...`);
        const ai = await generateJarSupplierInsights(place.name, pair.category, rating, webAnalysis, !!foundEmail);

        let trustScore = 40;
        if (rating >= 4.5 && (place.user_ratings_total || 0) > 100) trustScore += 30;
        else if (rating >= 4.0) trustScore += 15;
        if (nativeData?.trust_signals?.has_contact_page) trustScore += 10;
        if (foundEmail) trustScore += 20;
        trustScore = Math.min(100, trustScore);

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
          console.error(`   ❌ DB Hata:`, insertError.message);
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
        console.log(`   ✅ EKLENDİ [${totalSaved}]: ${place.name} | Ambalaj Alıcısı | Tel: ${cleanPhone}`);
        
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (e: any) {
      console.error(`   ❌ Döngü hatası:`, e.message);
    }
  }
  
  console.log('\\n🏁 --- KAVANOZ PIPELINE TAMAMLANDI ---');
  console.log(`📊 Toplam Eklenen: ${totalSaved}`);
  console.log(`❌ Elenen (Telefonsuz): ${totalSkipped}`);
}

runJarPipeline().catch(console.error);
