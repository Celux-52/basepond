export interface SalesScriptResult {
  summary: string;
  pitch: string;
  opener: string;
  follow_up: string;
  cta: string;
  reason_to_contact: string;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

export async function generateSalesScript(input: any): Promise<SalesScriptResult | null> {
  if (!OPENROUTER_API_KEY) {
    return mockSalesScript(input.name);
  }

  const prompt = `
Sen elit bir satış stratejisti ve metin yazarısın. Aşağıdaki yerel işletmeye dijital hizmet (Web Tasarım, SEO, Sosyal Medya Yönetimi vb.) satmak için kısa, net ve ikna edici bir satış senaryosu hazırlayacaksın.

İŞLETME BİLGİLERİ:
İşletme Adı: ${input.name}
Sektör: ${input.category}
Şehir: ${input.city}
Google Puanı: ${input.rating} (${input.review_count} yorum)
Fırsat Skoru: ${input.ai_score}/100
Zayıflıklar: ${input.weaknesses?.join(', ') || 'Bilinmiyor'}
Önerilen Hizmetler: ${input.services?.join(', ') || 'Kapsamlı Analiz'}

KURALLAR:
- Her işletmeye aynı klişe metni yazma. Sektöre özel konuş.
- Genel, boş ve klişe cümleler kullanma.
- Metin kısa olsun, uzun paragraflar yazma.
- Satış dili doğal, profesyonel ama samimi olsun. Abartılı pazarlama jargonu kullanma.
- İşletmenin ZAYIFLIKLARINI gerçek bir acı noktası (pain point) olarak kullan. Örneğin websitesi yoksa, "Müşterileriniz sizi Google'da aradığında bulamıyor" de. Puanı yüksek ama SEO zayıfsa, "Çok iyi hizmet veriyorsunuz ama rakip firmalar Google'da sizin önünüze geçiyor" de.
- SADECE TÜRKÇE YAZ.

Lütfen tam olarak aşağıdaki JSON formatında, geçerli bir JSON objesi döndür (Markdown formatlaması yapmadan, sadece raw JSON):

{
  "summary": "Kısa satış özeti (Satışçı için not: Bu işletmeye ne satacağız ve neden?)",
  "pitch": "İşletme için kişisel teklif mesajı (E-posta veya DM olarak gönderilebilecek, zayıflıklarına vurup çözüm sunan 3-4 cümlelik mesaj)",
  "opener": "İlk iletişim cümlesi (Telefonda veya mesajda ilk saniyede dikkat çekecek vuruş cümlesi)",
  "follow_up": "Kısa follow-up mesajı (Cevap alınamazsa 3 gün sonra atılacak 1-2 cümlelik hatırlatma)",
  "cta": "Kapanış çağrısı (Harekete geçirici kısa cümle. Örn: 'Bu hafta 10 dakikalık kısa bir görüşme yapalım mı?')",
  "reason_to_contact": "Bu işletmeye neden ŞİMDİ ulaşmalıyız? (Aciliyet belirten kısa bir cümle)"
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
        "HTTP-Referer": "https://snaplead.com", 
        "X-Title": "SnapLead"
      },
      body: JSON.stringify({
        models: modelsToTry,
        route: "fallback",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("No content from AI");

    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary || "",
      pitch: parsed.pitch || "",
      opener: parsed.opener || "",
      follow_up: parsed.follow_up || "",
      cta: parsed.cta || "",
      reason_to_contact: parsed.reason_to_contact || ""
    };
  } catch (error) {
    console.error("AI Script Error:", error);
    return mockSalesScript(input.name);
  }
}

function mockSalesScript(name: string): SalesScriptResult {
  return {
    summary: `${name} firmasının web sitesi bulunmuyor. Acilen premium bir web sitesi satışı yapılmalı.`,
    pitch: `Merhaba ${name} yetkilisi. İşletmenizin Google'daki müşteri potansiyelini inceledim. Hizmetleriniz harika görünüyor ancak web siteniz olmadığı için bölgenizdeki birçok müşteriyi rakiplerinize kaptırıyorsunuz. Size özel hazırladığım dijital büyüme planını paylaşmak isterim.`,
    opener: `Merhaba, bölgenizdeki arama hacimlerini incelerken ${name} olarak ciddi bir dijital potansiyeli kaçırdığınızı fark ettim.`,
    follow_up: `Merhaba, dünkü mesajımla ilgili fırsat bulabildiniz mi? Sadece 10 dakikada size potansiyelinizi göstermek isterim.`,
    cta: `Bu Perşembe öğleden sonra 10 dakikalık kısa bir telefon görüşmesi yapalım mı?`,
    reason_to_contact: `Rakipleri dijitalde agresif büyüyor, eğer web sitesini şimdi kurmazsa yerel pazardaki görünürlüğü sıfıra inecek.`
  };
}
