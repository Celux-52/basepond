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
    return mockAIScore();
  }

  const prompt = `
    Sen Basepound içinde çalışan elit bir iş analisti, satış stratejisti ve dijital büyüme danışmanısın.
    Görevin sıradan, jenerik veya yüzeysel analizler üretmek DEĞİLDİR.
    Gerçek bir ticari zekayla derinlemesine düşünerek aşağıdaki işletmeyi analiz etmelisin.

    İşletme Bilgileri:
    İşletme Adı: ${business.name}
    Kategori: ${business.category}
    Google Puanı: ${business.rating || "Yok"} (${business.review_count || 0} yorum)
    Web Sitesi Durumu: ${analysis.status}
    Mobil Uyumluluk: ${analysis.mobile_responsive ? "Evet" : "Hayır (Acil düzeltilmeli)"}
    Site Hızı: ${analysis.is_slow ? "Çok Yavaş (>2.5s)" : "Normal"}
    SSL Güvenliği: ${analysis.has_ssl ? "Var" : "Yok (Tehlikeli)"}
    Sosyal Medya Linkleri Var Mı: ${analysis.has_social_links ? "Evet" : "Hayır"}
    E-posta Bulundu Mu: ${enrichment.primary_email ? "Evet" : "Hayır"}

    ÖNEMLİ KURALLAR:
    - Sadece teknik değil, TİCARİ ve PREDICTIVE (Öngörüsel) bir analiz yap.
    - "Neden ŞİMDİ aranmalı?" sorusuna net cevap veren sinyaller (Why Now Signals) bul.
    - Satışa Hazırlık (Sales Readiness) ve Aciliyet (Urgency) skorlarını 0-100 arası belirle.
    
    SADECE AŞAĞIDAKİ JSON FORMATINDA CEVAP VER:
    {
      "ai_score": [0-100 arası genel fırsat puanı],
      "urgency_score": [0-100 arası işletmenin acil dijital yatırıma ihtiyacı],
      "sales_readiness": [0-100 arası satışı kapatma ihtimali],
      "buy_intent": "High" | "Medium" | "Low",
      "why_now_signals": [
        "İşletmenin NEDEN ŞİMDİ aranması gerektiğini gösteren 2-3 acil tetikleyici. Örn: 'Rakipleri büyürken web sitesi çökmüş', 'Çok fazla olumsuz yorum birikiyor acil itibar yönetimi şart'"
      ],
      "opportunity_summary": [
        "Sadece 3-5 kelimelik, 3 veya 4 adet net tespit."
      ],
      "suggested_services": [
        "İşletmeye satılabilecek 3 net hizmet."
      ],
      "ai_tags": [
        "Kısa 2 veya 3 tag. Örn: 'URGENT REBRANDING', 'WEAK SEO'"
      ],
      "growth_potential": "Yüksek" | "Orta" | "Düşük"
    }
  `;

  const modelsToTry = [
    "google/gemini-2.5-flash:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openai/gpt-4o-mini"
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
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
    return mockAIScore();
  }
}

function mockAIScore(): AIScoreResult {
  const structuredReason = JSON.stringify({
    summary: ["Web sitesi çok eski", "SEO çalışması yapılmamış", "Mobil görünüm bozuk"],
    services: ["Premium Web Tasarımı", "Kurumsal SEO", "Sosyal Medya Yönetimi"],
    tags: ["HIGH SEO OPPORTUNITY", "WEAK BRANDING"]
  });

  return {
    ai_score: Math.floor(Math.random() * 40) + 60, // 60-100
    opportunity_reason: structuredReason,
    growth_potential: "Yüksek",
    urgency_score: Math.floor(Math.random() * 30) + 70,
    sales_readiness: 65,
    buy_intent: "High",
    why_now_signals: ["Web sitesi tepki vermiyor", "Rakipler dijitalleşirken geride kalmış"]
  };
}
