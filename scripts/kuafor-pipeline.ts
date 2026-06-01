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

async function generateKuaforSupplierInsights(businessName: string, category: string, rating: number, webAnalysis: any, hasEmail: boolean) {
  if (!OPENROUTER_API_KEY) {
    return {
      ai_score: 85, 
      opportunity_reason: JSON.stringify({
        opportunity_analysis: "Kuaför/Kozmetik toptan alıcısı potansiyeli yüksek.",
        purchase_intent: "High",
        why_now: "Sürekli sarf malzeme ihtiyacı var.",
        recommended_services: ["Profesyonel Şampuan", "Boya Grubu", "Salon Ekipmanları"],
        source_used: ["Google Maps", "Web Scraper"],
        confidence_score: 85
      }),
      sales_readiness: 80,
      urgency_score: 75
    };
  }

  const prompt = `
    Sen SnapLead platformunda çalışan gelişmiş bir B2B Satış İstihbarat yapay zekasısın.
    Görevin: Kuaför ürünleri, kozmetik, salon ekipmanları ve profesyonel bakım ürünleri TOPTANCISI için müşterinin potansiyelini analiz etmek.
    
    İşletme Adı: ${businessName}
    Kategori: ${category}
    Google Puanı: ${rating}
    Mobil Uyumlu: ${webAnalysis.mobile_responsive}
    E-posta Var Mı: ${hasEmail ? 'Evet' : 'Hayır'}
    
    Lütfen AŞAĞIDAKİ JSON FORMATINDA cevap ver (Asla markdown kullanma):
    {
      "ai_score": [0-100 arası genel kalite/toptan alım potansiyeli],
      "opportunity_analysis": "Toptancı için fırsat analizi. İşletme profilini 1-2 cümleyle yorumla.",
      "sales_readiness": [0-100 arası satın alma hazır olma durumu],
      "purchase_intent": "High" | "Medium" | "Low",
      "why_now": "Neden şimdi ulaşılmalı? Hangi argümanla satışa gidilmeli? (1-2 madde)",
      "recommended_services": ["Satılabilecek 3 ürün. Örn: Profesyonel Şampuan, Saç Boyası, Lazer Cihazı"],
      "confidence_score": [0-100 arası AI güven skoru]
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
      opportunity_analysis: parsed.opportunity_analysis || "Potansiyel kuaför/güzellik salonu.",
      purchase_intent: parsed.purchase_intent || "Medium",
      why_now: parsed.why_now || "Sarf malzeme ihtiyacı.",
      recommended_services: parsed.recommended_services || ["Şampuan", "Saç Boyası"],
      source_used: ["Google Maps", "AI"],
      confidence_score: parsed.confidence_score || 80
    });

    return {
      ai_score: typeof parsed.ai_score === 'number' ? parsed.ai_score : 70,
      opportunity_reason: structuredReason,
      sales_readiness: typeof parsed.sales_readiness === 'number' ? parsed.sales_readiness : 60,
      urgency_score: 70
    };
  } catch (e) {
    return {
      ai_score: 70, 
      opportunity_reason: JSON.stringify({ opportunity_analysis: "Sistem kurtarma durumu.", confidence_score: 50 }),
      sales_readiness: 50, urgency_score: 50
    };
  }
}

async function runKuaforPipeline() {
  console.log('✂️ --- KUAFÖR & GÜZELLİK SALONU PIPELINE BAŞLADI ---');
  
  const targetCategories = [
    "Kuaför", "Bayan Kuaförü", "Erkek Kuaförü", "Berber", 
    "Güzellik Merkezi", "Beauty Salon", "Hair Salon", 
    "Saç Tasarım Merkezi", "Güzellik ve Bakım Merkezi", 
    "Estetik Merkezi", "Cilt Bakım Merkezi"
  ];
  
  // Distributed districts across 5 cities to prevent hitting only one city
  const cityDistricts = [
    { city: "Istanbul", districts: ["Kadıköy", "Beşiktaş", "Şişli", "Bakırköy", "Üsküdar", "Maltepe", "Sarıyer", "Beylikdüzü", "Pendik", "Kartal"] },
    { city: "Ankara", districts: ["Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Etimesgut", "Sincan", "Altındağ", "Pursaklar"] },
    { city: "Izmir", districts: ["Karşıyaka", "Bornova", "Buca", "Konak", "Bayraklı", "Çiğli", "Gaziemir", "Balçova"] },
    { city: "Bursa", districts: ["Osmangazi", "Nilüfer", "Yıldırım", "Mudanya", "Gürsu", "İnegöl"] },
    { city: "Antalya", districts: ["Muratpaşa", "Konyaaltı", "Kepez", "Alanya", "Manavgat"] }
  ];
  
  const searchPairs = [];
  for (const cat of targetCategories) {
    for (const locale of cityDistricts) {
      for (const district of locale.districts) {
        searchPairs.push({ city: locale.city, queryLoc: `${district}, ${locale.city}`, category: cat });
      }
    }
  }
  
  // Shuffle to ensure even distribution over time
  searchPairs.sort(() => Math.random() - 0.5);
  
  let totalSaved = 0;
  let totalSkipped = 0;
  
  for (const pair of searchPairs) {
    console.log(`\n\n📌 TARGET: ${pair.queryLoc} - ${pair.category}`);
    try {
      const query = `${pair.queryLoc} ${pair.category}`;
      const places = await searchPlaces(query, 60); 
      console.log(`📋 Bulundu: ${places.length} ham sonuç. Filtreleniyor...`);
      
      for (const place of places) {
        // EXACT DUPLICATE CHECK BY NAME & CITY
        const { data: existingByName } = await sb.from('businesses').select('id').eq('business_name', place.name).eq('city', pair.city).maybeSingle();
        if (existingByName) { console.log(`   ⏭️ Tekrar (İsim): ${place.name}`); continue; }

        const details = await getPlaceDetails(place.place_id);
        if (!details) continue;

        let foundPhone = details.formatted_phone_number || null;
        let foundWebsite = details.website || null;
        let foundEmail = null;

        // EXACT DUPLICATE CHECK BY WEBSITE/MAPS URL
        if (foundWebsite && foundWebsite !== "Yok") {
            const { data: exWeb } = await sb.from('businesses').select('id').eq('website', foundWebsite).maybeSingle();
            if (exWeb) { console.log(`   ⏭️ Tekrar (Web): ${foundWebsite}`); continue; }
        }
        if (details.url) {
            const { data: exMap } = await sb.from('businesses').select('id').eq('maps_url', details.url).maybeSingle();
            if (exMap) { console.log(`   ⏭️ Tekrar (Maps): ${place.name}`); continue; }
        }

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

        // CRITICAL RULE: NO PHONE = DROP
        if (!isValidTurkishPhone(foundPhone)) {
          totalSkipped++;
          console.log(`   ❌ ATLANDI (Telefonsuz/Geçersiz): ${place.name}`);
          continue;
        }

        const cleanPhone = formatPhoneNumber(foundPhone!);

        // Phone Deduplication
        const { data: existingByPhone } = await sb.from('businesses').select('id').eq('phone', cleanPhone).maybeSingle();
        if (existingByPhone) { console.log(`   ⏭️ Tekrar (Telefon): ${cleanPhone}`); continue; }

        console.log(`   🤖 Yapay Zeka Kuaför Analizi...`);
        const ai = await generateKuaforSupplierInsights(place.name, pair.category, rating, webAnalysis, !!foundEmail);

        let trustScore = 40;
        if (rating >= 4.5 && (place.user_ratings_total || 0) > 100) trustScore += 30;
        else if (rating >= 4.0) trustScore += 15;
        if (nativeData?.trust_signals?.has_contact_page) trustScore += 10;
        if (foundEmail) trustScore += 20;
        trustScore = Math.min(100, trustScore);

        const districtName = pair.queryLoc.split(',')[0].trim();

        // 1. Insert into businesses (KUAFOR_MASTER_POOL conceptual)
        const { data: newBiz, error: insertError } = await sb.from('businesses').insert({
          business_name: place.name,
          category: pair.category,
          city: `${pair.city} (${districtName})`,
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

        // 2. Insert into business_analysis
        await sb.from('business_analysis').insert({
          business_id: newBiz.id,
          ai_score: ai.ai_score,
          opportunity_reason: ai.opportunity_reason,
          urgency_score: ai.urgency_score,
          sales_readiness: ai.sales_readiness,
          seo_score: webAnalysis.has_ssl ? 80 : 30,
          mobile_score: webAnalysis.mobile_responsive ? 95 : 20,
          social_score: webAnalysis.has_social_links ? 50 : 10
        });

        totalSaved++;
        console.log(`   ✅ EKLENDİ [${totalSaved}]: ${place.name} | ${districtName} | Tel: ${cleanPhone}`);
        
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (e: any) {
      console.error(`   ❌ Döngü hatası:`, e.message);
    }
  }
  
  console.log('\\n🏁 --- KUAFÖR PIPELINE TAMAMLANDI ---');
  console.log(`📊 Toplam Eklenen: ${totalSaved}`);
  console.log(`❌ Elenen (Telefonsuz/Duplicate): ${totalSkipped}`);
}

runKuaforPipeline().catch(console.error);
