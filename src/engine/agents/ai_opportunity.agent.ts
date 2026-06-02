import { BaseAgent } from '../core/base.agent';
import { CostManagerService } from '../services/cost-manager.service';
import { CONFIG } from '../config';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export interface OpportunityInput {
  businessName: string;
  category: string;
  rating: number;
  hasWebsite: boolean;
  hasSocial: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  reviewCount: number;
  websiteSignals: string[];
  htmlSnippet: string;
}

export interface OpportunityOutput {
  ai_score: number;
  opportunity_analysis: string;
  sales_readiness: string;
  purchase_intent: 'High' | 'Medium' | 'Low';
  why_now: string;
  recommended_services: string[];
  confidence_score: number;
  signals: string[];
}

export class AIOpportunityAgent extends BaseAgent<OpportunityInput, OpportunityOutput> {
  private apiKey: string;

  constructor() {
    super('AIOpportunityAgent');
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is missing in .env.local");
    this.apiKey = key;
  }

  async execute(input: OpportunityInput): Promise<OpportunityOutput> {
    const fallback: OpportunityOutput = {
      ai_score: 50,
      opportunity_analysis: "AI analizi yapılamadı, varsayılan değerler atandı.",
      sales_readiness: "Orta",
      purchase_intent: "Medium",
      why_now: "Veri yetersiz",
      recommended_services: ["Genel Analiz"],
      confidence_score: 50,
      signals: input.websiteSignals || []
    };

    const rules = (CONFIG as any).SECTOR_RULES[input.category] || (CONFIG as any).SECTOR_RULES["default"];
    const focusPoints = rules.focus.join(', ');

    const prompt = `Sen kıdemli bir B2B Satış Stratejistisin. Görevin, bir işletmenin satış potansiyelini analiz etmek ve 19 kritik satış kozunu tespit etmektir.
    
    İŞLETME BİLGİLERİ:
    Adı: ${input.businessName}
    Sektör: ${input.category}
    Puanı: ${input.rating} (Yorum Sayısı: ${input.reviewCount})
    Web Sitesi Var Mı: ${input.hasWebsite ? 'Var' : 'Yok'}
    Sosyal Medya Var Mı: ${input.hasSocial ? 'Var' : 'Yok'}
    E-Posta: ${input.hasEmail ? 'Var' : 'Yok'}
    Telefon: ${input.hasPhone ? 'Var' : 'Yok'}
    
    MEVCUT SİNYALLER (Web Analizi):
    ${input.websiteSignals.join(', ')}

    WEB SİTESİ HTML ÖZETİ (Görsellik ve İçerik Analizi İçin):
    "${input.htmlSnippet}"

    ANALİZ GÖREVİ:
    Yukarıdaki verilere bakarak, aşağıdaki sinyallerden (Satış Kozlarından) geçerli olanları TAM VE BİREBİR AYNI METİNLE belirle ve "signals" dizisine ekle:
    1. "Web sitesi yok" (Eğer hasWebsite yoksa)
    2. "Web sitesi çalışmıyor" (websiteSignals içinde varsa)
    3. "Mobil uyumsuz web sitesi" (websiteSignals içinde varsa)
    4. "SSL sertifikası yok" (websiteSignals içinde varsa)
    5. "Web sitesi eski tasarım" (HTML özetinde telif hakkı 2020 öncesiyse, çok kısaysa veya profesyonel durmuyorsa)
    6. "SEO sorunları mevcut" (websiteSignals içinde varsa)
    7. "İletişim formu yok" (websiteSignals içinde varsa)
    8. "Sosyal medya bağlantıları eksik" (hasSocial yoksa veya zayıfsa)
    9. "Google puanı 4'ün altında" (rating < 4 ise)
    10. "Google yorumu 50'nin altında" (reviewCount < 50 ise)
    11. "Google yorumu 10'un altında" (reviewCount < 10 ise)
    12. "Telefon numarası mevcut" (hasPhone varsa)
    13. "E-posta mevcut" (hasEmail varsa)
    14. "Yüksek satış potansiyeli" (Puanı yüksek ve parası var gibi duruyorsa ama dijital varlığı eksikse ekle)

    ÖNEMLİ: Mevcut web sinyallerini (websiteSignals) koruyarak, bulduğun yeni sinyallerle birleştir.

    Lütfen AŞAĞIDAKİ JSON FORMATINDA cevap ver (Asla markdown kullanma, sadece saf JSON):
    {
      "ai_score": (0-100 arası, eksiklere göre düşür, potansiyele göre artır),
      "opportunity_analysis": "(1 cümlelik fırsat sebebi)",
      "sales_readiness": "Sıcak|Ilık|Soğuk",
      "purchase_intent": "High|Medium|Low",
      "why_now": "(Neden şimdi ulaşılmalı?)",
      "recommended_services": ["(Önerilen ürün kategorisi 1)", "(Kategori 2)"],
      "confidence_score": (0-100 arası),
      "signals": ["Google puanı 4'ün altında", "Web sitesi eski tasarım"]
    }
    `;

    try {
      if (CONFIG.COST_TRACKING_ENABLED) {
        CostManagerService.trackOpenRouterCall();
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${this.apiKey}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          models: [
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemma-2-9b-it:free",
            "openai/gpt-4o-mini"
          ], 
          route: "fallback",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        this.error(`OpenRouter API Error: ${response.status}`);
        return fallback;
      }

      const data = await response.json();
      let text = data.choices?.[0]?.message?.content || "";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text) as OpportunityOutput;
    } catch (e: any) {
      this.error(`AI Analysis failed for ${input.businessName}`, e.message);
      return fallback;
    }
  }
}
