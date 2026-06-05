const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const WebSocket = require('ws');

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

try {
  if (fs.existsSync('.env.local')) {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^"|^'|"$|'$/g, '');
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = val;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') SUPABASE_SERVICE_ROLE_KEY = val;
        if (key === 'OPENROUTER_API_KEY') OPENROUTER_API_KEY = val;
      }
    });
  }
} catch (e) {
  // ignore
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});


const delay = ms => new Promise(res => setTimeout(res, ms));

async function generateAIScore(business) {
  const prompt = `
    Sen uzman bir B2B Müşteri Analiz (Lead Scoring) ve Dijital Dönüşüm Stratejistisin.
    Görevin, aşağıdaki işletme verilerini incelemek ve her bir işletmeyi belirli stratejik kategorilere göre analiz edip puanlamaktır.

    İşletme Bilgileri:
    İşletme Adı: ${business.business_name}
    Kategori: ${business.category || 'Bilinmiyor'}
    Google Puanı: ${business.rating || "Yok"} (${business.review_count || 0} yorum)
    Web Sitesi Durumu: ${business.website ? "Var" : "Yok"}
    E-posta Bulundu Mu: ${business.email ? "Evet" : "Hayır"}

    GÖREVLER VE KURALLAR:
    1. İşletme için aşağıdaki listeden GEÇERLİ OLAN tüm etiketleri (tagleri) belirle. (En az 2, en fazla 5 etiket seç):
       [Performans ve Pazarlama]: Reklam Bütçesi Boşa Gidenler, Yeniden Pazarlama (Retargeting) Eksikliği, Dönüşüm Oranı (CRO) Düşük Siteler, Hedef Kitlesi Yanlış Olanlar, E-posta Otomasyonu Olmayanlar, İçerik Stratejisi Zayıf Olanlar
       [Sistem ve Altyapı]: Yavaş Açılan Siteler, E-Ticaret Altyapısı Eskiler, Güvenlik Açığı Olanlar (Siber Riskli), Ödeme Altyapısı Sorunlular, Veri Takibi / Analytics Kurulmamışlar
       [Otomasyon ve Yapay Zeka]: Manuel Süreçleri Çok Olanlar, Chatbot/Asistan İhtiyacı Olanlar, CRM (Müşteri Yönetimi) Kullanmayanlar, Sistemleri Birbirine Bağlı Olmayanlar (Entegrasyon Eksikliği), Yapay Zeka Fırsatı
       [Marka ve İtibar]: Kurumsal Kimliği Zayıf / Eskimiş Olanlar, Sosyal Kanıtı (Social Proof) Olmayanlar, Müşteri Şikayeti Çok Olanlar, İşveren Markası Zayıf Olanlar (Personel Bulamayanlar), Rakip Gerisinde Kalanlar
       [Temel Dijital Varlık]: Web Sitesi Olmayanlar, Web Sitesi Çalışmayanlar, Mobil Uyumsuz Siteler, SSL Olmayan Siteler, SEO Sorunlu Siteler, Dijital Varlığı Zayıf, Google Puanı Düşük, Web Site Yenileme, Sosyal Medya Fırsatı, Google Ads Fırsatı, Yüksek Potansiyelliler, Hemen Aranabilecekler

    2. İşletmeye 0 ile 100 arasında bir "Satış Fırsatı Skoru" (ai_score) ver.
       KURAL: İşletmenin dijital durumu ne kadar KÖTÜYSE ve düzeltilmesi ne kadar KOLAYSA, satış fırsatı skoru o kadar YÜKSEK olmalıdır. (Örn: SSL yok, mobil uyumsuz, web sitesi kötü -> Skor: 90+)

    3. Çıktıyı SADECE aşağıdaki JSON formatında, sistemin okuyabileceği şekilde ver:
    {
      "ai_score": [0-100 arası yüksek fırsat puanı],
      "urgency_score": [0-100 arası aciliyet skoru, kötü durum=yüksek skor],
      "sales_readiness": [0-100 arası satışı kapatma ihtimali],
      "buy_intent": "High",
      "why_now_signals": [
        "İşletmenin NEDEN ŞİMDİ aranması gerektiğini gösteren 1-2 acil tetikleyici."
      ],
      "opportunity_summary": [
        "İşletmenin mevcut durumunun 2-3 cümlelik çok net tespiti (Analiz Özeti)."
      ],
      "suggested_services": [
        "Telefonda veya mailde ilk sunulması gereken hizmet / vurucu teklif (Satış Senaryosu)."
      ],
      "ai_tags": [
        "Yukarıdaki etiket havuzundan seçilmiş geçerli etiketler."
      ],
      "growth_potential": "Yüksek"
    }
  `;

  const modelsToTry = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-r1"
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://Basepound.com",
      "X-Title": "Basepound Re-Analyzer"
    },
    body: JSON.stringify({
      models: modelsToTry,
      route: "fallback",
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`OpenRouter HTTP error! status: ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  
  let cleanText = text;
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleanText = text.substring(firstBrace, lastBrace + 1);
  }
  
  cleanText = cleanText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText);
}

async function run() {
  console.log("Starting Re-Analysis Task...");
  
  // Get count
  const { count } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
  console.log(`Found ${count} businesses to process.`);
  
  let processed = 0;
  let offset = 0;
  const batchSize = 100;
  
  while (offset < count) {
    const { data: businesses, error } = await supabase.from('businesses').select('*').range(offset, offset + batchSize - 1);
    if (error) {
      console.error("Fetch error:", error);
      break;
    }
    
    if (businesses.length === 0) break;
    
    for (const biz of businesses) {
      try {
        console.log(`[${processed}/${count}] Analyzing: ${biz.business_name}`);
        const aiResult = await generateAIScore(biz);
        
        // Find existing analysis
        const { data: existingAnalysis } = await supabase.from('business_analysis').select('id').eq('business_id', biz.id).maybeSingle();
        
        const payload = {
          business_id: biz.id,
          ai_score: aiResult.ai_score || 0,
          opportunity_reason: JSON.stringify(aiResult.opportunity_summary),
          sales_readiness: aiResult.sales_readiness || 50,
          purchase_intent: aiResult.buy_intent,
          why_now: JSON.stringify(aiResult.why_now_signals),
          recommended_services: Array.isArray(aiResult.suggested_services) ? aiResult.suggested_services.join(', ') : null,
          signals: Array.isArray(aiResult.ai_tags) ? aiResult.ai_tags : []
        };
        
        console.log(`  └─> Skor: ${payload.ai_score} | Etiketler: ${payload.signals.join(', ')}`);
        
        // Also update businesses table signals
        await supabase.from('businesses').update({ signals: payload.signals }).eq('id', biz.id);

        if (existingAnalysis) {
          await supabase.from('business_analysis').update(payload).eq('id', existingAnalysis.id);
        } else {
          await supabase.from('business_analysis').insert(payload);
        }
        
      } catch (err) {
        console.error(`Failed to analyze ${biz.business_name}:`, err.message);
      }
      
      // Delay 3 seconds to avoid rate limits on free models
      await delay(3000);
      processed++;
    }
    offset += batchSize;
  }
  
  console.log("Re-Analysis Complete!");
}

run();
