import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { businessName, category, signals, whyNow, opportunityAnalysis, phone } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const safeSignals = Array.isArray(signals) ? signals : [];

    // Sabit Hat kontrolü (Regex Düzeltmesi)
    // Sadece rakamları al. (Örn: +90 555 -> 90555, 0850 -> 0850)
    const cleanDigits = phone ? phone.replace(/\D/g, '') : '';
    // Türkiye'de cep numaraları 905, 05 veya sadece 5 ile başlar. Başındaki "0" tuzağı eklendi.
    const isMobile = cleanDigits ? /^(0|90|0090)?5\d{9}$/.test(cleanDigits) : true;

    const prompt = `Sen çok meşgul, müşteriye muhtaç olmayan, "Tok Satıcı" ve danışman rolünde bir B2B uzmanısın.
Görev: Karşıdaki işletme sahibini merak ve hafif bir panikle sana dönüş yapmaya zorlamak. "Ben yaparım, ben satarım" gibi laflar YASAK.

Hedef Müşteri: ${businessName || 'Belirtilmemiş'}
Sektör: ${category || 'Belirtilmemiş'}
Yapay Zeka Fırsat Analizi: ${opportunityAnalysis || 'Belirtilmemiş'}
Neden Şimdi Ulaşmalı?: ${whyNow || 'Belirtilmemiş'}
Eksiklikleri (Sinyaller): ${safeSignals.join(', ')}

KATI KURALLAR (BUNLARA UYMAZSAN ÇUVALLARIZ):
1. ASLA "Umarım bu e-posta sizi iyi bulur", "İyi günler dilerim" gibi robotik klişeler KULLANMA.
2. Agresif veya kurnaz olma. Şöyle de: "Bölgedeki firmaları tararken denk geldim, sitenizde şu eksik, reklam bütçeniz boşa gidiyor haberiniz olsun. Vaktim yok ama kendi IT'cinize acil kontrol ettirin."
3. Müşteriye "Muhtaç değilmiş" gibi davran.
4. KANCA AT (The Hook): Müşteriye soru sorma, süre dayat. Şunun gibi bir kanca kullan: "İçeride bu işi yapacak kimseniz yoksa; Perşembe 14:00 - 14:30 arası ufak bir boşluğum var, o ara WhatsApp'tan yazarsanız hızlıca araya sıkıştırıp bakabilirim."
5. Sinyallerde yazmayan teknik bir kusuru uydurma.

GÖREV: SADECE aşağıdaki JSON formatında cevap ver, dışına hiçbir şey yazma:
{
  ${isMobile ? `"whatsapp": "WhatsApp için kısa, tek elle yazılmış, kancayla biten meşgul bir mesaj...",` : `"coldCallScript": "Bu bir sabit hat. Sekreteri aşıp patrona ulaşmak ve ona kanca atmak için çok zekice bir telefon metni...",`}
  "emailSubject": "...",
  "emailBody": "..."
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { 
        "Authorization": `Bearer ${apiKey}`, 
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

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter Error: ${response.status}`);
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedContent;
    try {
      parsedContent = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', text);
      // Fallback response if the model didn't return valid JSON
      parsedContent = {
        whatsapp: "Merhaba, " + (businessName || 'işletme sahibi') + " olarak dijital varlıklarınızı inceledik. Size özel hazırladığımız fırsat raporunu iletmek istedik.",
        emailSubject: "Dijital Büyüme Fırsatlarınız Hakkında",
        emailBody: text // Put the raw text here so the user can at least see it
      };
    }

    return NextResponse.json(parsedContent);
  } catch (error: any) {
    console.error('Pitch generation error:', error);
    return NextResponse.json({
      whatsapp: "Sistem Uyarı: Şu an global AI ağlarında yoğunluk var, işleminiz sıraya alındı, krediniz iade edildi.",
      coldCallScript: "Sistem Uyarı: Şu an global AI ağlarında yoğunluk var, işleminiz sıraya alındı, krediniz iade edildi.",
      emailSubject: "Sistem Uyarı: AI Ağlarında Yoğunluk",
      emailBody: "Şu an global AI ağlarında yoğunluk var, işleminiz sıraya alındı, krediniz iade edildi. Lütfen daha sonra tekrar deneyin."
    });
  }
}
