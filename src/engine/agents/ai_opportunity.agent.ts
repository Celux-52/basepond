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
}

export interface OpportunityOutput {
  ai_score: number;
  opportunity_analysis: string;
  sales_readiness: string;
  purchase_intent: 'High' | 'Medium' | 'Low';
  why_now: string;
  recommended_services: string[];
  confidence_score: number;
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
      confidence_score: 50
    };

    const rules = (CONFIG as any).SECTOR_RULES[input.category] || (CONFIG as any).SECTOR_RULES["default"];
    const focusPoints = rules.focus.join(', ');

    const prompt = `Sen kıdemli bir B2B Satış Stratejistisin. Görevin, bir işletmenin toptancı için ne kadar iyi bir müşteri olabileceğini analiz etmek.
    
    İŞLETME BİLGİLERİ:
    Adı: ${input.businessName}
    Sektör: ${input.category}
    Puanı: ${input.rating}
    Web Sitesi Var Mı: ${input.hasWebsite ? 'Var' : 'Yok'}
    Sosyal Medya Var Mı: ${input.hasSocial ? 'Var' : 'Yok'}
    E-Posta İletişimi: ${input.hasEmail ? 'Var' : 'Yok'}

    ANALİZ ODAĞI (${rules.primaryScore}):
    Bu sektör için özellikle şu kriterlere odaklanmalısın: ${focusPoints}.
      
      Lütfen AŞAĞIDAKİ JSON FORMATINDA cevap ver (Asla markdown kullanma, sadece saf JSON):
      {
        "ai_score": (0-100 arası),
        "opportunity_analysis": "(1 cümlelik fırsat sebebi)",
        "sales_readiness": "Sıcak|Ilık|Soğuk",
        "purchase_intent": "High|Medium|Low",
        "why_now": "(Neden şimdi ulaşılmalı?)",
        "recommended_services": ["(Önerilen ürün kategorisi 1)", "(Kategori 2)"],
        "confidence_score": (0-100 arası)
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
