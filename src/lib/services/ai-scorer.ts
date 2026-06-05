import { GooglePlaceDetails } from "./google-maps";
import { ApolloEnrichmentData } from "./apollo";
import { WebsiteAnalysis } from "./analysis";

export interface AIScoreResult {
  ai_score: number;
  opportunity_reason: string;
  growth_potential: "High" | "Medium" | "Low";
  urgency_score: number;
  sales_readiness: number;
  buy_intent: "High" | "Medium" | "Low";
  why_now_signals: any;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

export async function generateAIScore(
  business: { name: string; category: string; rating?: number; review_count?: number },
  analysis: WebsiteAnalysis,
  enrichment: ApolloEnrichmentData
): Promise<AIScoreResult> {
  if (!OPENROUTER_API_KEY) {
    return systemBusyFallback();
  }

  const prompt = `
    Sen uzman bir B2B Müşteri Analiz (Lead Scoring) ve Dijital Dönüşüm Stratejistisin.
    Görevin, aşağıdaki işletme verilerini incelemek ve her bir işletmeyi belirli stratejik kategorilere göre analiz edip puanlamaktır.

    İşletme Bilgileri:
    İşletme Adı: ${business.name}
    Kategori: ${business.category}
    Google Puanı: ${business.rating || "Yok"} (${business.review_count || 0} yorum)
    Web Sitesi Durumu: ${analysis.status}
    Mobil Uyumluluk: ${analysis.mobile_responsive ? "Evet" : "Hayır"}
    Site Hızı: ${analysis.is_slow ? "Yavaş" : "Normal"}
    SSL Güvenliği: ${analysis.has_ssl ? "Var" : "Yok"}
    Sosyal Medya Linkleri Var Mı: ${analysis.has_social_links ? "Evet" : "Hayır"}
    E-posta Bulundu Mu: ${enrichment.primary_email ? "Evet" : "Hayır"}

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
    "google/gemini-2.5-flash:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openai/gpt-4o-mini"
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://Basepound.com", 
        "X-Title": "Basepound"
      },
      body: JSON.stringify({
        models: modelsToTry, // OpenRouter fallback routing
        route: "fallback",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("OpenRouter returned no content:", data);
      throw new Error("No content from AI");
    }

    // Temizleme: Eğer yapay zeka ```json ve ``` ile sarmaladıysa bunları sil
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(content);

    // Paketle ve stringify yap, böylece veritabanında TEXT formatında tek sütunda tutabiliriz.
    const structuredReason = JSON.stringify({
      summary: parsed.opportunity_summary || ["Dijital zayıflık tespit edildi"],
      services: parsed.suggested_services || ["Kapsamlı Dijital Analiz"],
      tags: parsed.ai_tags || ["POTENTIAL LEAD"]
    });

    return {
      ai_score: typeof parsed.ai_score === "number" ? parsed.ai_score : 50,
      opportunity_reason: structuredReason,
      growth_potential: parsed.growth_potential || "Orta",
      urgency_score: typeof parsed.urgency_score === "number" ? parsed.urgency_score : 50,
      sales_readiness: typeof parsed.sales_readiness === "number" ? parsed.sales_readiness : 50,
      buy_intent: parsed.buy_intent || "Medium",
      why_now_signals: parsed.why_now_signals || []
    };
  } catch (error) {
    console.error("AI Scorer Error:", error);
    return systemBusyFallback();
  }
}

function systemBusyFallback(): AIScoreResult {
  const structuredReason = JSON.stringify({
    summary: ["Şu an global AI ağlarında yoğunluk var"],
    services: ["Sistem Meşgul"],
    tags: ["SYSTEM_BUSY"]
  });

  return {
    ai_score: 50,
    opportunity_reason: structuredReason,
    growth_potential: "Low",
    urgency_score: 0,
    sales_readiness: 0,
    buy_intent: "Low",
    why_now_signals: ["İşleminiz sıraya alındı, krediniz iade edildi."]
  };
}
