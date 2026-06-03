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

    // Sabit Hat kontrolü
    const isMobile = phone ? /^(\+90|0)?5\d{9}$/.test(phone.replace(/\D/g, '')) : true;

    const prompt = `Sen çok meşgul, müşteriye muhtaç olmayan, "Tok Satıcı" ve danışman rolünde bir B2B uzmanısın.
Görev: Karşıdaki işletme sahibini merak ve hafif bir panikle sana dönüş yapmaya zorlamak. "Ben yaparım, ben satarım" gibi laflar YASAK.

Hedef Müşteri: ${businessName || 'Belirtilmemiş'}
Sektör: ${category || 'Belirtilmemiş'}
Yapay Zeka Fırsat Analizi: ${opportunityAnalysis || 'Belirtilmemiş'}
Neden Şimdi Ulaşmalı?: ${whyNow || 'Belirtilmemiş'}
Eksiklikleri (Sinyaller): ${safeSignals.join(', ')}

KATI KURALLAR (BUNLARA UYMAZSAN ÇUVALLARIZ):
1. ASLA "Umarım bu e-posta sizi iyi bulur", "İyi günler dilerim" gibi robotik klişeler KULLANMA.
2. Agresif veya kurnaz olma. "Siteniz bozuk ben yapayım" deme. Şöyle de: "Bölgedeki firmaları tararken denk geldim, sitenizde şu eksik, reklam bütçeniz boşa gidiyor haberiniz olsun. Vaktim yok ama kendi IT'cinize acil kontrol ettirin."
3. Müşteriye "Muhtaç değilmiş" gibi davran. Bu sayede sana "Siz bakamaz mısınız?" diye dönecek.
4. E-posta şablonunun konu başlığı merak uyandırıcı olsun.
5. Sinyallerde yazmayan teknik bir kusuru uydurma.

GÖREV: SADECE aşağıdaki JSON formatında cevap ver, dışına hiçbir şey yazma:
{
  ${isMobile ? `"whatsapp": "WhatsApp için kısa, tek elle yazılmış gibi meşgul bir mesaj...",` : `"coldCallScript": "Bu bir sabit hat. Çıkan sekreteri aşmak ve patrona bağlanmak için kullanılacak zekice bir telefon konuşması metni...",`}
  "emailSubject": "...",
  "emailBody": "..."
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
