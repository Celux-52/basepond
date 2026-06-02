import { BaseAgent } from '../core/base.agent';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export interface ParsedQuery {
  targetCount: number;
  queries: string[];
  category: string;
}

export class QueryParserAgent extends BaseAgent<string, ParsedQuery> {
  private apiKey: string;

  constructor() {
    super('QueryParserAgent');
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is missing in .env.local");
    this.apiKey = key;
  }

  async execute(rawInput: string): Promise<ParsedQuery> {
    const fallback: ParsedQuery = {
      targetCount: 100,
      queries: [rawInput],
      category: "Genel"
    };

    const prompt = `Sen büyük ölçekli B2B arama sistemleri için gelen doğal dil isteklerini analiz eden bir veri mühendisisin.
    
    GÖREVİN:
    Aşağıdaki kullanıcı mesajını analiz et ve 3 bilgi çıkar:
    1. "targetCount": İstenen toplam veri adedi. Kullanıcı net bir sayı belirtmişse onu al (Örn: "1000 tane" -> 1000, "en az 1000" -> 1000, "500 adet" -> 500). Eğer hiçbir sayı belirtilmemişse varsayılan olarak 100 değerini ata.
    2. "queries": Google Maps aramalarında en yüksek performansı verecek ve hedef sayıya ulaşmayı sağlayacak şekilde genişletilmiş arama terimleri dizisi. Arama terimlerini konum (ilçe/şehir) ve sektör kelimelerini birleştirerek üret (Örn: "İstanbul'da 1000 lüks restoran bul" -> ["Kadıköy lüks restoran", "Beşiktaş lüks restoran", "Şişli lüks restoran", "Sarıyer lüks restoran", "Bakırköy lüks restoran", "Ataşehir lüks restoran"]). Konumları Türkiye'nin en aktif bölgelerine göre yapay zekanınla tahmin et. En az 5-10 farklı alt sorgu üret ki hedef sayıya (örn. 1000) ulaşabilsin.
    3. "category": Aramanın ana sektörü (Örn: "Restoran", "Kuaför", "Diş Hekimi").

    KULLANICI MESAJI:
    "${rawInput}"

    Lütfen AŞAĞIDAKİ JSON FORMATINDA cevap ver (Asla markdown veya açıklama yazma, sadece saf JSON döndür):
    {
      "targetCount": number,
      "queries": string[],
      "category": "string"
    }
    `;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          models: [
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemini-2.5-flash",
            "openai/gpt-4o-mini",
            "meta-llama/llama-3.3-70b-instruct"
          ],
          route: "fallback",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        this.error(`OpenRouter API Error in QueryParserAgent: ${response.status}`);
        return fallback;
      }

      const data = await response.json();
      let text = data.choices?.[0]?.message?.content || "";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text) as ParsedQuery;
    } catch (e: any) {
      this.error(`Query parsing failed for: ${rawInput}`, e.message);
      return fallback;
    }
  }
}
